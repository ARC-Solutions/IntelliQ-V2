export const generateQuizPrompt = (
  quizTopic: string,
  quizDescription: string,
  numberOfQuestions: number,
  quizTags?: string[]
) => `
Generate a quiz JSON object based on the topic: ${quizTopic}
Quiz Overview: ${quizDescription}
Create ${numberOfQuestions} questions that align with this description.
${
  quizTags
    ? `Include aspects related to the following tags: ${quizTags.join(", ")}.`
    : ""
}

The JSON object should be structured as follows:

  {
    "quizTitle": "Contextual and Unique Quiz Title Here",
    "questions": [
      {
        "questionTitle": "Unique and Contextual Question Title Here",
        "text": "The actual question here?",
        "options": [
          "a) Option 1",
          "b) Option 2",
          "c) Option 3",
          "d) Option 4"
        ],
        "correctAnswer": "a) Option 1"
      }
      // More questions here...
    ]
  }

Once the quizTitle is set, it should not change. Each question should have a unique questionTitle. 
The questions should have exactly four options labeled a), b), c), and d). 
The Contextual questionTitle is not allowed to contain 'Question Number' or 'Interest Question Number', 
think of something very special for each individual question.`;
