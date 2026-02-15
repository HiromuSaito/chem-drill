import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/client";
import { difficultyLabels } from "./constants";

const generateSchema = z.object({
  url: z.string().trim().url("有効な URL を入力してください"),
  categoryId: z.string().uuid("カテゴリを選択してください"),
});

type GenerateForm = z.infer<typeof generateSchema>;

export function ProposalGeneratePage() {
  const navigate = useNavigate();

  const form = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
    defaultValues: { url: "", categoryId: "" },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await client.api.category.list.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateForm) => {
      const res = await client.api["question-proposal"][
        "generate-from-url"
      ].$post({
        json: data,
      });
      if (!res.ok) throw new Error("Failed to generate proposals");
      return res.json();
    },
  });

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

      {generateMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              生成結果（{generateMutation.data.length} 件）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-primary/10">
                  <TableRow className="border-b-2 border-primary/30">
                    <TableHead className="w-[60%] font-bold text-primary">
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
                  {generateMutation.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-0 truncate">
                        {item.text}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {difficultyLabels[item.difficulty] ?? item.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/admin/proposals/${item.id}`)
                          }
                        >
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
    </div>
  );
}
