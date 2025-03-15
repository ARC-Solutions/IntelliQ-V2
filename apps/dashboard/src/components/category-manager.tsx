"use client"

import type React from "react"

import { useState, useCallback } from "react"

// Define base seed categories to start with
const baseSeedCategories = {
  sports: ["formula 1", "f1", "basketball", "football", "soccer", "tennis", "golf", "racing", "nba", "sports"],
  academics: [
    "math",
    "science",
    "history",
    "geography",
    "literature",
    "physics",
    "chemistry",
    "biology",
    "academics",
    "school",
    "education",
  ],
  entertainment: ["movies", "music", "anime", "games", "tv shows", "books", "entertainment", "media", "fun"],
  technology: ["programming", "computers", "ai", "machine learning", "web development", "coding", "tech", "software"],
}

// Word relationships for automatic categorization
const wordRelationships = [
  // Academic subjects and their parent categories
  { word: "math", related: ["algebra", "calculus", "geometry", "mathematics", "school", "academics", "education"] },
  { word: "science", related: ["physics", "chemistry", "biology", "scientific", "school", "academics", "education"] },
  {
    word: "history",
    related: ["historical", "past", "ancient", "medieval", "modern", "school", "academics", "education"],
  },

  // Sports and their parent categories
  { word: "f1", related: ["formula 1", "racing", "motorsport", "cars", "sports"] },
  { word: "basketball", related: ["nba", "hoops", "court", "sports", "team sports"] },
  { word: "football", related: ["soccer", "nfl", "sports", "team sports"] },

  // Entertainment and their parent categories
  { word: "anime", related: ["japan", "manga", "animation", "entertainment", "media"] },
  { word: "games", related: ["gaming", "video games", "entertainment", "fun"] },

  // Technology and their parent categories
  { word: "programming", related: ["coding", "development", "software", "computers", "technology"] },
  { word: "ai", related: ["artificial intelligence", "machine learning", "technology", "computing"] },
]

interface CategoryManagerProps {
  children: React.ReactNode
}

export interface CategoryContextType {
  categories: Record<string, string[]>
  findBestCategoryMatch: (searchTerm: string) => CategoryMatch | null
  extractTagsFromData: (data: any[]) => string[]
  updateCategories: (newTags: string[]) => void
}

export interface CategoryMatch {
  category: string
  tags: string[]
  originalSearch: string
}

export const useCategoryManager = (): CategoryContextType => {
  const [categories, setCategories] = useState<Record<string, string[]>>(baseSeedCategories)

  // Function to extract all unique tags from a dataset
  const extractTagsFromData = useCallback((items: any[]): string[] => {
    const allTags = new Set<string>()

    items.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => {
          allTags.add(tag.toLowerCase())
        })
      }
    })

    return Array.from(allTags)
  }, [])

  // Function to automatically generate category aliases based on tag relationships
  const generateCategoryAliases = useCallback((existingTags: string[]): Record<string, string[]> => {
    // Start with our base seed categories
    const generatedCategories: Record<string, string[]> = { ...baseSeedCategories }

    // Track all aliases we've created to avoid duplicates
    const processedAliases = new Set<string>(Object.keys(generatedCategories))

    // First pass: Add all existing tags to their appropriate categories
    existingTags.forEach((tag) => {
      // Find which categories this tag belongs to based on word relationships
      for (const relationship of wordRelationships) {
        if (tag.includes(relationship.word) || relationship.word.includes(tag)) {
          // Add this tag to all related categories
          relationship.related.forEach((relatedCategory) => {
            if (!processedAliases.has(relatedCategory)) {
              generatedCategories[relatedCategory] = []
              processedAliases.add(relatedCategory)
            }

            // Add the tag to this category if it's not already there
            if (generatedCategories[relatedCategory] && !generatedCategories[relatedCategory].includes(tag)) {
              generatedCategories[relatedCategory].push(tag)
            }
          })
        }
      }
    })

    // Second pass: Generate parent-child relationships between categories
    for (const relationship of wordRelationships) {
      const word = relationship.word
      const related = relationship.related

      // If we have this word as a category
      if (generatedCategories[word]) {
        // Add all its tags to related parent categories
        related.forEach((relatedCategory) => {
          if (generatedCategories[relatedCategory]) {
            generatedCategories[word].forEach((tag) => {
              if (!generatedCategories[relatedCategory].includes(tag)) {
                generatedCategories[relatedCategory].push(tag)
              }
            })
          }
        })
      }
    }

    // Third pass: Create composite categories for common search terms
    // For example, "school subjects" might include math, science, history
    const compositeCategories: Record<string, string[]> = {
      "school subjects": [],
      "team sports": [],
      sciences: [],
      coding: [],
    }

    // Populate composite categories
    if (generatedCategories["math"]) {
      compositeCategories["school subjects"].push(...generatedCategories["math"])
    }
    if (generatedCategories["science"]) {
      compositeCategories["school subjects"].push(...generatedCategories["science"])
      compositeCategories["sciences"].push(...generatedCategories["science"])
    }
    if (generatedCategories["history"]) {
      compositeCategories["school subjects"].push(...generatedCategories["history"])
    }
    if (generatedCategories["basketball"]) {
      compositeCategories["team sports"].push(...generatedCategories["basketball"])
    }
    if (generatedCategories["football"]) {
      compositeCategories["team sports"].push(...generatedCategories["football"])
    }
    if (generatedCategories["programming"]) {
      compositeCategories["coding"].push(...generatedCategories["programming"])
    }

    // Add composite categories to our generated categories
    Object.entries(compositeCategories).forEach(([category, tags]) => {
      if (tags.length > 0 && !processedAliases.has(category)) {
        generatedCategories[category] = [...new Set(tags)] // Remove duplicates
        processedAliases.add(category)
      }
    })

    return generatedCategories
  }, [])

  // Function to find the best category for a search term
  const findBestCategoryMatch = useCallback(
    (searchTerm: string): CategoryMatch | null => {
      const term = searchTerm.toLowerCase().trim()

      // Direct category match
      if (categories[term]) {
        return {
          category: term,
          tags: categories[term],
          originalSearch: term,
        }
      }

      // Check if the term is contained in any category name
      for (const [category, tags] of Object.entries(categories)) {
        if (category.includes(term) || term.includes(category)) {
          return {
            category,
            tags,
            originalSearch: term,
          }
        }
      }

      // Check if the term matches any tag in any category
      for (const [category, tags] of Object.entries(categories)) {
        if (tags.some((tag) => tag.includes(term) || term.includes(tag))) {
          return {
            category,
            tags,
            originalSearch: term,
          }
        }
      }

      // No match found
      return null
    },
    [categories],
  )

  // Function to update categories with new tags
  const updateCategories = useCallback(
    (newTags: string[]) => {
      setCategories(generateCategoryAliases(newTags))
    },
    [generateCategoryAliases],
  )

  return {
    categories,
    findBestCategoryMatch,
    extractTagsFromData,
    updateCategories,
  }
}

export function CategoryManager({ children }: CategoryManagerProps) {
  return children
}

