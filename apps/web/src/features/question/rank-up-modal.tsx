import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { client } from "@/client";
import { RANK_DEFINITIONS } from "./rank-constants";
import "./rank-up-modal.css";

const CATEGORY_STYLES: Record<string, { text: string; glow: string }> = {
  日常物質: { text: "text-green-500", glow: "0, 200, 0" },
  一般薬品: { text: "text-blue-500", glow: "0, 100, 255" },
  劇物: { text: "text-orange-500", glow: "255, 165, 0" },
  毒物: { text: "text-red-500", glow: "255, 0, 0" },
  特定毒物: { text: "text-purple-500", glow: "128, 0, 255" },
  最終ランク: { text: "text-yellow-500", glow: "255, 215, 0" },
};

type RankUpEventDto = {
  id: string;
  userId: string;
  previousRank: number;
  newRank: number;
  createdAt: string;
};

type Props = {
  rankUps: RankUpEventDto[];
  onClose: () => void;
};

export function RankUpModal({ rankUps, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const markMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await client.api.rank["mark-displayed"].$post({
        json: { rankUpEventIds: ids },
      });
      if (!res.ok) throw new Error("Failed to mark rank ups as displayed");
    },
  });

  if (rankUps.length === 0) return null;

  const currentRankUp = rankUps[currentIndex];
  const rankDef = RANK_DEFINITIONS.find(
    (d) => d.rank === currentRankUp.newRank,
  );
  const style =
    CATEGORY_STYLES[rankDef?.category ?? ""] ?? CATEGORY_STYLES["日常物質"];
  const isLast = currentIndex === rankUps.length - 1;

  const handleNext = () => {
    if (isLast) {
      markMutation.mutate(
        rankUps.map((r) => r.id),
        { onSettled: onClose },
      );
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <Dialog open onOpenChange={() => handleNext()}>
      <DialogContent
        className="rank-up-glow text-center sm:max-w-md"
        style={{ "--glow-color": style.glow } as React.CSSProperties}
      >
        <DialogHeader>
          <DialogTitle className="rank-up-title text-2xl font-bold">
            取扱許可レベルアップ！
          </DialogTitle>
        </DialogHeader>

        <div className="rank-up-substance space-y-4 py-4">
          <p className={`text-4xl font-bold ${style.text}`}>
            Lv.{currentRankUp.newRank}
          </p>
          <p className="text-xl font-semibold">{rankDef?.substance}</p>
          <p className="text-primary">
            あなたは{rankDef?.substance}を扱えるようになりました！！
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          取扱レベルは
          <Link to="/stats" className="underline hover:text-foreground">
            成績画面
          </Link>
          で確認できます
        </p>

        <Button onClick={handleNext} className="w-full">
          {isLast ? "閉じる" : "次へ"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
