import { trpc } from "./trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

const choiceLabel = (index: number) => String.fromCharCode(65 + index);

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

  const question = data?.questions[0];
  if (!question) {
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
          <FlaskConical className="size-5 text-teal-600" />
          Chem Drill
        </h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{question.category}</Badge>
              <Badge variant="outline">{question.difficulty}</Badge>
            </div>
            <CardTitle className="text-base">{question.text}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {question.choices.map((choice, i) => (
              <Button
                key={i}
                variant="outline"
                className="h-auto justify-start px-4 py-3 text-left"
              >
                <span className="mr-3 font-mono text-muted-foreground">
                  {choiceLabel(i)}
                </span>
                {choice}
              </Button>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
