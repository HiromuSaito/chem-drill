import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { client } from "@/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const CATEGORY_COLORS: Record<string, string> = {
  日常物質: "text-green-600 bg-green-100",
  一般薬品: "text-blue-600 bg-blue-100",
  劇物: "text-orange-600 bg-orange-100",
  毒物: "text-red-600 bg-red-100",
  特定毒物: "text-purple-600 bg-purple-100",
  最終ランク: "text-yellow-600 bg-yellow-100",
};

export function RankCard() {
  const { data: rankInfo, isLoading } = useQuery({
    queryKey: ["rank"],
    queryFn: async () => {
      const res = await client.api.rank.$get();
      if (!res.ok) throw new Error("Failed to fetch rank info");
      return res.json();
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!rankInfo) return null;

  const colorClass =
    CATEGORY_COLORS[rankInfo.category] ?? "text-gray-600 bg-gray-100";
  const remaining = rankInfo.nextRankExp
    ? rankInfo.nextRankExp - rankInfo.totalExp
    : null;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">
              化学物質取扱者 Lv.{rankInfo.currentRank} — {rankInfo.substance}
            </p>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
            >
              {rankInfo.category}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {rankInfo.totalExp} EXP
          </p>
        </div>

        <p className="text-sm font-medium text-primary">
          {rankInfo.currentRank === 0
            ? "化学物質取扱者見習いです"
            : `あなたは${rankInfo.substance}を扱えます！！`}
        </p>

        {remaining !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>次のレベルまで</span>
              <span>あと {remaining} EXP</span>
            </div>
            <Progress value={rankInfo.progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
