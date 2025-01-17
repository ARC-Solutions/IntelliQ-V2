// TODO: REPLACE WITH AWS4FETCH
import { AwsClient } from "aws4fetch";
import { supportedLanguages } from "../schemas";
import { Context } from "hono";

const AWS_TRANSLATE_API = "https://translate.eu-north-1.amazonaws.com";

export const createTranslateClient = (c: Context) => {
  if (
    !c.env.AMAZON_ACCESS_KEY_ID ||
    !c.env.AMAZON_SECRET_ACCESS_KEY ||
    !c.env.AMAZON_REGION
  ) {
    throw new Error(
      JSON.stringify({
        message: "AWS Translate configuration missing",
        details: "Required AWS credentials are not configured",
      })
    );
  }

  return new AwsClient({
    accessKeyId: c.env.AMAZON_ACCESS_KEY_ID,
    secretAccessKey: c.env.AMAZON_SECRET_ACCESS_KEY,
    service: "translate",
    region: c.env.AMAZON_REGION,
  });
};

export async function translateText(
  text: string,
  targetLanguage: string,
  client: AwsClient
): Promise<string> {
  const response = await client.fetch(AWS_TRANSLATE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSShineFrontendService_20170701.TranslateText",
    },
    body: JSON.stringify({
      Text: text,
      SourceLanguageCode: supportedLanguages.Enum.en,
      TargetLanguageCode: targetLanguage.toLowerCase(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.statusText}`);
  }

  const result = (await response.json()) as { TranslatedText: string };
  return result.TranslatedText ?? text;
}

export async function translateQuiz(
  quiz: any,
  targetLanguage: string,
  client: AwsClient
) {
  const keysToTranslate = [
    "quizTitle",
    "questionTitle",
    "text",
    "options",
    "correctAnswer",
  ];

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
          value.map((option) => translateText(option, targetLanguage, client))
        );
      } else {
        translatedObj[key] = await translateText(
          String(value),
          targetLanguage,
          client
        );
      }
    }

    return translatedObj;
  }

  return translateFields(quiz);
}
