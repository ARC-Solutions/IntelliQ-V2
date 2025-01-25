"use client";

import { Button } from "@/components/ui/button";
import { Mail, Plus } from "lucide-react";
import Link from "next/link";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Image from "next/image";
import { createClient } from "@/lib/supabase/supabase-client-side";
import { useRouter } from "next/navigation";
import { createApiClient } from "@/utils/api-client";
export default function LobbyScreen() {
  const router = useRouter();
  const supabase = createClient();
  const generateRoomCode = (): string => {
    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    let result = "";
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }

    return result;
  };

  const createLobby = async () => {
    const roomCode = generateRoomCode();
    sessionStorage.setItem("room_code", roomCode);
    const creator = (await supabase.auth.getUser()).data.user?.id;
    console.log(creator);

    const client = createApiClient();
    const newGame = await client.api.v1.rooms.$post({
      json: {
        code: roomCode,
        hostId: creator!,
        maxPlayers: 5,
        numQuestions: 5,
        timeLimit: 30,
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
  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* Content */}
      <div className="relative z-10 w-full px-4 py-8 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10 justify-self-start">
          <Image src="/logo-dark.svg" alt="IntelliQ" width={250} height={250} />
        </div>

        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-10">
          {/* Left Side - Join with Code */}
          <div className="space-y-6 text-center">
            <h1 className="text-3xl text-white">Join with invite code</h1>
            <div className="flex justify-center">
              <Mail className="w-12 h-12 text-purple-300" />
            </div>
            <div className="flex justify-center">
              <InputOTP maxLength={5} className="gap-2">
                <InputOTPGroup>
                  <InputOTPSlot
                    index={0}
                    className="w-12 h-12 text-center text-xl bg-transparent border-gray-700 focus:border-purple-300"
                  />
                  <InputOTPSlot
                    index={1}
                    className="w-12 h-12 text-center text-xl bg-transparent border-gray-700 focus:border-purple-300"
                  />
                  <InputOTPSlot
                    index={2}
                    className="w-12 h-12 text-center text-xl bg-transparent border-gray-700 focus:border-purple-300"
                  />
                  <InputOTPSlot
                    index={3}
                    className="w-12 h-12 text-center text-xl bg-transparent border-gray-700 focus:border-purple-300"
                  />
                  <InputOTPSlot
                    index={4}
                    className="w-12 h-12 text-center text-xl bg-transparent border-gray-700 focus:border-purple-300"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-gray-400 text-sm">
              Got an invite code? Enter above.
            </p>
          </div>

          {/* Right Side - Create Private Lobby */}
          <div className="space-y-6 text-center">
            <h1 className="text-3xl text-white">Create a Lobby</h1>
            <div className="flex justify-center">
              <Plus className="w-12 h-12 text-purple-300" />
            </div>
            <Button
              onClick={createLobby}
              className="w-full max-w-xs bg-purple-300 text-black hover:bg-purple-400"
            >
              Create
            </Button>
            <p className="text-gray-400 text-sm">
              Create a lobby and invite your friends
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-16">
          <Link
            href="/"
            className="text-purple-300 hover:text-purple-400 text-sm"
          >
            ← Back to start
          </Link>
        </div>
      </div>
    </div>
  );
}
