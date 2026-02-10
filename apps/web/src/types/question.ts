// API 側から型をインポート
export type { QuestionWithCategoryResponse as QuestionDto } from "../../../api/src/presentation/routes/question/type";

export type SessionPhase = "answering" | "reviewing" | "completed";

export type AnswerResult = {
  questionId: string;
  selectedIndexes: number[];
  isCorrect: boolean;
};

export type SessionState = {
  phase: SessionPhase;
  currentIndex: number;
  selectedIndexes: number[];
  results: AnswerResult[];
};

export type SessionAction =
  | { type: "SELECT_SINGLE"; index: number }
  | { type: "TOGGLE_MULTI"; index: number }
  | { type: "SUBMIT" }
  | { type: "NEXT" }
  | { type: "RESET" };
