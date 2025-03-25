'use client';
import { useEffect, useState } from 'react';

import { HistoryCard } from '@/components/history-page/history-card';
import { MenuBar } from '@/components/history-page/menu-bar';
import { Pagination } from '@/components/history-page/pagination';
import { SkeletonCard } from '@/components/history-page/skeleton-card';
import { Button } from '@/components/ui/button';
import type { Filter } from '@/components/ui/filters';
import { FilterType } from '@/components/ui/filters';
import { toast } from '@/components/ui/use-toast';
import { createApiClient } from '@/utils/api-client';

interface QuizHistory {
  id: string;
  title: string;
  date: string;
  score: number | null;
  correct: number | null;
  incorrect: number | null;
  totalTime?: string;
  passed?: boolean;
  type: string;
  isBookmarked?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function HistoryPage() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [allQuizHistory, setAllQuizHistory] = useState<QuizHistory[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [availableTags, setAvailableTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
    fetchQuizHistory(1);
  }, [filters]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setQuizHistory(allQuizHistory);
    } else {
      const query = searchQuery.trim().toLowerCase();
      const filtered = allQuizHistory.filter((item) => item.title.toLowerCase().includes(query));
      setQuizHistory(filtered);

      const totalPages = Math.ceil(filtered.length / pagination.limit);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        totalItems: filtered.length,
        totalPages,
        hasNextPage: 1 < totalPages,
        hasPreviousPage: false,
      }));
    }
  }, [searchQuery, allQuizHistory]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const client = createApiClient();
        const response = await client.api.v1.analysis['top-tags'].$get();
        if (!response.ok) {
          throw new Error(`Failed to fetch tags: ${response.status}`);
        }
        const data = await response.json();
        setAvailableTags(data.tags);
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };

    fetchTags();
  }, []);

  const fetchQuizHistory = async (pageNumber = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const client = createApiClient();

      const typeFilter = filters.find((f) => f.type === FilterType.TYPE)?.value[0];
      const statusFilter = filters.find((f) => f.type === FilterType.STATUS)?.value[0];
      const tagsFilter = filters.find((f) => f.type === FilterType.TAGS)?.value[0];

      const response = await client.api.v1.history.$get({
        query: {
          status:
            statusFilter === 'Passed' ? 'true' : statusFilter === 'Failed' ? 'false' : undefined,
          tags: tagsFilter?.toLowerCase().replace(' ', '_'),
          type: typeFilter?.toLowerCase(),
          page: pageNumber.toString(),
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const responseData = await response.json();

      const mappedQuizzes = responseData.data.map(
        (item: any): QuizHistory => ({
          id: item.id,
          title: item.title,
          date: item.date,
          score: item.score,
          correct: item.correct,
          incorrect: item.incorrect || 0,
          totalTime: item.totalTime,
          passed: item.passed,
          type: item.type || 'singleplayer',
          isBookmarked: item.isBookmarked,
        }),
      );

      setAllQuizHistory(mappedQuizzes);

      if (searchQuery.trim() === '') {
        setQuizHistory(mappedQuizzes);
      } else {
        const query = searchQuery.trim().toLowerCase();
        const filtered = mappedQuizzes.filter((item) => item.title.toLowerCase().includes(query));
        setQuizHistory(filtered);
      }

      setPagination(responseData.pagination);
    } catch (err) {
      console.error('Error fetching quiz history:', err);
      setError('Failed to load quiz history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
    fetchQuizHistory(newPage);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchQuizHistory();
      return;
    }

    setIsSearching(true);
    setIsLoading(true);

    try {
      const client = createApiClient();
      const response = await client.api.v1.history.search.$post({
        json: {
          query: searchQuery,
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      const responseData = await response.json();
      setQuizHistory(responseData.data);
      setPagination(responseData.pagination);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search failed',
        description: 'Could not search quizzes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChangeWithSearch = async (page: number) => {
    if (isSearching && searchQuery) {
      setIsLoading(true);
      try {
        const client = createApiClient();
        const response = await client.api.v1.history.search.$post({
          json: {
            query: searchQuery,
            page,
            limit: pagination.limit,
          },
        });

        const responseData = await response.json();
        setQuizHistory(responseData.data);
        setPagination({
          ...responseData.pagination,
          page,
        });
      } catch (error) {
        console.error('Search pagination error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      handlePageChange(page);
    }
  };

  const skeletonCards = Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />);

  return (
    <div className='min-h-screen flex flex-col items-center py-8 px-4'>
      <div className='w-full max-w-4xl space-y-8'>
        <div className='flex items-center justify-center'>
          <h1 className='text-2xl font-bold'>Quiz History</h1>
        </div>

        <MenuBar
          filters={filters}
          setFilters={setFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          availableTags={availableTags}
          onSearch={handleSearch}
        />

        {error && (
          <div className='bg-destructive/20 text-destructive p-4 rounded-lg text-center'>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>{skeletonCards}</div>
        ) : (
          <>
            {isSearching && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span>Search results for: "{searchQuery}"</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                    fetchQuizHistory();
                  }}
                  className='h-6 px-2'
                >
                  Clear
                </Button>
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {quizHistory.map((item) => (
                <HistoryCard key={item.id} {...item} isBookmarked={item.isBookmarked} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChangeWithSearch}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
