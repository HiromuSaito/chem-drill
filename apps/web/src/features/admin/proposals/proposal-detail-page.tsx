import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, X, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { client } from "@/client";

const MAX_QUESTION_TEXT = 500;
const MAX_EXPLANATION = 1000;
const MAX_REJECT_REASON = 500;
const MIN_CHOICES = 4;
const MAX_CHOICES = 8;

const editSchema = z
  .object({
    questionText: z
      .string()
      .trim()
      .min(1, "問題文を入力してください")
      .max(MAX_QUESTION_TEXT, `${MAX_QUESTION_TEXT}文字以内で入力してください`),
    difficulty: z.enum(["easy", "medium", "hard"], {
      message: "難易度を選択してください",
    }),
    choices: z
      .array(
        z.object({
          value: z.string().trim().min(1, "選択肢を入力してください"),
        }),
      )
      .min(MIN_CHOICES, `選択肢は${MIN_CHOICES}つ以上必要です`)
      .max(MAX_CHOICES, `選択肢は${MAX_CHOICES}つまでです`),
    correctIndexes: z
      .array(z.number().int())
      .min(1, "正解を1つ以上選択してください"),
    explanation: z
      .string()
      .trim()
      .min(1, "解説を入力してください")
      .max(MAX_EXPLANATION, `${MAX_EXPLANATION}文字以内で入力してください`),
    categoryId: z.string().uuid("カテゴリを選択してください"),
  })
  .refine(
    (data) =>
      data.correctIndexes.every((i) => i >= 0 && i < data.choices.length),
    {
      message: "正解インデックスが選択肢の範囲外です",
      path: ["correctIndexes"],
    },
  );

type EditForm = z.infer<typeof editSchema>;

const rejectSchema = z.object({
  rejectReason: z
    .string()
    .trim()
    .min(1, "却下理由を入力してください")
    .max(MAX_REJECT_REASON, `${MAX_REJECT_REASON}文字以内で入力してください`),
});

type RejectForm = z.infer<typeof rejectSchema>;

const statusLabels: Record<string, string> = {
  pending: "保留中",
  approved: "承認済",
  rejected: "却下",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
};

const difficultyLabels: Record<string, string> = {
  easy: "簡単",
  medium: "普通",
  hard: "難しい",
};

