import { z } from "zod";

// EN, DE, FR, ES, IT because most of our users are from these countries
export const supportedLanguages = z.enum([
  "en",
  "de",
  "fr",
  "es",
  "it",
  "ro",
  "sr",
  "tl",
  "pl",
]);

export const quizType = z.enum([
  "singleplayer",
  "multiplayer",
  "document",
  "random",
]);
