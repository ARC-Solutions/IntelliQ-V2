'use client';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { Trophy, Clock } from 'lucide-react';
import { Leaderboard, useQuiz } from '@/contexts/quiz-context';
import { useRouter } from 'next/navigation';

const QuizLeaderboard = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Leaderboard | null>(null);

  const { leaderboard } = useQuiz();
  const router = useRouter();
  const topThree = leaderboard?.slice(0, 3) ?? [];
  const restOfPlayers = leaderboard?.slice(3) ?? [];

  const handlePlayerClick = (player: Leaderboard) => {
    setSelectedPlayer(player);

    console.log(`Showing detailed results for ${player.userName}`);
  };

  const getTrophyColor = (position: number) => {
    switch (position) {
      case 1:
        return 'text-yellow-400';
      case 2:
        return 'text-gray-300';
      case 3:
        return 'text-amber-600';
      default:
        return 'text-gray-400';
    }
  };

  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1:
        return 'h-64';
      case 2:
        return 'h-52';
      case 3:
        return 'h-40';
      default:
        return 'h-32';
    }
  };

  const getBarColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-400';
      case 2:
        return 'bg-gray-300';
      case 3:
        return 'bg-amber-600';
      default:
        return 'bg-gray-400';
    }
  };

  useEffect(() => {
    if (!leaderboard) {
      router.push('/multiplayer');
    }
  }, []);

  return (
    <div className='flex flex-col items-center min-h-screen bg-black text-purple-200 p-6'>
      <h1 className='text-4xl font-bold mb-2 text-purple-300'>Quiz Leaderboard</h1>
      <div className='flex items-center gap-1 mb-8 text-sm opacity-70'>
        <Clock className='w-5 h-5' />
        <p>Click on a player to see their detailed results (Coming Soon...)</p>
      </div>

      <div className='w-full max-w-3xl'>
        {/* Podium for top 3 */}
        <div className='flex justify-center items-end gap-4 mb-8'>
          {topThree.map((player, i) => (
            <div
              key={i}
              className='flex flex-col items-center'
              onClick={() => handlePlayerClick(player)}
            >
              <div
                className={`w-28 ${getPodiumHeight(
                  i + 1,
                )} bg-gray-900 rounded-t-lg flex flex-col items-center justify-between pt-6 pb-2 cursor-pointer transition-transform hover:translate-y-[-5px]`}
              >
                <Trophy className={`w-10 h-10 ${getTrophyColor(i + 1)}`} />
                <div className='text-center mt-auto'>
                  <p className='text-lg font-semibold'>{player.userName}</p>
                  <p className='text-xl font-bold'>{player.score}</p>
                </div>
              </div>
              <div className='w-full h-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent'></div>
              <div className={`w-full h-1.5 ${getBarColor(i + 1)}`}></div>
              <div
                className={`w-8 h-8 rounded-full ${
                  i + 1 === 1 ? 'bg-purple-200' : 'bg-purple-300'
                } flex items-center justify-center text-purple-900 font-bold mt-1`}
              >
                {i + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Rest of the players */}
        <div className='w-full border border-gray-700 rounded-lg overflow-hidden'>
          {restOfPlayers.map((player, i) => (
            <div
              key={i}
              className='flex justify-between items-center px-6 py-3 border-b border-gray-800 last:border-b-0 cursor-pointer hover:bg-gray-900'
              onClick={() => handlePlayerClick(player)}
            >
              <div className='flex items-center gap-4'>
                <span className='text-gray-400'>{i + 4}</span>
                <span>{player.userName}</span>
              </div>
              <span className='font-bold'>{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizLeaderboard;
