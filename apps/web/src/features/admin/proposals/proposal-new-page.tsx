import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ProposalEditForm, type EditFormData } from "./proposal-edit-form";
import { client } from "@/client";

export function ProposalNewPage() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const res = await client.api["question-proposals"].$post({
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
      navigate(`/admin/proposals/${data.id}`);
    },
  });

  return (
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
      onCancel={() => navigate("/admin/proposals")}
      isPending={createMutation.isPending}
      error={createMutation.error?.message}
      title="出題案を作成"
      cancelLabel="一覧へ戻る"
      submitLabel="出題案を作成"
      showFooterCancel={false}
    />
  );
}
