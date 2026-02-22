import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
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
          </CardContent>
        </Card>

        {categories?.map((category) => (
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
            </CardContent>
          </Card>
        ))}
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
