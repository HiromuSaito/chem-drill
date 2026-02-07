import { trpc } from "./trpc";
import { FlaskConical } from "lucide-react";
import { SessionContainer } from "./features/question/SessionContainer";

export function App() {
  const { data, isLoading, error } = trpc.question.getSession.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-destructive">エラー: {error.message}</p>
      </div>
    );
  }

  if (!data?.questions.length) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">問題がありません</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="border-b bg-background px-6 py-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <FlaskConical className="size-5 text-primary" />
          Chem Drill
        </h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <SessionContainer questions={data.questions} />
      </main>
    </div>
  );
}
