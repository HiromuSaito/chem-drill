import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/client";

const LIMIT_OPTIONS = [5, 10, 20] as const;

export function CategorySelectPage() {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [limit, setLimit] = useState<number>(10);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await client.api.categories.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: categoryScores } = useQuery({
    queryKey: ["drill-stats", "category-scores"],
    queryFn: async () => {
      const res = await client.api["drill-stats"]["category-scores"].$get();
      if (!res.ok) throw new Error("Failed to fetch category scores");
      return res.json();
    },
  });

  const { data: overallStats } = useQuery({
    queryKey: ["drill-stats"],
    queryFn: async () => {
      const res = await client.api["drill-stats"].$get({ query: {} });
      if (!res.ok) throw new Error("Failed to fetch overall stats");
      return res.json();
    },
  });

  const scoreMap = new Map(categoryScores?.map((s) => [s.categoryId, s]) ?? []);

  const overallCorrectRate =
    overallStats && overallStats.totalAnswered > 0
      ? overallStats.correctCount / overallStats.totalAnswered
      : null;
  const overallCoverageRate =
    overallStats && overallStats.totalQuestions > 0
      ? overallStats.uniqueQuestionsAnswered / overallStats.totalQuestions
      : null;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalQuestionCount =
    categories?.reduce((sum, c) => sum + c.questionCount, 0) ?? 0;

  const handleStart = () => {
    const params = new URLSearchParams();
    if (selectedCategoryId) {
      params.set("categoryId", selectedCategoryId);
    }
    params.set("limit", String(limit));
    navigate(`/drill?${params.toString()}`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">カテゴリを選択</h2>
        <p className="text-sm text-muted-foreground">
          出題するカテゴリを選んでください
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card
          className={`cursor-pointer transition-colors ${
            selectedCategoryId === null
              ? "border-primary ring-1 ring-primary"
              : "hover:border-primary/50"
          }`}
          onClick={() => setSelectedCategoryId(null)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">すべて</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {totalQuestionCount} 問
            </p>
            {overallCorrectRate !== null ? (
              <div className="mt-2 flex gap-2">
                <Badge variant="outline" className="text-xs">
                  正答率 {Math.round(overallCorrectRate * 100)}%
                </Badge>
                <Badge variant="outline" className="text-xs">
                  カバー率 {Math.round((overallCoverageRate ?? 0) * 100)}%
                </Badge>
              </div>
            ) : (
              <Badge variant="secondary" className="mt-2 text-xs">
                未挑戦
              </Badge>
            )}
          </CardContent>
        </Card>

        {categories?.map((category) => {
          const score = scoreMap.get(category.id);
          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-colors ${
                selectedCategoryId === category.id
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {category.questionCount} 問
                </p>
                {score ? (
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      正答率 {Math.round(score.correctRate * 100)}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      カバー率 {Math.round(score.coverageRate * 100)}%
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    未挑戦
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">出題数</h3>
        <div className="flex gap-2">
          {LIMIT_OPTIONS.map((option) => (
            <Button
              key={option}
              variant={limit === option ? "default" : "outline"}
              size="sm"
              onClick={() => setLimit(option)}
            >
              {option} 問
            </Button>
          ))}
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={handleStart}>
        <BookOpen className="mr-2 size-4" />
        開始
      </Button>
    </div>
  );
}
