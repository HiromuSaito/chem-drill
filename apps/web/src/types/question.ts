// API 側から型をインポート（tRPC で型共有）
export type { QuestionResponse as QuestionDto } from "../../../api/src/presentation/trpc/question/type";

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
