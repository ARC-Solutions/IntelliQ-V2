"use client";

import { InviteButton } from "@/components/invite-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Lottie from "lottie-react";
import Loading from "@/assets/loading.json";
import LoadingDark from "@/assets/loading-dark.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Player, useMultiplayer } from "@/contexts/multiplayer-context";
import { useAuth } from "@/contexts/user-context";
import { createClient } from "@/lib/supabase/supabase-client-side";
import { createApiClient } from "@/utils/api-client";
import NumberFlow, { continuous } from "@number-flow/react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Brain, Crown, Sparkles, UsersRound, Zap } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RoomResponse, RoomDetailsResponse, QuizType } from "@intelliq/api";
import { useDebouncedCallback } from "use-debounce";
import { SupportedLanguages, useQuiz } from "@/contexts/quiz-context";
import { languages, QuizData } from "../../contexts/quiz-creation-context";
import { SparklesText } from "../magicui/sparkles-text";
import { useTheme } from "next-themes";

interface PresenceData {
  currentUser: {
    id: string;
    email: string;
    name: string;
    avatar: string;
  };
  settings?: { timeLimit: number; topic: string };
  maxPlayers: number;
  presence_ref: string;
}

type GameMode = 'default' | 'fast' | 'custom';

const DEFAULT_SETTINGS = {
  timeLimit: 25,
  questionCount: 5,
};

