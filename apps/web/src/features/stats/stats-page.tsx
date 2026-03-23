import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/client";
import { Loader2 } from "lucide-react";
import { StatsRadialChart } from "./stats-radial-chart";
import { CategoryStatsList } from "./category-stats-list";
import { RecentSessions } from "./recent-sessions";

const ALL_CATEGORIES = "__all__";

export function StatsPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORIES);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await client.api.categories.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const categoryId =
    selectedCategoryId === ALL_CATEGORIES ? undefined : selectedCategoryId;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["drill-stats", categoryId],
    queryFn: async () => {
      const query: Record<string, string> = {};
      if (categoryId) query.categoryId = categoryId;
      const res = await client.api["drill-stats"].$get({ query });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const correctRate =
    stats && stats.totalAnswered > 0
      ? stats.correctCount / stats.totalAnswered
      : 0;
  const coverageRate =
    stats && stats.totalQuestions > 0
      ? stats.uniqueQuestionsAnswered / stats.totalQuestions
      : 0;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">成績</h2>
        <Select
          value={selectedCategoryId}
          onValueChange={setSelectedCategoryId}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>すべて</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : stats && stats.totalAnswered > 0 ? (
        <div className="space-y-6">
          <StatsRadialChart
            correctRate={correctRate}
            coverageRate={coverageRate}
          />

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold tabular-nums">
                {stats.totalAnswered}
              </p>
              <p className="text-xs text-muted-foreground">総回答数</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold tabular-nums">
                {stats.uniqueQuestionsAnswered}/{stats.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">問題カバー数</p>
            </div>
          </div>

          {"categoryStats" in stats &&
            stats.categoryStats &&
            stats.categoryStats.length > 0 && (
              <CategoryStatsList categoryStats={stats.categoryStats} />
            )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <p className="text-muted-foreground">まだ回答データがありません</p>
          <p className="text-sm text-muted-foreground">
            ドリルを完了すると成績が表示されます
          </p>
        </div>
      )}

      <RecentSessions categoryId={categoryId} />
    </div>
  );
}
