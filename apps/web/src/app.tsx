import { useQuery } from "@tanstack/react-query";
import { client } from "./client";
import { SessionContainer } from "./features/question/session-container";

export function App() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["questions", "random"],
    queryFn: async () => {
      const res = await client.api.questions.random.$get();
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-destructive">エラー: {error.message}</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">問題がありません</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <SessionContainer questions={data} />
    </div>
  );
}
