import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Pencil, Send, ArchiveX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statusLabels, statusVariants, difficultyLabels } from "./constants";
import { ProposalContentCards } from "./proposal-content-cards";

type Proposal = {
  status: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  rejectReason: string | null;
  userName?: string | null;
};

type ProposalDetailViewProps = {
  proposal: Proposal;
  backTo: string;
  canEdit: boolean;
  onEdit: () => void;
  onSubmit: () => void;
  submitPending: boolean;
  onApprove?: () => void;
  onRejectClick?: () => void;
  onWithdraw?: () => void;
  approvePending?: boolean;
  withdrawPending?: boolean;
};

export function ProposalDetailView({
  proposal,
  backTo,
  canEdit,
  onEdit,
  onSubmit,
  submitPending,
  onApprove,
  onRejectClick,
  onWithdraw,
  approvePending,
  withdrawPending,
}: ProposalDetailViewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 px-2">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
          <ArrowLeft className="size-4" />
          一覧へ戻る
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">出題案詳細</h2>
          <Badge variant={statusVariants[proposal.status] ?? "outline"}>
            {statusLabels[proposal.status] ?? proposal.status}
          </Badge>
          <Badge variant="secondary">
            {difficultyLabels[proposal.difficulty] ?? proposal.difficulty}
          </Badge>
          {proposal.userName && (
            <Badge variant="outline">提案者: {proposal.userName}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {proposal.status === "reviewed" && onRejectClick && (
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
            <Button onClick={onSubmit} disabled={submitPending}>
              <Send className="size-4" />
              {submitPending ? "申請中..." : "申請する"}
            </Button>
          )}
          {proposal.status === "reviewed" && onApprove && (
            <Button onClick={onApprove} disabled={approvePending}>
              <Check className="size-4" />
              {approvePending ? "承認中..." : "承認"}
            </Button>
          )}
          {proposal.status === "approved" && onWithdraw && (
            <Button
              variant="destructive"
              onClick={onWithdraw}
              disabled={withdrawPending}
            >
              <ArchiveX className="size-4" />
              {withdrawPending ? "取り下げ中..." : "取り下げ"}
            </Button>
          )}
        </div>
      </div>

      <ProposalContentCards
        text={proposal.text}
        choices={proposal.choices}
        correctIndexes={proposal.correctIndexes}
        explanation={proposal.explanation}
        rejectReason={proposal.rejectReason}
      />
    </div>
  );
}
