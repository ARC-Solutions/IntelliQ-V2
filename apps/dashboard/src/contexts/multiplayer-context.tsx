'use client';
import { RealtimeChannel } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, ReactNode, useReducer } from 'react';
// import { quizReducer } from '@/utils/reducers/quiz-reducer';
export type Player = {
  id: string;
  userName: string;
  email: string;
  isCreator?: boolean;
  score?: number;
} | null;

type MultiContextType = {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  isCreator: boolean;
  setIsCreator: (isCreator: boolean) => void;
  channel: RealtimeChannel | null;
  setChannel: (channel: RealtimeChannel) => void;
  questionCount: number;
  setQuestionCount: (setQuestion: number) => void;
  maxPlayers: number;
  setMaxPlayers: (maxPlayers: number) => void;
  timeLimit: number;
  setTimeLimit: (timeLimit: number) => void;
  topic: string;
  setTopic: (topic: string) => void;
};
type GameState = {
  status: 'idle' | 'started' | 'finished';
  startTime?: Date;
  endTime?: Date;
};

const MultiplayerContext = createContext<MultiContextType | undefined>(undefined);

export const MultiplayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // const [state, dispatch] = useReducer(multiplayerGameReducer, initialState);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<number>(5);
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(25);
  const [topic, setTopic] = useState('');
  return (
    <MultiplayerContext.Provider
      value={{
        players,
        setPlayers,
        isCreator,
        setIsCreator,
        channel,
        setChannel,
        maxPlayers,
        setMaxPlayers,
        questionCount,
        setQuestionCount,
        timeLimit,
        setTimeLimit,
        topic,
        setTopic,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
};

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};
