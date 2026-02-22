import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { client } from "@/client";
import { SessionContainer } from "@/features/question/session-container";

export function DrillPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryId = searchParams.get("categoryId") ?? undefined;
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ["questions", "random", categoryId, limit],
    queryFn: async () => {
      const query: Record<string, string> = {};
      if (categoryId) query.categoryId = categoryId;
      if (limit) query.limit = String(limit);
      const res = await client.api.questions.random.$get({ query });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
    refetchOnWindowFocus: false,
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
      <SessionContainer
        questions={data}
        categoryId={categoryId}
        onAbort={() => navigate("/")}
        resultActions={
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 size-4" />
            カテゴリ選択に戻る
          </Button>
        }
      />
    </div>
  );
}
