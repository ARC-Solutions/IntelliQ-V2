import Summary from '@/components/single-player-quiz/summary';
import React from 'react';

export const runtime = 'edge';

const SinglePlayerSummary = ({ params }: { params: { id: string } }) => {
  return <Summary />;
};

export default SinglePlayerSummary;
