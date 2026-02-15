import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusLabels, statusVariants, difficultyLabels } from "./constants";

type Proposal = {
  status: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  rejectReason: string | null;
};

type ProposalDetailViewProps = {
  proposal: Proposal;
  canEdit: boolean;
  onEdit: () => void;
  onApprove: () => void;
  onRejectClick: () => void;
  approvePending: boolean;
};

export function ProposalDetailView({
  proposal,
  canEdit,
  onEdit,
  onApprove,
  onRejectClick,
  approvePending,
}: ProposalDetailViewProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/proposals")}
        >
          <ArrowLeft className="size-4" />
          一覧へ戻る
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">提案詳細</h2>
          <Badge variant={statusVariants[proposal.status] ?? "outline"}>
            {statusLabels[proposal.status] ?? proposal.status}
          </Badge>
          <Badge variant="secondary">
            {difficultyLabels[proposal.difficulty] ?? proposal.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {proposal.status === "pending" && (
            <Button variant="destructive" onClick={onRejectClick}>
              <X className="size-4" />
              却下
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Pencil className="size-4" />
              編集
            </Button>
          )}
          {proposal.status === "pending" && (
            <Button onClick={onApprove} disabled={approvePending}>
              <Check className="size-4" />
              {approvePending ? "承認中..." : "承認"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">問題文</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{proposal.text}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">選択肢</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {proposal.choices.map((choice, i) => {
              const isCorrect = proposal.correctIndexes.includes(i);
              return (
                <li
                  key={i}
                  className={`rounded-md border px-4 py-2 text-sm ${
                    isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : ""
                  }`}
                >
                  <span className="mr-2 font-mono text-muted-foreground">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {choice}
                  {isCorrect && (
                    <Check className="ml-2 inline size-4 text-green-600" />
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">解説</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{proposal.explanation}</p>
        </CardContent>
      </Card>

      {proposal.rejectReason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              却下理由
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{proposal.rejectReason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
