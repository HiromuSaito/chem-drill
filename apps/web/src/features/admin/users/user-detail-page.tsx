import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserIcon } from "@/components/user-icon";
import { client } from "@/client";
import { StatsRadialChart } from "@/features/stats/stats-radial-chart";
import { CategoryStatsList } from "@/features/stats/category-stats-list";
import { RecentSessions } from "@/features/stats/recent-sessions";

const ALL_CATEGORIES = "__all__";

const roleLabels: Record<string, string> = {
  admin: "管理者",
  user: "ユーザー",
};

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORIES);
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setSelectedCategoryId(ALL_CATEGORIES);
  }

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await client.api.admin.users[":id"].$get({
        param: { id: id! },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!id,
  });

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

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["admin-user-stats", id, categoryId],
    queryFn: async () => {
      const query: Record<string, string> = {};
      if (categoryId) query.categoryId = categoryId;
      const res = await client.api.admin.users[":id"].stats.$get({
        param: { id: id! },
        query,
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!id,
  });

  const fetchRecentSessions = useCallback(
    async (query: Record<string, string>) => {
      const res = await client.api.admin.users[":id"].stats[
        "recent-sessions"
      ].$get({
        param: { id: id! },
        query,
      });
      if (!res.ok) throw new Error("Failed to fetch recent sessions");
      return res.json();
    },
    [id],
  );

  const correctRate =
    stats && stats.totalAnswered > 0
      ? stats.correctCount / stats.totalAnswered
      : 0;
  const coverageRate =
    stats && stats.totalQuestions > 0
      ? stats.uniqueQuestionsAnswered / stats.totalQuestions
      : 0;

  if (isUserLoading) {
    return <Loader2 className="size-6 animate-spin text-muted-foreground" />;
  }

  if (isUserError || !user) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          ユーザー一覧に戻る
        </Link>
        <p className="text-muted-foreground">
          {isUserError
            ? "ユーザー情報の取得に失敗しました"
            : "ユーザーが見つかりません"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        ユーザー一覧に戻る
      </Link>

      <div className="flex items-center gap-4">
        <UserIcon name={user.name} image={user.image} size="lg" />
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {user.username && <span>@{user.username}</span>}
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {roleLabels[user.role] ?? user.role}
            </Badge>
            <span className="text-xs text-muted-foreground">
              登録日: {new Date(user.createdAt).toLocaleDateString("ja-JP")}
            </span>
            {user.lastLoginAt && (
              <span className="text-xs text-muted-foreground">
                最終ログイン:{" "}
                {new Date(user.lastLoginAt).toLocaleDateString("ja-JP")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">成績</h3>
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

      {isStatsLoading ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
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
        </div>
      )}

      <RecentSessions
        categoryId={categoryId}
        fetchFn={fetchRecentSessions}
        queryKeyPrefix={`admin-user-sessions-${id}`}
      />
    </div>
  );
}
