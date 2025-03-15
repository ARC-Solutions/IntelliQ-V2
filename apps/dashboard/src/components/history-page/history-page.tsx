"use client"
import { useEffect, useState } from "react"

import { MenuBar } from "@/components/history-page/menu-bar"
import { HistoryCard } from "@/components/history-page/history-card"
import { Pagination } from "@/components/history-page/pagination"
import { SkeletonCard } from "@/components/history-page/skeleton-card"
import { createApiClient } from "@/utils/api-client"
import type { Filter } from "@/components/ui/filters"
import { FilterType } from "@/components/ui/filters"

interface QuizHistory {
  id: string
  quiz_title: string
  created_at: string
  score: number | null
  correct: number | null
  incorrect: number | null
  totalTime: string
}

interface PaginationInfo {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function HistoryPage() {
  const [filters, setFilters] = useState<Filter[]>([])
  const [allQuizHistory, setAllQuizHistory] = useState<QuizHistory[]>([])
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }))
    fetchQuizHistory(1)
  }, [filters]) 

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setQuizHistory(allQuizHistory)
    } else {
      const query = searchQuery.trim().toLowerCase()
      const filtered = allQuizHistory.filter(item => 
        item.quiz_title.toLowerCase().includes(query)
      )
      setQuizHistory(filtered)
      
      const totalPages = Math.ceil(filtered.length / pagination.limit)
      setPagination(prev => ({
        ...prev,
        page: 1,
        totalItems: filtered.length,
        totalPages,
        hasNextPage: 1 < totalPages,
        hasPreviousPage: false
      }))
    }
  }, [searchQuery, allQuizHistory])

  const fetchQuizHistory = async (pageNumber = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const client = createApiClient()

      const typeFilter = filters.find((f) => f.type === FilterType.TYPE)?.value[0]
      const statusFilter = filters.find((f) => f.type === FilterType.STATUS)?.value[0]
      const tagsFilter = filters.find((f) => f.type === FilterType.TAGS)?.value[0]

      const response = await client.api.v1.history.$get({
        query: {
          type: "singleplayer",
          status: statusFilter,
          tags: tagsFilter
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const responseData = await response.json()

      const mappedQuizzes = responseData.data.map((item: any) => ({
        id: item.id,
        quiz_title: item.title,
        created_at: item.date,
        score: item.score,
        correct: item.correct,
        incorrect: item.incorrect || 0,
        totalTime: item.totalTime,  
      }))

      setAllQuizHistory(mappedQuizzes)
      
      if (searchQuery.trim() === "") {
        setQuizHistory(mappedQuizzes)
      } else {
        const query = searchQuery.trim().toLowerCase()
        const filtered = mappedQuizzes.filter(item => 
          item.quiz_title.toLowerCase().includes(query)
        )
        setQuizHistory(filtered)
      }
      
      setPagination(responseData.pagination)
    } catch (err) {
      console.error("Error fetching quiz history:", err)
      setError("Failed to load quiz history. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }))
    fetchQuizHistory(newPage)
  }

  const skeletonCards = Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-4xl space-y-8">
        <MenuBar filters={filters} setFilters={setFilters} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {error && <div className="bg-destructive/20 text-destructive p-4 rounded-lg text-center">{error}</div>}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{skeletonCards}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizHistory.map((item) => (
                <HistoryCard key={item.id} {...item} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
