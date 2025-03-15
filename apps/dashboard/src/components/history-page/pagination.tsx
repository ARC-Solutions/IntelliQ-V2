"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function Pagination({ currentPage, totalPages, onPageChange, hasNextPage, hasPreviousPage }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const displayPages = pages.reduce(
    (acc, page) => {
      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
        acc.push(page)
      } else if (
        (page === currentPage - 2 && currentPage > 3) ||
        (page === currentPage + 2 && currentPage < totalPages - 2)
      ) {
        acc.push("...")
      }
      return acc
    },
    [] as (number | string)[],
  )

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        className="border-[#c8b6ff]/20 text-[#c8b6ff] hover:bg-[#c8b6ff]/10 hover:text-[#c8b6ff]"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      {displayPages.map((page, index) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${index}`} className="text-[#c8b6ff]/70">
              ...
            </span>
          )
        }

        const isCurrentPage = page === currentPage

        return (
          <motion.button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`
              relative px-3.5 py-2 rounded-lg text-sm font-medium
              ${isCurrentPage ? "text-[#c8b6ff]" : "text-[#c8b6ff]/70 hover:text-[#c8b6ff]"}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isCurrentPage && (
              <motion.div
                layoutId="activePage"
                className="absolute inset-0 bg-[#c8b6ff]/10 rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{page}</span>
          </motion.button>
        )
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="border-[#c8b6ff]/20 text-[#c8b6ff] hover:bg-[#c8b6ff]/10 hover:text-[#c8b6ff]"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  )
}

