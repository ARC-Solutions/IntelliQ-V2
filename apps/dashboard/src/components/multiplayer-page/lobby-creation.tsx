'use client';

import { Button } from '@/components/ui/button';
import { Mail, Plus } from 'lucide-react';
import Link from 'next/link';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/supabase-client-side';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/utils/api-client';
import { useState } from 'react';
import { RoomResponse } from '@intelliq/api';
import { useTheme } from 'next-themes';
export default function LobbyScreen() {
  const router = useRouter();
  const supabase = createClient();
  const [inviteCode, setInviteCode] = useState<string>('');
  const generateRoomCode = (): string => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

    let result = '';
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }

    return result;
  };
  const joinLobby = async () => {
    try {
      const client = createApiClient();
      const response = await client.api.v1.rooms[':roomCode'].$get({
        param: {
          roomCode: inviteCode,
        },
      });
      const room = (await response.json()) as RoomResponse;
      if (room) {
        router.push(`/multiplayer/${inviteCode}`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const createLobby = async () => {
    const roomCode = generateRoomCode();
    sessionStorage.setItem('room_code', roomCode);
    const creator = (await supabase.auth.getUser()).data.user?.id;
    console.log(creator);

    const client = createApiClient();
    const newGame = await client.api.v1.rooms.$post({
      json: {
        code: roomCode,
        hostId: creator!,
        maxPlayers: 5,
        numQuestions: 5,
        timeLimit: 25,
        language: 'en',
      },
    });

    // const newGame = await supabase
    //   .from('rooms')
    //   .insert({
    //     code: roomCode,
    //     host_id: creator,
    //     max_players: 5,
    //     num_questions: 5,
    //     time_limit: 30,
    //   })
    //   .select()
    //   .single();

    // if (newGame.error) {
    //   console.error(newGame.error);
    //   return;
    // }

    router.push(`/multiplayer/${roomCode}`);
  };
  const { resolvedTheme } = useTheme();
  return (
    <div className="relative flex flex-col items-center justify-between w-full min-h-screen overflow-hidden sm:justify-center">
      {/* Content */}
      <div className='relative z-10 flex flex-col items-center w-full px-4 py-4 sm:py-8'>
        {/* Logo */}
        <div className="mb-10 justify-self-start">
          <Image
            src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
            alt="IntelliQ"
            width={250}
            height={250}
          />
        </div>

        <div className="grid w-full max-w-6xl gap-10 md:grid-cols-2">
          {/* Left Side - Join with Code */}
          <div className="space-y-4 text-center sm:space-y-6">
            <h1 className="text-2xl text-black sm:text-3xl dark:text-white">Join with invite code</h1>
            <div className="flex justify-center">
              <Mail className="w-12 h-12 text-purple-300" />
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={inviteCode}
                onChange={(value) => setInviteCode(value)}
                className="gap-2"
              >
                <InputOTPGroup>
                  <InputOTPSlot
                    index={0}
                    className="w-12 h-12 text-xl text-center bg-transparent border-gray-700 focus:border-purple-300"
                  />
                  <InputOTPSlot
                    index={1}
                    className="w-12 h-12 text-xl text-center bg-transparent border-gray-700 focus:border-purple-300"
                  />
                  <InputOTPSlot
                    index={2}
                    className="w-12 h-12 text-xl text-center bg-transparent border-gray-700 focus:border-purple-300"
                  />
                  <InputOTPSlot
                    index={3}
                    className="w-12 h-12 text-xl text-center bg-transparent border-gray-700 focus:border-purple-300"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              onClick={joinLobby}
              className='w-[250px] sm:w-full max-w-xs bg-purple-300 text-black hover:bg-purple-400'
            >
              Join
            </Button>
            <p className="text-sm text-gray-400">
              Got an invite code? Enter above.
            </p>
          </div>

          {/* Right Side - Create Private Lobby */}
          <div className="flex flex-col items-center justify-between h-full space-y-2 text-center sm:space-y-6">
            <h1 className="text-2xl sm:text-3xl">Create a Lobby</h1>
            <div className="flex items-center justify-center flex-grow">
              <Plus className="text-purple-300 w-14 h-14 sm:w-16 sm:h-16" />
            </div>
            <Button onClick={createLobby} className="w-[250px] sm:w-full max-w-xs bg-purple-300 text-black hover:bg-purple-400">
              Create
            </Button>
            <p className="text-sm text-gray-400">
              Create a lobby and invite your friends
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className='mt-4 sm:mt-16'>
          <Link href='/' className='text-sm text-purple-300 hover:text-purple-400'>
            ← Back to start
          </Link>
        </div>
      </div>
    </div>
  );
}
