import { Question } from "../../../domain/question/Question";

export type QuestionResponse = {
  id: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  category: string;
};

export function toQuestionResponse(question: Question): QuestionResponse {
  return {
    id: question.id.value,
    text: question.text.value,
    difficulty: question.difficulty.value,
    choices: [...question.choices],
    correctIndexes: [...question.correctIndexes.values],
    explanation: question.explanation.value,
    category: question.categoryId.value,
  };
}
