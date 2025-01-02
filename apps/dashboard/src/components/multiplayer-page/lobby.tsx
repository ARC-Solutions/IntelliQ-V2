'use client';

import { createClient } from '@/lib/supabase/supabase-client-side';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Brain, Crown, Link, Sparkles, Zap, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/user-context';
import { Player, useMultiplayer } from '@/contexts/multiplayer-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/contexts/user-context';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function Lobby() {
  const { currentUser } = useAuth();
  const {
    players,
    setPlayers,
    isCreator,
    setIsCreator,
    channel,
    setChannel,
    maxPlayers,
    setMaxPlayers,
  } = useMultiplayer();
  const routerParams = useParams();
  const router = useRouter();
  const roomCode = routerParams['roomCode'] as string;
  const supabase = createClient();

  const checkAndJoinRoom = async (channel: RealtimeChannel) => {
    try {
      // Get current room data
      const { data: room } = await supabase
        .from('rooms')
        .select('max_players')
        .eq('code', roomCode)
        .single();

      if (room) {
        // Get current player count from presence state
        const presenceState = channel.presenceState();
        const currentPlayerCount = Object.values(presenceState).flat().length;

        if (currentPlayerCount >= room.max_players) {
          alert('This room is full. Please try another room.');
          router.push('/');
          return;
        }

        // If there's space, join the room

        return room.max_players;
      }
    } catch (error) {
      console.error('Error joining room:', error);
      return false;
    }
  };

  const updatePlayers = (roomChannel: RealtimeChannel) => {
    const newState = roomChannel.presenceState();

    // Convert presence state to players array
    const playersList = Object.entries(newState).flatMap(([_, players]) =>
      players.map(
        (player) =>
          ({
            id: player.currentUser.id,
            email: player.currentUser.email,
            userName: player.currentUser.name,
          } as Player),
      ),
    );

    // First player in the list is the leader
    const updatedPlayers = playersList.map((player, index) => ({
      ...player,
      isCreator: index === 0,
    }));

    setPlayers(updatedPlayers);

    // Update isCreator status for current user
    if (currentUser && updatedPlayers.length > 0) {
      setIsCreator(updatedPlayers[0].email === currentUser.email);
    }
  };

  useEffect(() => {
    const updateMaxPlayers = async () => {
      const { data: room, error } = await supabase
        .from('rooms')
        .select('max_players')
        .eq('code', roomCode)
        .single();

      if (error) {
        console.error('Error updating max players:', error);
        return;
      }

      // Assuming data contains the updated room info
      setMaxPlayers(room.max_players);
    };

    updateMaxPlayers();
  }, []);

  useEffect(() => {
    const roomChannel = supabase.channel(roomCode);
    setChannel(roomChannel);

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        updatePlayers(roomChannel);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // const newState = roomChannel.presenceState();
        // Object.entries(newState).flatMap(([_, players]) => {
        //   console.log(players);
        // });
        // if (players.length === maxPlayers) {
        //   alert('Maximum Players reached!');
        // }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const newState = roomChannel.presenceState();
        if (Object.keys(newState).length === 0) {
          setIsCreator(false);
          setPlayers([]);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUser) {
          const maxPlayers = await checkAndJoinRoom(roomChannel);

          await roomChannel.track({
            currentUser,
            maxPlayers,
          });
        }
      });

    roomChannel
      .on('broadcast', { event: 'quiz-started' }, async (payload) => {
        router.push(`/${roomCode}/play`);
      })
      .on('broadcast', { event: 'change-amount-of-players' }, async ({ payload }) => {
        setMaxPlayers(payload.newAmount);
      });

    return () => {
      if (roomChannel) {
        supabase.removeChannel(roomChannel);
      }
    };
  }, [roomCode, router, currentUser]);

  const changeAmountOfPlayers = async (newAmount: number) => {
    if (!channel) {
      console.error('Channel is not initialized.');
      return;
    }

    if (Number.isNaN(newAmount) || newAmount < 2) {
      return;
    }

    try {
      if (isCreator) {
        console.log('change');

        // Update database
        const { data, error } = await supabase
          .from('rooms')
          .update({ max_players: newAmount })
          .eq('code', roomCode);

        if (error) throw error;

        // Update local state and broadcast to others
        setMaxPlayers(newAmount);
        await channel.send({
          type: 'broadcast',
          event: 'change-amount-of-players',
          payload: { newAmount },
        });
      }
    } catch (error) {
      console.error('Failed to update max players:', error);
    }
  };

  return (
    <div className='min-h-screen w-full bg-black text-white relative flex flex-col'>
      <div className='relative z-10 w-full p-8 flex flex-col gap-8'>
        {/* Logo */}
        <div className='flex justify-center'>
          <Image src='/logo-dark.svg' alt='IntelliQ' width={250} height={250} />
        </div>

        <div className='grid lg:grid-cols-[300px_1fr] gap-8 max-w-7xl mx-auto w-full'>
          {/* Player List */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2 text-primary'>
              <UsersRound />
              <div className='flex items-center gap-1'>
                <h2 className='text-xl font-semibold uppercase'>
                  players {players.length}/{maxPlayers}
                </h2>
              </div>
            </div>

            <Select
              disabled={!isCreator}
              onValueChange={(value) => {
                changeAmountOfPlayers(Number(value));
              }}
              value={`${maxPlayers}`}
            >
              <SelectTrigger className='w-full bg-black border-gray-800'>
                <SelectValue placeholder='Select players' />
              </SelectTrigger>
              <SelectContent>
                {[...Array(9)].map((slot, i) => {
                  return (
                    <SelectItem key={i} value={`${i + 2}`}>
                      {i + 2} Players
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <ScrollArea className='w-full h-[400px]'>
              <div className='space-y-4'>
                {[...Array(maxPlayers)].map((_, i) => {
                  if (i === 0 && players.length > 0) {
                    // Render the leader of the lobby
                    const leader = players[0];
                    return (
                      <div
                        key={i}
                        className='flex items-center gap-2 p-4 rounded-lg bg-gray-900/50'
                      >
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback className='bg-primary/20 text-primary'>
                            {leader?.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`${
                            leader?.userName === currentUser?.name && 'font-extrabold'
                          }`}
                        >
                          {leader?.userName}{' '}
                        </span>
                        <div className='flex gap-1 ml-auto'>
                          <Crown className='w-6 h-6 text-primary' />
                        </div>
                      </div>
                    );
                  } else if (i < players.length) {
                    // Render other players
                    const player = players[i];
                    return (
                      <div
                        key={i}
                        className='flex items-center gap-2 p-4 rounded-lg bg-gray-900/50'
                      >
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback className='bg-primary/20 text-primary'>
                            {player?.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`${
                            player?.userName === currentUser?.name && 'font-extrabold'
                          }`}
                        >
                          {player?.userName}
                        </span>
                      </div>
                    );
                  }
                  // Render empty slots for remaining slots
                  return (
                    <div key={i} className='flex items-center gap-2 p-4 rounded-lg bg-gray-900/50'>
                      <div className='h-8 w-8 rounded-full border border-gray-800' />
                      <span className='text-gray-400'>Empty</span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className='space-y-8'>
            {/* Game Modes */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Card className='bg-primary/10 border-primary/20 p-6 flex flex-col items-center justify-center gap-2'>
                <Brain className='w-8 h-8 text-primary' />
                <span>Default</span>
              </Card>
              <Card className='bg-black border-gray-800 p-6 flex flex-col items-center justify-center gap-2'>
                <Zap className='w-8 h-8 text-primary' />
                <span>Fast</span>
              </Card>
              <Card className='bg-black border-gray-800 p-6 flex flex-col items-center justify-center gap-2'>
                <Sparkles className='w-8 h-8 text-primary' />
                <span>Custom</span>
              </Card>
            </div>

            {/* Settings */}
            <div className='space-y-6'>
              <h2 className='text-2xl'>Settings</h2>

              <div className='space-y-8'>
                <div className='space-y-4'>
                  <Label>Question count</Label>
                  <div className='flex items-center gap-4'>
                    <span className='text-sm text-gray-400'>1</span>
                    <Slider
                      disabled={!isCreator}
                      defaultValue={[5]}
                      max={10}
                      min={1}
                      step={1}
                      className='flex-1'
                    />
                    <span className='text-sm text-gray-400'>10</span>
                  </div>
                </div>

                <div className='space-y-4'>
                  <Label>Time Limit per Question</Label>
                  <div className='flex items-center gap-4'>
                    <span className='text-sm text-gray-400'>5s</span>
                    <Slider
                      disabled={!isCreator}
                      defaultValue={[25]}
                      max={60}
                      min={5}
                      step={5}
                      className='flex-1'
                    />
                    <span className='text-sm text-gray-400'>60s</span>
                  </div>
                </div>

                <div className='space-y-4'>
                  <Label>Topic</Label>
                  <Input
                    disabled={!isCreator}
                    placeholder='Formula One'
                    className='bg-transparent border-gray-800'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className='flex gap-4 justify-center'>
          <Button
            variant='outline'
            className='bg-primary/10 border-primary/20 text-primary min-w-[120px]'
          >
            <Link className='w-4 h-4 mr-2' />
            INVITE
          </Button>
          {isCreator && (
            <Button className='bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]'>
              START
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
