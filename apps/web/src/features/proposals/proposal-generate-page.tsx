import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Sparkles, CheckSquare, Square, Eye } from "lucide-react";
import { ProposalContentCards } from "../admin/proposals/proposal-content-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InferRequestType, InferResponseType } from "hono/client";
import { client } from "@/client";
import { difficultyLabels } from "../admin/proposals/constants";

type GenerateCandidatesEndpoint =
  (typeof client.api)["user-proposals"]["generate-candidates"]["$post"];
type GenerateCandidatesResponse = InferResponseType<GenerateCandidatesEndpoint>;
type GenerateCandidatesBody =
  InferRequestType<GenerateCandidatesEndpoint>["json"];
type Candidate = GenerateCandidatesResponse["candidates"][number];

const urlSchema = z.object({
  sourceType: z.literal("url"),
  url: z.string().trim().url("有効な URL を入力してください"),
  categoryId: z.string().uuid("カテゴリを選択してください"),
});

const freeInputSchema = z.object({
  sourceType: z.literal("freeInput"),
  input: z
    .string()
    .min(1, "キーワードまたは説明文を入力してください")
    .max(2000, "2000文字以内で入力してください"),
  categoryId: z.string().uuid("カテゴリを選択してください"),
});

const generateSchema = z.discriminatedUnion("sourceType", [
  urlSchema,
  freeInputSchema,
]);

type GenerateForm = z.infer<typeof generateSchema>;

export function UserProposalGeneratePage() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    new Set(),
  );
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  const form = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      sourceType: "url",
      url: "",
      categoryId: "",
    } as GenerateForm,
  });

  const sourceType = form.watch("sourceType");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await client.api.categories.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateForm) => {
      let json: GenerateCandidatesBody;

      if (data.sourceType === "url") {
        json = { type: "url", url: data.url };
      } else {
        json = { type: "freeInput", input: data.input };
      }

      const res = await client.api["user-proposals"][
        "generate-candidates"
      ].$post({ json });
      if (!res.ok) {
        if ((res as Response).status === 503) {
          throw new Error(
            "現在AI生成が利用できません。しばらく時間をおいてお試しください",
          );
        }
        throw new Error("生成に失敗しました");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setCandidates(data.candidates);
      setSelectedIndexes(new Set(data.candidates.map((_, i) => i)));
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async () => {
      const selectedQuestions = candidates.filter((_, i) =>
        selectedIndexes.has(i),
      );
      const res = await client.api["user-proposals"]["bulk-create"].$post({
        json: {
          categoryId: form.getValues("categoryId"),
          questions: selectedQuestions,
        },
      });
      if (!res.ok) throw new Error("登録に失敗しました");
      return res.json();
    },
    onSuccess: () => {
      setCandidates([]);
      navigate("/proposals");
    },
  });

  const toggleSelect = useCallback((index: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIndexes((prev) =>
      prev.size === candidates.length
        ? new Set()
        : new Set(candidates.map((_, i) => i)),
    );
  }, [candidates]);

  const detailCandidate = detailIndex !== null ? candidates[detailIndex] : null;

  return (
    <div className="space-y-6 px-2">
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

      <h2 className="text-2xl font-bold tracking-tight">AI で問題を生成</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">生成設定</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                generateMutation.mutate(data),
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="sourceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ソースの種類</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("url" as never, "" as never);
                          form.setValue("input" as never, "" as never);
                        }}
                        className="flex gap-4"
                      >
                        {(
                          [
                            ["url", "URL"],
                            ["freeInput", "キーワード・説明文"],
                          ] as const
                        ).map(([value, label]) => (
                          <label
                            key={value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <RadioGroupItem value={value} />
                            {label}
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {sourceType === "url" && (
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>参照 URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/article"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {sourceType === "freeInput" && (
                <FormField
                  control={form.control}
                  name="input"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>キーワード・説明文</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="例: GHS、または説明文を入力"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>カテゴリ</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-60">
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

              <Button type="submit" disabled={generateMutation.isPending}>
                <Sparkles className="size-4" />
                {generateMutation.isPending
                  ? "生成中（時間がかかります）..."
                  : "生成する"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {generateMutation.isError && (
        <p className="text-sm text-destructive">
          エラー: {generateMutation.error.message}
        </p>
      )}

      {bulkCreateMutation.isError && (
        <p className="text-sm text-destructive">
          登録エラー: {bulkCreateMutation.error.message}
        </p>
      )}

      {candidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              生成候補（{candidates.length} 件中 {selectedIndexes.size} 件選択）
            </CardTitle>
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedIndexes.size === candidates.length ? (
                  <Square className="size-4" />
                ) : (
                  <CheckSquare className="size-4" />
                )}
                {selectedIndexes.size === candidates.length
                  ? "全解除"
                  : "全選択"}
              </Button>
              <Button
                size="sm"
                disabled={
                  selectedIndexes.size === 0 || bulkCreateMutation.isPending
                }
                onClick={() => bulkCreateMutation.mutate()}
              >
                {bulkCreateMutation.isPending
                  ? "登録中..."
                  : `選択した ${selectedIndexes.size} 件を登録`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-primary/10">
                  <TableRow className="border-b-2 border-primary/30">
                    <TableHead className="w-10" />
                    <TableHead className="w-[55%] font-bold text-primary">
                      問題文
                    </TableHead>
                    <TableHead className="font-bold text-primary">
                      難易度
                    </TableHead>
                    <TableHead className="font-bold text-primary">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIndexes.has(index)}
                          onCheckedChange={() => toggleSelect(index)}
                        />
                      </TableCell>
                      <TableCell className="max-w-0 truncate">
                        {candidate.questionText}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {difficultyLabels[candidate.difficulty] ??
                            candidate.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailIndex(index)}
                        >
                          <Eye className="size-4" />
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={detailIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDetailIndex(null);
        }}
      >
        <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b pb-4">
            <DialogTitle>問題詳細</DialogTitle>
          </DialogHeader>
          {detailCandidate && (
            <div className="space-y-4 overflow-y-auto pr-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {difficultyLabels[detailCandidate.difficulty] ??
                    detailCandidate.difficulty}
                </Badge>
              </div>
              <ProposalContentCards
                text={detailCandidate.questionText}
                choices={detailCandidate.choices}
                correctIndexes={detailCandidate.correctIndexes}
                explanation={detailCandidate.explanation}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
