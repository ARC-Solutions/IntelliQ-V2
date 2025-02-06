"use client";
import { useEffect, useRef, useState } from "react";
import { Trophy, Clock, X, Check } from "lucide-react";
import type { Leaderboard } from "@/contexts/quiz-context";
import { useQuiz } from "@/contexts/quiz-context";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useLocalStorage } from "usehooks-ts";
import ReactConfetti from "react-confetti";

// Create a single audio instance outside the component
const successSound =
  typeof window !== "undefined" ? new Audio("/success.mp3") : null;

const QuizLeaderboard = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Leaderboard | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const hasPlayedRef = useRef(false); // Use ref instead of state
  const { leaderboard } = useQuiz();
  const router = useRouter();
  const topThree = leaderboard?.slice(0, 3) ?? [];
  const restOfPlayers = leaderboard?.slice(3) ?? [];
  const [soundEnabled] = useLocalStorage<boolean>("soundEnabled", true);
  const [particlesEnabled] = useLocalStorage<boolean>("particlesEnabled", true);

  const handlePlayerClick = (player: Leaderboard) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
    console.log(`Showing detailed results for ${player.userName}`);
  };

  const getTrophyColor = (position: number) => {
    switch (position) {
      case 1:
        return "text-yellow-400";
      case 2:
        return "text-gray-300";
      case 3:
        return "text-amber-600";
      default:
        return "text-gray-400";
    }
  };

  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1:
        return "h-64";
      case 2:
        return "h-52";
      case 3:
        return "h-40";
      default:
        return "h-32";
    }
  };

  const getBarColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-400";
      case 2:
        return "bg-gray-300";
      case 3:
        return "bg-amber-600";
      default:
        return "bg-gray-400";
    }
  };

  useEffect(() => {
    if (!leaderboard) {
      router.push("/multiplayer");
    } else if (soundEnabled && !hasPlayedRef.current && successSound) {
      hasPlayedRef.current = true;
      successSound.play().catch((error) => {
        console.error("Error playing sound:", error);
      });
    }
  }, [leaderboard, soundEnabled, router]);

  return (
    <div className="flex flex-col items-center min-h-screen text-purple-200 p-6">
      {particlesEnabled && (
        <ReactConfetti recycle={false} numberOfPieces={200} gravity={0.2} />
      )}
      <h1 className="text-4xl font-bold mb-2 text-purple-300">
        Quiz Leaderboard
      </h1>
      <div className="flex items-center gap-1 mb-8 text-sm opacity-70">
        <Clock className="w-5 h-5" />
        <p>Click on a player to see their detailed results</p>
      </div>

      <div className="w-full max-w-3xl">
        {/* Podium for top 3 */}
        <div className="flex justify-center items-end gap-4 mb-8">
          {topThree.map((player, i) => (
            <div
              key={i}
              className="flex flex-col items-center"
              onClick={() => handlePlayerClick(player)}
            >
              <div
                className={`w-28 ${getPodiumHeight(
                  i + 1,
                )} bg-gray-900 rounded-t-lg flex flex-col items-center justify-between pt-6 pb-2 cursor-pointer transition-transform hover:translate-y-[-5px]`}
              >
                <Trophy className={`w-10 h-10 ${getTrophyColor(i + 1)}`} />
                <div className="text-center mt-auto">
                  <p className="text-lg font-semibold">{player.userName}</p>
                  <p className="text-xl font-bold">{player.score}</p>
                </div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
              <div className={`w-full h-1.5 ${getBarColor(i + 1)}`}></div>
              <div
                className={`w-8 h-8 rounded-full ${
                  i + 1 === 1 ? "bg-purple-200" : "bg-purple-300"
                } flex items-center justify-center text-purple-900 font-bold mt-1`}
              >
                {i + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Rest of the players */}
        <div className="w-full border border-gray-700 rounded-lg overflow-hidden">
          {restOfPlayers.map((player, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-6 py-3 border-b border-gray-800 last:border-b-0 cursor-pointer hover:bg-gray-900"
              onClick={() => handlePlayerClick(player)}
            >
              <div className="flex items-center gap-4">
                <span className="text-gray-400">{i + 4}</span>
                <span>{player.userName}</span>
              </div>
              <span className="font-bold">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Player Details Modal using shadcn Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className=" text-purple-200 max-w-2xl">
          <DialogClose className="absolute top-4 right-4 text-gray-400 hover:text-white"></DialogClose>

          {selectedPlayer && (
            <div className="pt-2">
              <DialogTitle className="text-2xl font-bold text-purple-300 mb-1">
                {selectedPlayer.userName}'s Summary
              </DialogTitle>
              <div className="mb-6">
                <p className="text-sm text-gray-400">Total Score</p>
                <p className="text-5xl font-bold text-purple-300">
                  {selectedPlayer.score}
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Correct Answers</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-purple-400 h-full rounded-full"
                        style={{
                          width: `${(
                            (100 / selectedPlayer.totalQuestions) *
                              selectedPlayer.correctAnswers
                          ).toFixed(2)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-medium">
                      {(
                        (100 / selectedPlayer.totalQuestions) *
                        selectedPlayer.correctAnswers
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedPlayer.correctAnswers} out of{" "}
                    {selectedPlayer.totalQuestions}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Average Time per Question
                  </p>
                  <p className="text-2xl font-bold">
                    {(selectedPlayer.avgTimeTaken / 1000).toFixed(2)} seconds
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-3">
                    Questions & Answers
                  </p>
                  <div className="space-y-3">
                    {selectedPlayer.questions.map((question, i) => (
                      <div key={i} className="bg-gray-950 rounded-lg p-4">
                        <div className="flex justify-between">
                          <p className="font-medium">{question.text}</p>
                          <div className="flex items-center gap-2">
                            {question.userAnswer.toLowerCase() ===
                            question.correctAnswer.toLowerCase() ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-sm text-gray-400">
                              {(question.timeTaken / 1000).toFixed(2)}s
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-purple-400 mt-1">
                          Your answer: {question.userAnswer}
                        </p>
                        {question.userAnswer.toLowerCase() !==
                          question.correctAnswer.toLowerCase() && (
                          <p className="text-sm text-red-400 mt-1">
                            Correct answer: {question.correctAnswer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizLeaderboard;
