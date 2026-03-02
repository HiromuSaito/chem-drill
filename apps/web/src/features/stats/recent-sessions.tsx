import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { client } from "@/client";

type SessionSummary = {
  sessionId: string;
  categoryId: string | null;
  categoryName: string | null;
  totalCount: number;
  correctCount: number;
  completedAt: string;
};

type Props = {
  categoryId?: string;
  fetchFn?: (query: Record<string, string>) => Promise<SessionSummary[]>;
  queryKeyPrefix?: string;
};

const PAGE_SIZE = 10;

export function RecentSessions({
  categoryId,
  fetchFn,
  queryKeyPrefix = "drill-sessions",
}: Props) {
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: [queryKeyPrefix, "recent", categoryId, offset],
    queryFn: async () => {
      const query: Record<string, string> = {
        limit: String(PAGE_SIZE + 1),
        offset: String(offset),
      };
      if (categoryId) query.categoryId = categoryId;

      if (fetchFn) {
        return fetchFn(query);
      }

      const res = await client.api["drill-sessions"].recent.$get({ query });
      if (!res.ok) throw new Error("Failed to fetch recent sessions");
      return res.json();
    },
  });

  const sessions = data?.slice(0, PAGE_SIZE) ?? [];
  const hasMore = (data?.length ?? 0) > PAGE_SIZE;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">最近のセッション</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        )}
        {!isLoading && sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            セッション履歴がありません
          </p>
        )}
        <div className="space-y-3">
          {sessions.map((session) => {
            const rate =
              session.totalCount > 0
                ? Math.round((session.correctCount / session.totalCount) * 100)
                : 0;
            const date = new Date(session.completedAt);
            return (
              <div
                key={session.sessionId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {session.categoryName ?? "すべて"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("ja-JP")}{" "}
                      {date.toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm">
                    {session.correctCount}/{session.totalCount} 問正解
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      rate >= 80
                        ? "text-green-600"
                        : rate >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {rate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {offset > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              前へ
            </Button>
          )}
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              もっと見る
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
