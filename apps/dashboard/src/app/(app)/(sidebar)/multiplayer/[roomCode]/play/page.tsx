import dynamic from 'next/dynamic';

export const runtime = 'edge';

const Quiz = dynamic(() => import('@/components/multiplayer-page/multiplayer'), { ssr: false });

const MultiplayerQuiz = () => {
  return <Quiz />;
};

export default MultiplayerQuiz;
