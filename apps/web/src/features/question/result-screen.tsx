import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AnswerResult } from "@/types/question";
import { Trophy } from "lucide-react";

type Props = {
  results: AnswerResult[];
  onRetry: () => void;
};

export function ResultScreen({ results, onRetry }: Props) {
  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="size-6 text-primary" />
        </div>
        <CardTitle>結果</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">
            {correct} / {total}
          </p>
          <p className="text-muted-foreground">問正解</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>正答率</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        <Button onClick={onRetry} className="w-full">
          もう一度挑戦する
        </Button>
      </CardContent>
    </Card>
  );
}
