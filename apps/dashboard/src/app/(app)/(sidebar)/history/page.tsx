import React from 'react';
import { createClient } from '@/lib/supabase/supabase-server-side';
import { fetchAllQuizzes } from '@/lib/fetch-all-quizzes';
import HistoryPage from '@/components/history-page/history-page';
import { CalendarIcon, ClockIcon } from 'lucide-react';
const History = async () => {
  const supabase = createClient();
  const { session } = (await supabase.auth.getSession()).data;
  const accessToken = session?.access_token as string;
  const data = await fetchAllQuizzes(accessToken, 0);

  return <HistoryPage historyQuizzes={data} />;
};

export default History;
