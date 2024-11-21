'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Clock, Calendar, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { QuizHistories, useQuiz } from '@/contexts/quiz-context';
import { ScrollArea } from '../ui/scroll-area';
import { redirect } from 'next/navigation';

const tags = ['f1', 'anime', 'school', 'math', 'history'];

export default function HistoryPage({
  historyQuizzes,
}: {
  historyQuizzes: { quizzes: QuizHistories[] };
}) {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { dispatch, quizzes, fetchSingleQuiz, summaryQuiz, currentQuiz } = useQuiz();
  useEffect(() => {
    dispatch({ type: 'STORE_QUIZZES', payload: historyQuizzes.quizzes });
  }, []);
  useEffect(() => {
    if (currentQuiz) {
      const url = `/quiz/play`;
      redirect(url);
    }
    if (summaryQuiz) {
      redirect(`/single-player/summary/${summaryQuiz.quiz_id}`);
    }
  }, [currentQuiz, summaryQuiz]);
  return (
    <div className='min-h-screen p-6'>
      <div className='w-full space-y-6'>
        <div className='flex flex-wrap gap-4'>
          <Select onValueChange={setSelectedTag}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='Filter by tag' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Tags</SelectLabel>
                <SelectItem value='all'>All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select onValueChange={setSelectedStatus}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='passed'>Passed</SelectItem>
                <SelectItem value='failed'>Failed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className='w-full h-[800px]'>
          <div className='w-[70rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {historyQuizzes.quizzes?.map((quiz) => (
              <Card
                key={quiz.id}
                className='w-full row-span-1 rounded-xl hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent flex flex-col space-y-4'
              >
                <CardHeader>
                  <CardTitle className='text-lg font-semibold text-neutral-600 dark:text-neutral-200 flex items-center gap-2'>
                    <Trophy className='w-6 h-6 text-primary' />
                    {quiz.quiz_title}
                  </CardTitle>
                  <div className='flex justify-between text-sm text-gray-500 dark:text-gray-400'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      <span>{quiz.created_at}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Clock className='w-4 h-4' />
                      <span>1:20 min</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className='text-neutral-600 dark:text-neutral-300 mb-2'>Your Score: 80%</div>
                  <Progress value={80} className='mt-2' />
                  <div className='flex justify-between text-sm mt-4'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle2 className='w-4 h-4 text-green-500' />
                      <span>Correct: 4</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <XCircle className='w-4 h-4 text-red-500' />
                      <span>Incorrect: 3</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => {
                      fetchSingleQuiz(quiz.id);
                    }}
                    className='w-full py-2'
                  >
                    View Summary
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
