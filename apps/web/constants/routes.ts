const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const ROUTES = {
  HOME: `${BASE_URL}/`,
  SINGLEPLAYER: `${BASE_URL}/single-player/quiz`,
  MULTIPLAYER: `${BASE_URL}/multiplayer`,
  DOCUMENTS: `${BASE_URL}/documents`,
  RANDOMQUIZ: `${BASE_URL}/random-quiz`,
  HISTORY: `${BASE_URL}/history`,
  BOOKMARKS: `${BASE_URL}/bookmarks`,
  SETTINGS: `${BASE_URL}/settings`,
  THESIS: `${BASE_URL}/thesis/IntelliQ-DA-Final_Redacted.pdf`
} as const;
