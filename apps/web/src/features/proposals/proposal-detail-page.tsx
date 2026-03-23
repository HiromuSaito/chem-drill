import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { client } from "@/client";
import {
  ProposalEditForm,
  type EditFormData,
} from "../admin/proposals/proposal-edit-form";
import { ProposalDetailView } from "../admin/proposals/proposal-detail-view";

export function UserProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["user-proposal", id],
    queryFn: async () => {
      const res = await client.api["user-proposals"][":id"].$get({
        param: { id: id! },
      });
      if (!res.ok) throw new Error("Failed to fetch proposal");
      return res.json();
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const res = await client.api["user-proposals"][":id"].$put({
        param: { id: id! },
        json: {
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
      queryClient.invalidateQueries({ queryKey: ["user-proposal", id] });
      setEditing(false);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api["user-proposals"][":id"].submit.$post({
        param: { id: id! },
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-proposal", id] });
    },
  });

  if (isLoading) {
    return <Loader2 className="size-6 animate-spin text-muted-foreground" />;
  }

  if (!proposal || "error" in proposal) {
    return <p className="text-destructive">出題案が見つかりません</p>;
  }

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

  const canEdit = ["pending", "rejected"].includes(proposal.status);

  return (
    <ProposalDetailView
      proposal={proposal}
      backTo="/proposals"
      canEdit={canEdit}
      onEdit={() => setEditing(true)}
      onSubmit={() => submitMutation.mutate()}
      submitPending={submitMutation.isPending}
    />
  );
}
