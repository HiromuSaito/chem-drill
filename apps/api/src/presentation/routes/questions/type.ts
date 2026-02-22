import type { Question } from "../../../domain/question/entity/question.ts";
import type {
  QuestionWithCategory,
  QuestionWithCategoryAndDates,
} from "../../../domain/question/query-service/question-query-service.ts";

export type QuestionWithCategoryResponse = {
  id: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  category: {
    categoryId: string;
    categoryName: string;
  };
};
export function toQuestionWithCategoryResponse(
  question: QuestionWithCategory,
): QuestionWithCategoryResponse {
  return {
    id: question.id,
    text: question.text,
    difficulty: question.difficulty,
    choices: question.choices,
    correctIndexes: question.correctIndexes,
    explanation: question.explanation,
    category: {
      categoryId: question.category.categoryId,
      categoryName: question.category.categoryName,
    },
  };
}

export type QuestionWithCategoryAndDatesResponse =
  QuestionWithCategoryResponse & {
    createdAt: string;
    updatedAt: string;
  };

export function toQuestionWithCategoryAndDatesResponse(
  question: QuestionWithCategoryAndDates,
): QuestionWithCategoryAndDatesResponse {
  return {
    ...toQuestionWithCategoryResponse(question),
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };
}

export type CreatedQuestionResponse = {
  id: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
};

export function toCreatedQuestionResponse(
  question: Question,
): CreatedQuestionResponse {
  return {
    id: question.id,
    text: question.text.value,
    difficulty: question.difficulty.value,
    choices: [...question.choices],
    correctIndexes: [...question.correctIndexes.values],
    explanation: question.explanation.value,
    categoryId: question.categoryId,
  };
}
