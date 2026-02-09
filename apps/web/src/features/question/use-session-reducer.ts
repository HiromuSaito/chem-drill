import { useReducer, useCallback } from "react";
import type {
  QuestionDto,
  SessionState,
  SessionAction,
} from "@/types/question";

const initialState: SessionState = {
  phase: "answering",
  currentIndex: 0,
  selectedIndexes: [],
  results: [],
};

function sessionReducer(
  state: SessionState,
  action: SessionAction,
  questions: QuestionDto[],
): SessionState {
  switch (action.type) {
    case "SELECT_SINGLE":
      if (state.phase !== "answering") return state;
      return { ...state, selectedIndexes: [action.index] };

    case "TOGGLE_MULTI": {
      if (state.phase !== "answering") return state;
      const has = state.selectedIndexes.includes(action.index);
      return {
        ...state,
        selectedIndexes: has
          ? state.selectedIndexes.filter((i) => i !== action.index)
          : [...state.selectedIndexes, action.index],
      };
    }

    case "SUBMIT": {
      if (state.phase !== "answering") return state;
      if (state.selectedIndexes.length === 0) return state;

      const question = questions[state.currentIndex];
      const sorted = [...state.selectedIndexes].sort((a, b) => a - b);
      const correct = [...question.correctIndexes].sort((a, b) => a - b);
      const isCorrect =
        sorted.length === correct.length &&
        sorted.every((v, i) => v === correct[i]);

      return {
        ...state,
        phase: "reviewing",
        results: [
          ...state.results,
          {
            questionId: question.id,
            selectedIndexes: state.selectedIndexes,
            isCorrect,
          },
        ],
      };
    }

    case "NEXT": {
      if (state.phase !== "reviewing") return state;
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= questions.length) {
        return { ...state, phase: "completed" };
      }
      return {
        ...state,
        phase: "answering",
        currentIndex: nextIndex,
        selectedIndexes: [],
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function useSessionReducer(questions: QuestionDto[]) {
  const [state, dispatch] = useReducer(
    (s: SessionState, a: SessionAction) => sessionReducer(s, a, questions),
    initialState,
  );

  const selectSingle = useCallback(
    (index: number) => dispatch({ type: "SELECT_SINGLE", index }),
    [],
  );

  const toggleMulti = useCallback(
    (index: number) => dispatch({ type: "TOGGLE_MULTI", index }),
    [],
  );

  const submit = useCallback(() => dispatch({ type: "SUBMIT" }), []);
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, selectSingle, toggleMulti, submit, next, reset };
}
