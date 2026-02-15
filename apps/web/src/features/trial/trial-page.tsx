import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FlaskConical, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { client } from "@/client";
import { SessionContainer } from "@/features/question/session-container";

export function TrialPage() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["questions", "random", "trial"],
    queryFn: async () => {
      const res = await client.api["random-question"].random.$get();
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

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

  if (!data?.length) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">問題がありません</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex items-center border-b bg-background px-6 py-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <FlaskConical className="size-5 text-primary" />
          Chem Drill
        </h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <SessionContainer
          questions={data}
          showRetry={false}
          resultActions={
            <>
              <hr className="border-border" />
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  アカウントを作成すると、もっと多くの問題に挑戦できます
                </p>
                <Button className="w-full" onClick={() => navigate("/signup")}>
                  <UserPlus />
                  新規登録して他の問題も試す
                </Button>
              </div>
            </>
          }
        />
      </main>
    </div>
  );
}