const FAST_SETTINGS = {
  timeLimit: 5,
  questionCount: 3,
};

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
    questionCount,
    setQuestionCount,
    timeLimit,
    setTimeLimit,
    topic,
    setTopic,
    language,
    setLanguage,
    roomId,
    setRoomId,
  } = useMultiplayer();
  const {
    isLoading,
    fetchQuestions,
    fetchingFinished,
    dispatch,
    currentQuiz,
    setIsMultiplayerMode,
    getMultiplayerQuizForPlayers,
  } = useQuiz();
  const routerParams = useParams();
  const router = useRouter();
  const roomCode = routerParams["roomCode"] as string;
  const [isRoomFull, setIsRoomFull] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const [gameMode, setGameMode] = useState<GameMode>('default');
  const [topicError, setTopicError] = useState<string | null>(null);

  const checkAndJoinRoom = async (channel: RealtimeChannel) => {
    try {
      // Get current room data
      const client = createApiClient();
      const response = await client.api.v1.rooms[":roomCode"].$get({
        param: {
          roomCode: roomCode,
        },
      });
      const room = (await response.json()) as RoomResponse;

      if (room) {
        // Get current player count from presence state
        const presenceState = channel.presenceState();
        const currentPlayerCount = Object.values(presenceState).flat().length;

        if (currentPlayerCount === room.maxPlayers) {
          setIsRoomFull(true);
          return;
        }

        return room.maxPlayers;
      }
    } catch (error) {
      console.error("Error joining room:", error);
      return false;
    }
  };

  const updatePlayers = async (roomChannel: RealtimeChannel) => {
    const newState = roomChannel.presenceState();

    // Convert presence state to players array
    const playersList = Object.entries(newState).flatMap(
      ([_, players]) =>
        players
          .map((player, i) => {
            // Check if the player data has the expected structure
            const presenceData = player as PresenceData;
            if (!presenceData.currentUser) {
              console.warn(
                "Received player data without currentUser:",
                presenceData,
              );
              return null; // Skip invalid player data
            }

            return {
              id: presenceData.currentUser.id,
              email: presenceData.currentUser.email,
              userName: presenceData.currentUser.name,
              avatar: presenceData.currentUser.avatar,
              settings: {
                timeLimit: presenceData.settings?.timeLimit,
                topic: presenceData.settings?.topic,
              },
            } as Player;
          })
          .filter(Boolean), // Remove any null entries from invalid data
    );
    console.log("PLAYERS LIST:", playersList);

    // First player in the list is the leader
    const updatedPlayers = playersList.map((player, index) => ({
      ...player,
      isCreator: index === 0,
    }));

    setPlayers(updatedPlayers as Player[]);

    // Update isCreator status for current user
    if (currentUser && updatedPlayers.length > 0) {
      setIsCreator(updatedPlayers[0].id === currentUser.id);
    }
  };

  useEffect(() => {
    const updateSettings = async () => {
      const client = createApiClient();
      const response = await client.api.v1.rooms[":roomCode"].details.$get({
        param: {
          roomCode: roomCode,
        },
      });
      const data = (await response.json()) as RoomDetailsResponse;

      if (!response.ok) {
        const errorData = (await response.json()) as unknown as {
          error: string;
        };
        console.error("Error updating max players:", errorData.error);
        return;
      }

      // Assuming data contains the updated room info
      setMaxPlayers(data.maxPlayers);
      setQuestionCount(data.numQuestions);
      setTimeLimit(data.timeLimit);
      setRoomId(data.id);
      setLanguage(data.language as SupportedLanguages);
    };

    updateSettings();
  }, []);

  useEffect(() => {
    const roomChannel = supabase.channel(roomCode);
    setChannel(roomChannel);

    roomChannel
      .on("presence", { event: "sync" }, () => {
        updatePlayers(roomChannel);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        // const newState = roomChannel.presenceState();
        // Object.entries(newState).flatMap(([_, players]) => {
        //   console.log(players);
        // });
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        const newState = roomChannel.presenceState();
        if (Object.keys(newState).length === 0) {
          setIsCreator(false);
          setPlayers([]);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && currentUser) {
          const maxPlayers = await checkAndJoinRoom(roomChannel);

          const presenceData = {
            currentUser: {
              ...currentUser,
              avatar: currentUser.avatar || "",
            },
            maxPlayers,
            settings: {
              topic,
            },
          };

          await roomChannel.track(presenceData);
        }
      });

    roomChannel

      .on(
        "broadcast",
        { event: "change-amount-of-players" },
        async ({ payload }) => {
          setMaxPlayers(payload.newAmount);
        },
      )
      .on("broadcast", { event: "loading-animation" }, async ({ payload }) => {
        dispatch({ type: "FETCH_QUIZ_REQUEST" });
      })
      .on("broadcast", { event: "settings-update" }, ({ payload }) => {
        const { type, value } = payload;

        switch (type) {
          case "numQuestions":
            setQuestionCount(value as number);
            break;
          case "timeLimit":
            setTimeLimit(value as number);
            break;
          case "topic":
            setTopic(value as string);
          case "language":
            setLanguage(value as SupportedLanguages);
            break;
        }
      })
      .on("broadcast", { event: "quiz-start" }, ({ payload }) => {
        getMultiplayerQuizForPlayers(payload.roomId, payload.currentQuiz);
        dispatch({ type: "FETCH_QUIZ_SUCCESS", payload: payload.currentQuiz });
        router.push(`/multiplayer/${roomCode}/play`);
      });

    return () => {
      if (roomChannel) {
        supabase.removeChannel(roomChannel);
      }
    };
  }, [roomCode, router, currentUser]);

  useEffect(() => {
    if (isCreator) {
      updateGameSettings("topic", topic);
    }
  }, [players]);

  useEffect(() => {
    setIsMultiplayerMode(true);
    return () => setIsMultiplayerMode(false);
  }, []);

  const changeAmountOfPlayers = async (newAmount: number) => {
    if (!channel || !isCreator) return;

    try {
      const client = createApiClient();
      const response = await client.api.v1.rooms[":roomCode"][
        "settings"
      ].$patch({
        param: {
          roomCode: roomCode,
        },
        json: {
          type: "maxPlayers",
          value: newAmount,
        },
      });
      if (!response.ok) {
        const errorData = (await response.json()) as unknown as {
          message: string;
        };
        toast({
          duration: 3500,
          variant: "destructive",
          title: "Something went wrong.",
          description: errorData.message,
        });
        return;
      }

      // Update local state and broadcast to others
      setMaxPlayers(newAmount);
      await channel.send({
        type: "broadcast",
        event: "change-amount-of-players",
        payload: { newAmount },
      });
    } catch (error) {
      console.error("Failed to update max players:", error);
    }
  };

  const updateGameSettings = async (
    type: "numQuestions" | "timeLimit" | "topic" | "language" | "showAnswers",
    value: number | string | boolean,
  ) => {
    if (!channel || !isCreator) return;

    try {
      const client = createApiClient();

      // Update on the Database
      // To Do type === 'language' || -- February 5th
      // Done: -- February 9th
      if (
        type === "timeLimit" ||
        type === "numQuestions" ||
        type === "language" ||
        type === "topic"
      ) {
        await client.api.v1.rooms[":roomCode"]["settings"].$patch({
          param: {
            roomCode: roomCode,
          },
          json: {
            type,
            value,
          },
        });
      }

      await channel.send({
        type: "broadcast",
        event: "settings-update",
        payload: { type, value },
      });
    } catch (error) {
      console.error("Failed to update game settings:", error);
    }
  };

  // debounce the updateGameSettings function to prevent multiple API requests
  const debouncedUpdateSettings = useDebouncedCallback(
    (
      type: "numQuestions" | "timeLimit" | "topic" | "language" | "showAnswers",
      value: number | string | SupportedLanguages | boolean,
    ) => {
      updateGameSettings(type, value);
    },
    555,
  );

  const startQuiz = async () => {
    if (!channel || !isCreator) return;
    
    if (!topic?.trim()) {
      setTopicError("Quiz topic is required");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a quiz topic",
      });
      return;
    }

    setTopicError(null); // Clear error when topic is valid
    const quizCreation = {
      topic,
      number: questionCount,
      description: topic,
      tags: [topic],
      showCorrectAnswers: true,
      passingScore: 70,
      questions: [],
      quizLanguage: language,
      quizType: QuizType.Enum.multiplayer,
    } as QuizData;
    fetchQuestions(quizCreation, roomId);
  };

  useEffect(() => {
    const handleQuizFinished = async () => {
      if (!channel) return;
      if (isLoading) {
        await channel.send({
          type: "broadcast",
          event: "loading-animation",
          payload: {},
        });
      }

      if (fetchingFinished && currentQuiz && !isLoading) {
        await channel.send({
          type: "broadcast",
          event: "quiz-start",
          payload: { currentQuiz, roomId },
        });
        router.push(`/multiplayer/${roomCode}/play`);
      }
    };

    handleQuizFinished();
  }, [fetchingFinished, currentQuiz, isLoading]);

  useEffect(() => {
    if (isCreator && timeLimit === undefined && questionCount === undefined) {
      setTimeLimit(DEFAULT_SETTINGS.timeLimit);
      setQuestionCount(DEFAULT_SETTINGS.questionCount);
      debouncedUpdateSettings("timeLimit", DEFAULT_SETTINGS.timeLimit);
      debouncedUpdateSettings("numQuestions", DEFAULT_SETTINGS.questionCount);
    }
  }, [isCreator]);

  useEffect(() => {
    if (timeLimit === FAST_SETTINGS.timeLimit && questionCount === FAST_SETTINGS.questionCount) {
      setGameMode('fast');
    } else if (timeLimit === DEFAULT_SETTINGS.timeLimit && questionCount === DEFAULT_SETTINGS.questionCount) {
      setGameMode('default');
    } else if (timeLimit !== undefined && questionCount !== undefined) {
      setGameMode('custom');
    }
  }, [timeLimit, questionCount]);

  const handleModeSelect = async (mode: GameMode) => {
    if (!isCreator) return;

    let newSettings;
    switch (mode) {
      case 'fast':
        newSettings = FAST_SETTINGS;
        break;
      case 'default':
        newSettings = DEFAULT_SETTINGS;
        break;
      default:
        return; 
    }

    setTimeLimit(newSettings.timeLimit);
    setQuestionCount(newSettings.questionCount);
    
    // Update both settings
    await debouncedUpdateSettings("timeLimit", newSettings.timeLimit);
    await debouncedUpdateSettings("numQuestions", newSettings.questionCount);
  };

  if (isLoading) {
    return (
      <div className="absolute left-1/2 top-1/2 flex w-[40] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[30vw]">
        <Lottie
          animationData={resolvedTheme === "dark" ? LoadingDark : Loading}
        />
      </div>
    );
  }
  return (
    <>
      <div className="relative flex flex-col w-full min-h-screen">
        <div className="relative z-10 flex flex-col w-full gap-8 p-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
              alt="IntelliQ"
              width={250}
              height={250}
            />
          </div>

          <div className="grid lg:grid-cols-[300px_1fr] gap-8 max-w-7xl mx-auto w-full">
            {/* Player List */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <UsersRound />
                  <div className="flex items-center gap-1">
                    <h2 className="flex items-center text-xl font-semibold uppercase">
                      <NumberFlow
                        willChange
                        plugins={[continuous]}
                        value={players.length}
                        prefix="players "
                      />
                      /
                      <NumberFlow
                        willChange
                        plugins={[continuous]}
                        value={maxPlayers}
                      />
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xl text-primary">
                  <span className="font-semibold leading-none tracking-tighter text-balance">
                    Room:
                  </span>
                  <SparklesText
                    className="text-xl italic font-thin"
                    text={roomCode}
                    sparklesCount={3}
                    colors={{ first: "#c8b6ff", second: "#a799e0" }}
                  />
                </div>
              </div>

              <Select
                disabled={!isCreator}
                onValueChange={(value) => {
                  changeAmountOfPlayers(Number(value));
                }}
                value={`${maxPlayers}`}
              >
                <SelectTrigger className="w-full border-gray-800">
                  <SelectValue placeholder="Select players" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(9)].map((slot, i) => {
                    return (
                      <SelectItem
                        disabled={i + 2 < players.length}
                        key={i}
                        value={`${i + 2}`}
                      >
                        {i + 2} Players
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <ScrollArea className="w-full h-[400px]">
                <div className="space-y-4">
                  {[...Array(maxPlayers)].map((_, i) => {
                    if (i === 0 && players.length > 0) {
                      // Render the leader of the lobby
                      const leader = players[0];
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-4 bg-gray-200 rounded-lg dark:bg-gray-900/50"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={leader?.avatar} />
                            <AvatarFallback className="text-black bg-primary/20 dark:text-primary">
                              {leader?.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`${
                              leader?.userName === currentUser?.name &&
                              "font-extrabold"
                            }`}
                          >
                            {leader?.userName}{" "}
                          </span>
                          <div className="flex gap-1 ml-auto">
                            <Crown className="w-6 h-6 text-primary" />
                          </div>
                        </div>
                      );
                    } else if (i < players.length) {
                      // Render other players
                      const player = players[i];
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-4 bg-gray-200 rounded-lg dark:bg-gray-900/50"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={player?.avatar} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {player?.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`${
                              player?.userName === currentUser?.name &&
                              "font-extrabold"
                            }`}
                          >
                            {player?.userName}
                          </span>
                        </div>
                      );
                    }
                    // Render empty slots for remaining slots
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-4 bg-gray-200 rounded-lg dark:bg-gray-900/50"
                      >
                        <div className="w-8 h-8 border border-gray-800 rounded-full" />
                        <span className="text-gray-400">Empty</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-8">
              {/* Game Modes */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card 
                  className={`flex flex-col items-center justify-center gap-2 p-6 cursor-pointer ${
                    gameMode === 'default' 
                      ? 'bg-primary/10 border-primary' 
                      : 'dark:bg-black dark:border-gray-800'
                  }`}
                  onClick={() => handleModeSelect('default')}
                >
                  <Brain className="w-8 h-8 text-primary" />
                  <span>Default</span>
                </Card>
                <Card 
                  className={`flex flex-col items-center justify-center gap-2 p-6 cursor-pointer ${
                    gameMode === 'fast' 
                      ? 'bg-primary/10 border-primary' 
                      : 'dark:bg-black dark:border-gray-800'
                  }`}
                  onClick={() => handleModeSelect('fast')}
                >
                  <Zap className="w-8 h-8 text-primary" />
                  <span>Fast</span>
                </Card>
                <Card 
                  className={`flex flex-col items-center justify-center gap-2 p-6 cursor-pointer ${
                    gameMode === 'custom' 
                      ? 'bg-primary/10 border-primary' 
                      : 'dark:bg-black dark:border-gray-800'
                  }`}
                >

                  <Sparkles className="w-8 h-8 text-primary" />
                  <span>Custom</span>
                </Card>
              </div>

              {/* Settings */}
              <div className="space-y-6">
                <h2 className="text-2xl">Settings</h2>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label>Question count</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">1</span>
                      <Slider
                        disabled={!isCreator}
                        value={[questionCount]}
                        max={10}
                        min={1}
                        step={1}
                        className="flex-1"
                        onValueChange={(value) => {
                          setQuestionCount(value[0]);
                          debouncedUpdateSettings("numQuestions", value[0]);
                        }}
                      />
                      <span className="text-sm text-gray-400">10</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Time Limit per Question</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">5s</span>
                      <Slider
                        disabled={!isCreator}
                        value={[timeLimit]}
                        max={60}
                        min={5}
                        step={5}
                        className="flex-1"
                        onValueChange={(value) => {
                          setTimeLimit(value[0]);
                          debouncedUpdateSettings("timeLimit", value[0]);
                        }}
                      />
                      <span className="text-sm text-gray-400">60s</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex">
                      <Label
                        htmlFor="quizLanguage"
                        className="flex items-center space-x-2"
                      >
                        <span>Language</span>
                        <Select
                          disabled={!isCreator}
                          onValueChange={(value: SupportedLanguages) => {
                            setLanguage(value);
                            debouncedUpdateSettings("language", value);
                          }}
                          value={language}
                        >
                          <SelectTrigger className="w-full dark:bg-black dark:border-gray-800">
                            <SelectValue placeholder="Select Language" />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Topic</Label>
                    <Input
                      disabled={!isCreator}
                      placeholder="Formula One"
                      className="bg-transparent dark:bg-black dark:border-gray-800"
                      value={topic}
                      onChange={(e) => {
                        debouncedUpdateSettings("topic", e.target.value);
                        setTopic(e.target.value);
                      }}
                    />
                    {topicError && isCreator && (
                      <p className="text-red-500">{topicError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <InviteButton />
            {isCreator && (
              <Button
                onClick={startQuiz}
                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
              >
                START
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={isRoomFull} onOpenChange={setIsRoomFull}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Room Full</AlertDialogTitle>
            <AlertDialogDescription>
              This room is full. Please try another room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push("/")}>
              OK
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