export function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejectReason: "" },
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      questionText: "",
      difficulty: "medium",
      choices: [],
      correctIndexes: [],
      explanation: "",
      categoryId: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: editForm.control,
    name: "choices",
  });

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

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await client.api.category.list.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: editing,
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
    mutationFn: async (data: EditForm) => {
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
      rejectForm.reset();
    },
  });

  const startEditing = () => {
    if (!proposal || "error" in proposal) return;
    editForm.reset({
      questionText: proposal.text,
      difficulty: proposal.difficulty as "easy" | "medium" | "hard",
      choices: proposal.choices.map((c) => ({ value: c })),
      correctIndexes: [...proposal.correctIndexes],
      explanation: proposal.explanation,
      categoryId: proposal.categoryId,
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    editForm.reset();
  };

  const toggleCorrect = (index: number) => {
    const current = editForm.getValues("correctIndexes");
    const next = current.includes(index)
      ? current.filter((i) => i !== index)
      : [...current, index];
    editForm.setValue("correctIndexes", next, { shouldValidate: true });
  };

  const handleRemoveChoice = (index: number) => {
    const current = editForm.getValues("correctIndexes");
    editForm.setValue(
      "correctIndexes",
      current
        .filter((ci) => ci !== index)
        .map((ci) => (ci > index ? ci - 1 : ci)),
      { shouldValidate: true },
    );
    remove(index);
  };

  const handleRejectDialogChange = (open: boolean) => {
    setRejectDialogOpen(open);
    if (!open) rejectForm.reset();
  };

  const editQuestionText = editForm.watch("questionText");
  const editExplanation = editForm.watch("explanation");
  const editCorrectIndexes = editForm.watch("correctIndexes");
  const rejectReasonValue = rejectForm.watch("rejectReason");

  const canEdit =
    proposal && !("error" in proposal) && proposal.status !== "approved";

  if (isLoading) {
    return <p className="text-muted-foreground">読み込み中...</p>;
  }

  if (!proposal || "error" in proposal) {
    return <p className="text-destructive">提案が見つかりません</p>;
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={cancelEditing}>
            <ArrowLeft className="size-4" />
            編集をキャンセル
          </Button>
        </div>

        <h2 className="text-2xl font-bold tracking-tight">提案を編集</h2>

        <Form {...editForm}>
          <form
            onSubmit={editForm.handleSubmit((data) =>
              updateMutation.mutate(data),
            )}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="questionText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>問題文</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="問題文を入力"
                          rows={4}
                          maxLength={MAX_QUESTION_TEXT}
                          {...field}
                        />
                      </FormControl>
                      <div className="flex items-center justify-between">
                        <FormMessage />
                        <p className="ml-auto text-xs text-muted-foreground">
                          {editQuestionText.length} / {MAX_QUESTION_TEXT}
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>難易度</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">簡単</SelectItem>
                            <SelectItem value="medium">普通</SelectItem>
                            <SelectItem value="hard">難しい</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>カテゴリ</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">選択肢</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={editCorrectIndexes.includes(i)}
                      onCheckedChange={() => toggleCorrect(i)}
                    />
                    <span className="w-6 font-mono text-sm text-muted-foreground">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <FormField
                      control={editForm.control}
                      name={`choices.${i}.value`}
                      render={({ field: choiceField }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder={`選択肢 ${String.fromCharCode(65 + i)}`}
                              {...choiceField}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {fields.length > MIN_CHOICES && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveChoice(i)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {fields.length < MAX_CHOICES && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ value: "" })}
                  >
                    <Plus className="size-4" />
                    選択肢を追加
                  </Button>
                )}
                <FormField
                  control={editForm.control}
                  name="correctIndexes"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  チェックボックスで正解の選択肢を選択してください（複数選択可）
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">解説</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={editForm.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="解説を入力"
                          rows={4}
                          maxLength={MAX_EXPLANATION}
                          {...field}
                        />
                      </FormControl>
                      <div className="flex items-center justify-between">
                        <FormMessage />
                        <p className="ml-auto text-xs text-muted-foreground">
                          {editExplanation.length} / {MAX_EXPLANATION}
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={cancelEditing}>
                キャンセル
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </div>

            {updateMutation.isError && (
              <p className="text-sm text-destructive">
                エラー: {updateMutation.error.message}
              </p>
            )}
          </form>
        </Form>
      </div>
    );
  }

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
            <Button
              variant="destructive"
              onClick={() => setRejectDialogOpen(true)}
            >
              <X className="size-4" />
              却下
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={startEditing}>
              <Pencil className="size-4" />
              編集
            </Button>
          )}
          {proposal.status === "pending" && (
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              <Check className="size-4" />
              {approveMutation.isPending ? "承認中..." : "承認"}
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

      <Dialog open={rejectDialogOpen} onOpenChange={handleRejectDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>却下理由を入力</DialogTitle>
          </DialogHeader>
          <Form {...rejectForm}>
            <form
              onSubmit={rejectForm.handleSubmit((data) =>
                rejectMutation.mutate(data.rejectReason),
              )}
              className="space-y-4"
            >
              <FormField
                control={rejectForm.control}
                name="rejectReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>理由</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="却下の理由を入力してください"
                        rows={4}
                        maxLength={MAX_REJECT_REASON}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormMessage />
                      <p className="ml-auto text-xs text-muted-foreground">
                        {rejectReasonValue.length} / {MAX_REJECT_REASON}
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRejectDialogChange(false)}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? "送信中..." : "却下する"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
