'use client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { createApiClient } from '@/utils/api-client';
import { useQuiz } from '@/contexts/quiz-context';
import { useRouter } from 'next/navigation';
import { ShareButton } from './share-button'; // Import the ShareButton

export interface HistoryCardProps {
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
  onBookmarkToggle?: () => void;
}

export function HistoryCard({
  id = '',
  title = '',
  score = null,
  totalTime = '',
  date = '',
  incorrect = null,
  correct = null,
  passed = false,
  type = 'practice',
  isBookmarked = false,
  onBookmarkToggle,
}: Partial<HistoryCardProps>) {
  const [isBookmarkedState, setIsBookmarkedState] = useState(isBookmarked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { getSinglePlayerSummary, summaryQuiz } = useQuiz();

  useEffect(() => {
    if (summaryQuiz) {
      router.push(`/single-player/summary/${id}`);
    }
  }, [summaryQuiz]);

  useEffect(() => {
    setIsBookmarkedState(isBookmarked);
  }, [isBookmarked]);

  const toggleBookmark = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setIsAnimating(true);

    try {
      const client = createApiClient();
      if (isBookmarkedState) {
        await client.api.v1.bookmarks[':id'].$delete({
          param: { id },
        });
      } else {
        await client.api.v1.bookmarks[':id'].$post({
          param: { id },
        });
      }

      setTimeout(() => {
        setIsBookmarkedState(!isBookmarkedState);
        setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      }, 150);

      if (onBookmarkToggle) {
        onBookmarkToggle();
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      setIsAnimating(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Format tags based on quiz type
  const tags =
    type === 'multiplayer'
      ? [
          `Score: ${score !== null ? `${score}` : 'N/A'}`,
          `Correct: ${correct ?? 'N/A'}`,
          `Incorrect: ${incorrect ?? 'N/A'}`,
        ]
      : [
          `Score: ${score !== null ? `${score.toFixed(2)}%` : 'N/A'}`,
          `Time: ${totalTime ?? 'N/A'}`,
          `Correct: ${correct ?? 'N/A'}`,
          `Incorrect: ${incorrect ?? 'N/A'}`,
        ];

  return (
    <Card className='bg-[#f8f8ff] border-[#c8b6ff]/20 dark:bg-[#0c0d0d]'>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle
              onClick={() => {
                getSinglePlayerSummary(id);
              }}
              className='text-[#c8b6ff] cursor-pointer'
            >
              {title}
            </CardTitle>
            <CardDescription className='text-black/70 dark:text-white/70'>{date}</CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <ShareButton 
              quizId={id} 
              type={type === 'multiplayer' ? 'multiplayer' : 'singleplayer'} 
              isFromHistory={true} 
            />
            <button
              onClick={toggleBookmark}
              className='text-[#c8b6ff] hover:text-[#c8b6ff]/80 transition-colors'
              aria-label={isBookmarkedState ? 'Remove bookmark' : 'Add bookmark'}
              type='button'
            >
              <div className='relative w-6 h-6'>
                {isBookmarkedState ? (
                  <BookmarkCheck
                    className={`absolute transition-all duration-300 ${
                      isAnimating
                        ? 'opacity-0 scale-75 rotate-12'
                        : 'opacity-100 scale-100 rotate-0'
                    }`}
                  />
                ) : (
                  <Bookmark
                    className={`absolute transition-all duration-300 ${
                      isAnimating
                        ? 'opacity-0 scale-75 -rotate-12'
                        : 'opacity-100 scale-100 rotate-0'
                    }`}
                  />
                )}
              </div>
            </button>
            {type !== 'multiplayer' && (
              <Badge
                variant={passed ? 'success' : 'destructive'}
                className={
                  passed ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'
                }
              >
                {passed ? 'Passed' : 'Failed'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex flex-wrap gap-2'>
          <Badge variant='default' className='text-[#f8f8ff] dark:text-[#0c0d0d]'>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
          {tags.map((tag) => (
            <Badge key={tag} variant='default' className='text-[#f8f8ff] dark:text-[#0c0d0d]'>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}