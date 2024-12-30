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
  // useEffect(() => {
  //   const fetchGame = async () => {
  //     const game = await getGame(roomCode);
  //     if (!game) {
  //       router.push('/?error=game-not-found');
  //       return;
  //     }
  //     const user = await supabase.auth.getUser();

  //     if (user && user.data.user?.id === game.host_id) {
  //       setIsCreator(true);
  //     }
  //   };
  //   fetchGame();
  // }, [isCreator]);
  useEffect(() => {
    const roomChannel = supabase.channel(roomCode);
    setChannel(roomChannel);
    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = roomChannel.presenceState();
        // console.log('Presence state:', newState);

        const playersList = Object.values(newState).flatMap((players, index) =>
          players.map((player) => {
            if (index === 0) {
              setIsCreator(true);
              return {
                id: player?.presence_ref,
                email: player.currentUser.email,
                isCreator: true,
              } as Player;
            }
            setIsCreator(false);
            return {
              id: player?.presence_ref,
              email: player.currentUser.email,
              isCreator: false,
            } as Player;
          }),
        );
        setPlayers(playersList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // console.log('join', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // console.log('leave', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          if (currentUser) {
            const presenceTrackStatus = await roomChannel.track({ currentUser });
          }
        }
      });

    roomChannel.on('broadcast', { event: 'quiz-started' }, async (payload) => {
      router.push(`/${roomCode}/play`);
    });

    return () => {
      if (roomChannel) {
        supabase.removeChannel(roomChannel);
      }
    };
  }, [roomCode, router, currentUser, isCreator]);

  const getGame = async (gameId: string) => {
    const gameResult = await supabase.from('rooms').select().eq('code', gameId).single();
    if (gameResult.error) {
      console.error(gameResult.error);
      return null;
    }
    return gameResult.data;
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
                <span className='uppercase'>players</span>
              </div>
              <span>1/14</span>
            </div>

            <Select defaultValue={`${maxPlayers}`}>
              <SelectTrigger className='w-full bg-black border-gray-800'>
                <SelectValue placeholder='Select players' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='2'>2 Players</SelectItem>
                <SelectItem value='3'>3 Players</SelectItem>
                <SelectItem value='4'>4 Players</SelectItem>
                <SelectItem value='5'>5 Players</SelectItem>
                <SelectItem value='6'>6 Players</SelectItem>
                <SelectItem value='7'>7 Players</SelectItem>
                <SelectItem value='8'>8 Players</SelectItem>
                <SelectItem value='9'>9 Players</SelectItem>
                <SelectItem value='10'>10 Players</SelectItem>
              </SelectContent>
            </Select>

            <div className='space-y-2'>
              {[...Array(maxPlayers)].map((_, i) => {
                if (i === 0) {
                  return (
                    <div key={i} className='flex items-center gap-2 p-2 rounded-lg bg-gray-900/50'>
                      <Avatar className='h-8 w-8'>
                        <AvatarFallback className='bg-primary/20 text-primary'>O</AvatarFallback>
                      </Avatar>
                      <span>Owner</span>
                      <div className='flex gap-1 ml-auto'>
                        <Crown className='w-4 h-4 text-primary' />
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className='flex items-center gap-2 p-2 rounded-lg bg-gray-900/50'>
                    <div className='h-8 w-8 rounded-full border border-gray-800' />
                    <span className='text-gray-400'>Empty</span>
                  </div>
                );
              })}
            </div>
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
                    <Slider defaultValue={[5]} max={10} min={1} step={1} className='flex-1' />
                    <span className='text-sm text-gray-400'>10</span>
                  </div>
                </div>

                <div className='space-y-4'>
                  <Label>Time Limit per Question</Label>
                  <div className='flex items-center gap-4'>
                    <span className='text-sm text-gray-400'>5s</span>
                    <Slider defaultValue={[25]} max={60} min={5} step={5} className='flex-1' />
                    <span className='text-sm text-gray-400'>60s</span>
                  </div>
                </div>

                <div className='space-y-4'>
                  <Label>Topic</Label>
                  <Input placeholder='Formula One' className='bg-transparent border-gray-800' />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-4 justify-end'>
              <Button
                variant='outline'
                className='bg-primary/10 border-primary/20 text-primary min-w-[120px]'
              >
                <Link className='w-4 h-4 mr-2' />
                INVITE
              </Button>
              <Button className='bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]'>
                START
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
