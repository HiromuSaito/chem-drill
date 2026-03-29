import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AnswerResult } from "@/types/question";
import { Trophy, Zap } from "lucide-react";
import { client } from "@/client";
import { RankUpModal } from "./rank-up-modal";

type Props = {
  results: AnswerResult[];
  onRetry?: () => void;
  children?: React.ReactNode;
  checkRankUp?: boolean;
};

export function ResultScreen({
  results,
  onRetry,
  children,
  checkRankUp = true,
}: Props) {
  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const [showRankUpModal, setShowRankUpModal] = useState(true);

  const { data: pendingRankUps } = useQuery({
    queryKey: ["rank", "pending-rank-ups"],
    queryFn: async () => {
      const res = await client.api.rank["pending-rank-ups"].$get();
      if (!res.ok) throw new Error("Failed to fetch pending rank ups");
      return res.json();
    },
    enabled: checkRankUp,
  });

  return (
    <>
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

          {checkRankUp && (
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary/5 py-2 text-sm font-medium text-primary">
              <Zap className="size-4" />
              <span>+{10 + correct * 2} EXP 獲得！</span>
            </div>
          )}

          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              もう一度挑戦する
            </Button>
          )}
          {children}
        </CardContent>
      </Card>

      {showRankUpModal && pendingRankUps && pendingRankUps.length > 0 && (
        <RankUpModal
          rankUps={pendingRankUps}
          onClose={() => setShowRankUpModal(false)}
        />
      )}
    </>
  );
}
