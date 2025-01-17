import ISO6391 from 'iso-639-1';

export const generateQuizPrompt = (
  quizTopic: string,
  quizDescription: string,
  numberOfQuestions: number,
  quizTags?: string[],
  language: string = 'en'
) => `
Generate a quiz JSON object in ${language} language based on the topic: ${quizTopic}
Quiz Overview: ${quizDescription}
Create ${numberOfQuestions} questions that align with this description.
${quizTags ? `Include aspects related to the following tags: ${quizTags.join(", ")}.` : ""}

Important: Generate ALL text content (quizTitle, questionTitle, text, and options) in ${ISO6391.getName(language)} language.
Only keep proper names (like "Max Verstappen") and measurements (like "4.381 km") unchanged.
The questions should have exactly four options labeled a), b), c), and d).
Each question should have a unique questionTitle that is contextual and creative.`;
