import { useState, useCallback, useEffect } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Sparkles, CheckSquare, Square, Eye } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InferResponseType } from "hono/client";
import { client } from "@/client";
import { difficultyLabels } from "./constants";

type GenerateCandidatesResponse = InferResponseType<
  (typeof client.api)["question-proposals"]["generate-candidates"]["$post"]
>;
type Candidate = GenerateCandidatesResponse["candidates"][number];

const generateSchema = z.object({
  url: z.string().trim().url("有効な URL を入力してください"),
  categoryId: z.string().uuid("カテゴリを選択してください"),
});

type GenerateForm = z.infer<typeof generateSchema>;

export function ProposalGeneratePage() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    new Set(),
  );
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [isNavigatingAfterSave, setIsNavigatingAfterSave] = useState(false);

  const form = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
    defaultValues: { url: "", categoryId: "" },
  });

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
      const res = await client.api["question-proposals"][
        "generate-candidates"
      ].$post({
        json: { url: data.url },
      });
      if (!res.ok) throw new Error("Failed to generate candidates");
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
      const res = await client.api["question-proposals"]["bulk-create"].$post({
        json: {
          categoryId: form.getValues("categoryId"),
          questions: selectedQuestions,
        },
      });
      if (!res.ok) throw new Error("Failed to create proposals");
      return res.json();
    },
    onSuccess: () => {
      setIsNavigatingAfterSave(true);
      setCandidates([]);
      navigate("/admin/proposals");
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

  // ページ離脱防止: beforeunload
  useEffect(() => {
    if (candidates.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [candidates.length]);

  // ページ離脱防止: React Router
  const blocker = useBlocker(candidates.length > 0 && !isNavigatingAfterSave);

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmed = window.confirm(
        "生成された候補が未登録です。ページを離れますか？",
      );
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  const detailCandidate = detailIndex !== null ? candidates[detailIndex] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>問題詳細</DialogTitle>
          </DialogHeader>
          {detailCandidate && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  問題文
                </p>
                <p className="mt-1">{detailCandidate.questionText}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  難易度
                </p>
                <Badge variant="secondary" className="mt-1">
                  {difficultyLabels[detailCandidate.difficulty] ??
                    detailCandidate.difficulty}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  選択肢
                </p>
                <ul className="mt-1 space-y-1">
                  {detailCandidate.choices.map((choice, i) => (
                    <li
                      key={i}
                      className={
                        detailCandidate.correctIndexes.includes(i)
                          ? "font-medium text-green-600"
                          : ""
                      }
                    >
                      {detailCandidate.correctIndexes.includes(i) ? "✓ " : ""}
                      {choice}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  解説
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {detailCandidate.explanation}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
