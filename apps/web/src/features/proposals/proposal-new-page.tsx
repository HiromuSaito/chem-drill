import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import {
  ProposalEditForm,
  type EditFormData,
} from "../admin/proposals/proposal-edit-form";
import { client } from "@/client";

export function UserProposalNewPage() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const res = await client.api["user-proposals"].$post({
        json: {
          questionText: data.questionText,
          difficulty: data.difficulty,
          choices: data.choices.map((c) => c.value),
          correctIndexes: data.correctIndexes,
          explanation: data.explanation,
          categoryId: data.categoryId,
        },
      });
      if (!res.ok) throw new Error("Failed to create proposal");
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/proposals/${data.id}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="mx-2 flex items-center gap-3 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 px-5 py-4">
        <AlertTriangle
          className="size-7 shrink-0 text-amber-600"
          strokeWidth={1.5}
        />
        <div>
          <p className="text-sm font-semibold text-amber-800">ご注意ください</p>
          <p className="mt-0.5 text-xs text-slate-600">
            個人情報や特定の法人に関わる出題案は作成しないでください。万が一作成・申請された場合でも、問題として公開されることはありません。
          </p>
        </div>
      </div>
      <ProposalEditForm
        defaultValues={{
          questionText: "",
          difficulty: "medium",
          choices: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }],
          correctIndexes: [],
          explanation: "",
          categoryId: "",
        }}
        onSubmit={(data) => createMutation.mutate(data)}
        onCancel={() => navigate("/proposals")}
        isPending={createMutation.isPending}
        error={createMutation.error?.message}
        title="出題案を作成"
        cancelLabel="一覧へ戻る"
        submitLabel="出題案を作成"
        showFooterCancel={false}
      />
    </div>
  );
}
