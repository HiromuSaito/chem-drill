import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { CircleStop } from "lucide-react";
import type { QuestionDto } from "@/types/question";
import { Button } from "@/components/ui/button";
import { client } from "@/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSessionReducer } from "./use-session-reducer";
import { QuestionCard } from "./question-card";
import { SessionProgress } from "./session-progress";
import { ResultScreen } from "./result-screen";

type Props = {
  questions: QuestionDto[];
  categoryId?: string;
  resultActions?: React.ReactNode;
  showRetry?: boolean;
  saveResult?: boolean;
  onAbort?: () => void;
};

export function SessionContainer({
  questions,
  categoryId,
  resultActions,
  showRetry = true,
  saveResult = true,
  onAbort,
}: Props) {
  const { state, selectSingle, toggleMulti, submit, next, reset } =
    useSessionReducer(questions);
  const [showAbortDialog, setShowAbortDialog] = useState(false);
  const startedAtRef = useRef(new Date().toISOString());
  const hasSavedRef = useRef(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api["drill-sessions"].$post({
        json: {
          categoryId: categoryId ?? null,
          answers: state.results.map((r) => ({
            questionId: r.questionId,
            selectedIndexes: r.selectedIndexes,
            isCorrect: r.isCorrect,
          })),
          startedAt: startedAtRef.current,
        },
      });
      if (!res.ok) throw new Error("Failed to save session");
      return res.json();
    },
  });

  useEffect(() => {
    if (state.phase === "completed" && !hasSavedRef.current && saveResult) {
      hasSavedRef.current = true;
      saveMutation.mutate();
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.phase === "completed") {
    return (
      <ResultScreen
        results={state.results}
        onRetry={showRetry ? reset : undefined}
      >
        {resultActions}
      </ResultScreen>
    );
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
      {onAbort && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setShowAbortDialog(true)}
          >
            <CircleStop className="mr-1 size-4" />
            中止する
          </Button>
          <AlertDialog open={showAbortDialog} onOpenChange={setShowAbortDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ドリルを中止しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  現在の進捗は保存されません。カテゴリ選択画面に戻ります。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>続ける</AlertDialogCancel>
                <AlertDialogAction onClick={onAbort}>
                  中止する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
