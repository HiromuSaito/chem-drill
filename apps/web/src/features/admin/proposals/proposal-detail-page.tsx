import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/client";
import { ProposalDetailView } from "./proposal-detail-view";
import { ProposalEditForm, type EditFormData } from "./proposal-edit-form";
import { RejectDialog } from "./reject-dialog";

export function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["question-proposal", id],
    queryFn: async () => {
      const res = await client.api["question-proposal"][":id"].$get({
        param: { id: id! },
      });
      if (!res.ok) throw new Error("Failed to fetch proposal");
      return res.json();
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api["question-proposal"].approve.$post({
        json: { questionProposalId: id! },
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-proposal"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const res = await client.api["question-proposal"].update.$post({
        json: {
          questionProposalId: id!,
          questionText: data.questionText,
          difficulty: data.difficulty,
          choices: data.choices.map((c) => c.value),
          correctIndexes: data.correctIndexes,
          explanation: data.explanation,
          categoryId: data.categoryId,
        },
      });
      if (!res.ok) throw new Error("Failed to update proposal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-proposal"] });
      setEditing(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await client.api["question-proposal"].reject.$post({
        json: { questionProposalId: id!, rejectReason: reason },
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-proposal"] });
      setRejectDialogOpen(false);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">読み込み中...</p>;
  }

  if (!proposal || "error" in proposal) {
    return <p className="text-destructive">提案が見つかりません</p>;
  }

  const canEdit = proposal.status !== "approved";

  if (editing) {
    return (
      <ProposalEditForm
        defaultValues={{
          questionText: proposal.text,
          difficulty: proposal.difficulty as "easy" | "medium" | "hard",
          choices: proposal.choices.map((c) => ({ value: c })),
          correctIndexes: [...proposal.correctIndexes],
          explanation: proposal.explanation,
          categoryId: proposal.categoryId,
        }}
        onSubmit={(data) => updateMutation.mutate(data)}
        onCancel={() => setEditing(false)}
        isPending={updateMutation.isPending}
        error={updateMutation.error?.message}
      />
    );
  }

  return (
    <>
      <ProposalDetailView
        proposal={proposal}
        canEdit={canEdit}
        onEdit={() => setEditing(true)}
        onApprove={() => approveMutation.mutate()}
        onRejectClick={() => setRejectDialogOpen(true)}
        approvePending={approveMutation.isPending}
      />
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onReject={(reason) => rejectMutation.mutate(reason)}
        isPending={rejectMutation.isPending}
      />
    </>
  );
}
