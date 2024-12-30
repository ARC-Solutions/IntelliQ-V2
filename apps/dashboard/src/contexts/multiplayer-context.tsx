'use client';
import { RealtimeChannel } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Player = {
  id: string;
  userName: string;
  email: string;
  leader?: boolean;
  score?: number;
} | null;

type MultiContextType = {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  isCreator: boolean;
  setIsCreator: (isCreator: boolean) => void;
  channel: RealtimeChannel | null;
  setChannel: (channel: RealtimeChannel) => void;
};

const MultiplayerContext = createContext<MultiContextType | undefined>(undefined);

export const MultiplayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  return (
    <MultiplayerContext.Provider
      value={{ players, setPlayers, isCreator, setIsCreator, channel, setChannel }}
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
