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
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
  };

export function toQuestionWithCategoryAndDatesResponse(
  question: QuestionWithCategoryAndDates,
): QuestionWithCategoryAndDatesResponse {
  return {
    ...toQuestionWithCategoryResponse(question),
    isPublished: question.isPublished,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };
}
