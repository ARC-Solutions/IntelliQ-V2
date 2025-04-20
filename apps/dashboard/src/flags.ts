import { flag } from "flags/next";

export const allowSinglePlayerQuiz = flag({
  key: "allow-single-player-quiz",
  description: "Allow single player quiz",
  decide: async () => {
    const unlockDate = new Date("2025-04-21T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});

export const allowMultiplayerQuiz = flag({
  key: "allow-multiplayer-quiz",
  description: "Allow multiplayer quiz",
  decide: async () => {
    const unlockDate = new Date("2025-04-22T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});

export const allowDocuments = flag({
  key: "allow-documents",
  description: "Allow documents",
  decide: async () => {
    const unlockDate = new Date("2025-04-23T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});

export const allowBookmarks = flag({
  key: "allow-bookmarks",
  description: "Allow bookmarks",
  decide: async () => {
    const unlockDate = new Date("2025-04-24T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});

export const allowRandomQuiz = flag({
  key: "allow-random-quiz",
  description: "Allow random quiz",
  decide: async () => {
    const unlockDate = new Date("2025-04-25T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});
