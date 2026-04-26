import dynamic from 'next/dynamic';

export const runtime = 'edge';

const QuizLeaderboard = dynamic(() => import('@/components/multiplayer-page/leaderboard'), { ssr: false });

const Leaderboard = () => {
  return <QuizLeaderboard />;
};

export default Leaderboard;
