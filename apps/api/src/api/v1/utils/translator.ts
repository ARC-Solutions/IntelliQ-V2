import {
  TranslateClient,
  TranslateTextCommand,
} from "@aws-sdk/client-translate";
import { supportedLanguages } from "../schemas";

export const createTranslateClient = (c: {
  env: {
    AMAZON_REGION: string;
    AMAZON_ACCESS_KEY_ID: string;
    AMAZON_SECRET_ACCESS_KEY: string;
  };
}) => {
  return new TranslateClient({
    region: c.env.AMAZON_REGION,
    credentials: {
      accessKeyId: c.env.AMAZON_ACCESS_KEY_ID,
      secretAccessKey: c.env.AMAZON_SECRET_ACCESS_KEY,
    },
  });
};

export async function translateQuiz(
  quiz: any,
  targetLanguage: string,
  client: TranslateClient
) {
  const keysToTranslate = [
    "quizTitle",
    "questionTitle",
    "text",
    "options",
    "correctAnswer",
  ];

  async function translateText(text: string): Promise<string> {
    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: supportedLanguages.Enum.en,
      TargetLanguageCode: targetLanguage.toLowerCase(),
    });
    const response = await client.send(command);
    return response.TranslatedText ?? text;
  }

  async function translateFields(obj: any): Promise<any> {
    const translatedObj: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (!keysToTranslate.includes(key)) {
        translatedObj[key] =
          typeof value === "object" ? await translateFields(value) : value;
        continue;
      }

      if (key === "options" && Array.isArray(value)) {
        translatedObj[key] = await Promise.all(
          value.map((option) => translateText(option))
        );
      } else {
        translatedObj[key] = await translateText(String(value));
      }
    }

    return translatedObj;
  }

  return translateFields(quiz);
}
