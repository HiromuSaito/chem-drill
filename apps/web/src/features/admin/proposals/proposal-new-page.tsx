import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { client } from "@/client";

const MAX_QUESTION_TEXT = 500;
const MAX_EXPLANATION = 1000;
const MIN_CHOICES = 4;
const MAX_CHOICES = 8;

const proposalSchema = z
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

type ProposalForm = z.infer<typeof proposalSchema>;

export function ProposalNewPage() {
  const navigate = useNavigate();

  const form = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      questionText: "",
      difficulty: "medium",
      choices: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }],
      correctIndexes: [],
      explanation: "",
      categoryId: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "choices",
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await client.api.category.list.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProposalForm) => {
      const res = await client.api["question-proposal"].create.$post({
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

  const toggleCorrect = (index: number) => {
    const current = form.getValues("correctIndexes");
    const next = current.includes(index)
      ? current.filter((i) => i !== index)
      : [...current, index];
    form.setValue("correctIndexes", next, { shouldValidate: true });
  };

  const handleRemoveChoice = (index: number) => {
    const current = form.getValues("correctIndexes");
    form.setValue(
      "correctIndexes",
      current
        .filter((ci) => ci !== index)
        .map((ci) => (ci > index ? ci - 1 : ci)),
      { shouldValidate: true },
    );
    remove(index);
  };

  const questionText = form.watch("questionText");
  const explanation = form.watch("explanation");
  const correctIndexes = form.watch("correctIndexes");

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

      <h2 className="text-2xl font-bold tracking-tight">問題提案を作成</h2>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
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
                        {questionText.length} / {MAX_QUESTION_TEXT}
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                    checked={correctIndexes.includes(i)}
                    onCheckedChange={() => toggleCorrect(i)}
                  />
                  <span className="w-6 font-mono text-sm text-muted-foreground">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <FormField
                    control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                        {explanation.length} / {MAX_EXPLANATION}
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "作成中..." : "提案を作成"}
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive">
              エラー: {createMutation.error.message}
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}
