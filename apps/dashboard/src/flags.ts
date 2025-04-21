import { dedupe, flag } from "flags/next";
import type { ReadonlyRequestCookies } from "flags";

const identify = dedupe(({ cookies }: { cookies: ReadonlyRequestCookies }) => {
  const hnAccess = cookies.get("hn-access")?.value;
  if (hnAccess) {
    return { user: { id: hnAccess } };
  }
});

export const allowHNMode = flag({
  key: "allow-hn-mode",
  description: "Allow HN mode",
  identify,
  decide: async ({ entities }) => {
    return entities?.user?.id === "true";
  },
  defaultValue: false,
});

export const allowSinglePlayerQuiz = flag({
  key: "allow-single-player-quiz",
  description: "Allow single player quiz",
  identify,
  decide: async ({ entities }) => {
    if (entities?.user?.id === "true") return true;
    const unlockDate = new Date("2025-04-21T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});

export const allowMultiplayerQuiz = flag({
  key: "allow-multiplayer-quiz",
  description: "Allow multiplayer quiz",
  identify,
  decide: async ({ entities }) => {
    if (entities?.user?.id === "true") return true;
    const unlockDate = new Date("2025-04-22T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});

export const allowDocuments = flag({
  key: "allow-documents",
  description: "Allow documents",
  identify,
  decide: async ({ entities }) => {
    if (entities?.user?.id === "true") return true;
    const unlockDate = new Date("2025-04-23T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});

export const allowBookmarks = flag({
  key: "allow-bookmarks",
  description: "Allow bookmarks",
  identify,
  decide: async ({ entities }) => {
    if (entities?.user?.id === "true") return true;
    const unlockDate = new Date("2025-04-24T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});

export const allowRandomQuiz = flag({
  key: "allow-random-quiz",
  description: "Allow random quiz",
  identify,
  decide: async ({ entities }) => {
    if (entities?.user?.id === "true") return true;
    const unlockDate = new Date("2025-04-25T13:00:00+02:00");
    const now = new Date();
    return now >= unlockDate;
  },
  defaultValue: false,
});
