import type { QuestionDto } from "@/types/question";
import { useSessionReducer } from "./use-session-reducer";
import { QuestionCard } from "./question-card";
import { SessionProgress } from "./session-progress";
import { ResultScreen } from "./result-screen";

type Props = {
  questions: QuestionDto[];
};

export function SessionContainer({ questions }: Props) {
  const { state, selectSingle, toggleMulti, submit, next, reset } =
    useSessionReducer(questions);

  if (state.phase === "completed") {
    return <ResultScreen results={state.results} onRetry={reset} />;
  }

  const currentQuestion = questions[state.currentIndex];
  const isMultiple = currentQuestion.correctIndexes.length > 1;
  const isAnswered = state.phase === "reviewing";
  const lastResult = isAnswered
    ? state.results[state.results.length - 1]
    : null;

  return (
    <div className="space-y-4">
      <SessionProgress current={state.currentIndex} total={questions.length} />
      <QuestionCard
        question={currentQuestion}
        selectedIndexes={state.selectedIndexes}
        isAnswered={isAnswered}
        isCorrect={lastResult?.isCorrect ?? null}
        onSelect={isMultiple ? toggleMulti : selectSingle}
        onSubmit={submit}
        onNext={next}
        isLast={state.currentIndex === questions.length - 1}
      />
    </div>
  );
}
