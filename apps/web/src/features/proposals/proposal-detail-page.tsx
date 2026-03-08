import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/client";
import {
  ProposalEditForm,
  type EditFormData,
} from "../admin/proposals/proposal-edit-form";
import {
  statusLabels,
  statusVariants,
  difficultyLabels,
} from "../admin/proposals/constants";

export function UserProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    return <p className="text-muted-foreground">読み込み中...</p>;
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/proposals")}
        >
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
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              編集
            </Button>
          )}
          {proposal.status === "pending" && (
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              <Send className="size-4" />
              {submitMutation.isPending ? "申請中..." : "申請する"}
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
