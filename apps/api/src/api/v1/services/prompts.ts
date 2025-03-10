import type { Quiz } from "../schemas/quiz.schemas";

export const generateQuizPrompt = (
  quizTopic: string,
  quizDescription: string,
  numberOfQuestions: number,
  quizTags?: string[],
) => `
Generate a quiz JSON object based on the topic: ${quizTopic}
Quiz Overview: ${quizDescription}
Create ${numberOfQuestions} questions that align with this description.
${
  quizTags
    ? `Include aspects related to the following tags: ${quizTags.join(", ")}.`
    : ""
}

Once the quizTitle is set, it should not change. Each question should have a unique questionTitle. 
The questions should have exactly four options.
Do not include any letters (a,b,c,d) in the options - these will be added automatically.
The Contextual questionTitle is not allowed to contain 'Question Number' or 'Interest Question Number', 
think of something very special for each individual question.`;

export const analyzeQuizPromptMultiplayer = (quiz: Quiz) => `
Analyze this multiplayer quiz and generate normalized tags:
           Title: ${quiz.title}
           Topics: ${quiz.topic.join(", ")}
           Description: ${quiz.description || ""}
           Questions Count: ${quiz.questionsCount}
           Player Count: ${quiz.room?.multiplayerQuizSubmissions.length}
           
           Questions:
           ${quiz.questions.map((q) => q.text).join("\n")}
           
           Generate 3-5 normalized, hierarchical tags.
           Tags should be lowercase with underscores.
           Include broader categories for better organization.
`;

export const analyzeQuizPromptSingleplayer = (quiz: Quiz) => `Analyze this singleplayer quiz and generate normalized tags:
           Title: ${quiz.title}
           Topics: ${quiz.topic.join(", ")}
           Description: ${quiz.description || ""}
           User Tags: ${quiz.tags?.join(", ") || ""}
           Questions Count: ${quiz.questionsCount}
           
           Questions:
           ${quiz.questions.map((q) => q.text).join("\n")}
           
           Generate 3-5 normalized, hierarchical tags.
           Tags should be lowercase with underscores.
           Include broader categories for better organization.`;
