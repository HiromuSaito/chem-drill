import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { client } from "@/client";

const MAX_NAME_LENGTH = 100;

const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "カテゴリ名を入力してください")
    .max(MAX_NAME_LENGTH, `${MAX_NAME_LENGTH}文字以内で入力してください`),
});

type CreateCategoryForm = z.infer<typeof createCategorySchema>;

export function CategoryListPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: "" },
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await client.api.category.list.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await client.api.category.create.$post({
        json: { name },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          body && "error" in body ? body.error : "カテゴリの作成に失敗しました";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      form.setError("name", { message: error.message });
    },
  });

  const onSubmit = (data: CreateCategoryForm) => {
    createMutation.mutate(data.name);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) form.reset();
  };

  const nameValue = form.watch("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">カテゴリ</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          新規作成
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow className="border-b-2 border-primary/30">
                <TableHead className="font-bold text-primary">名前</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={1}
                    className="text-center text-muted-foreground"
                  >
                    カテゴリがありません
                  </TableCell>
                </TableRow>
              ) : (
                categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カテゴリを作成</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名前</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="カテゴリ名を入力"
                        maxLength={MAX_NAME_LENGTH}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormMessage />
                      <p className="ml-auto text-xs text-muted-foreground">
                        {nameValue.length} / {MAX_NAME_LENGTH}
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "作成中..." : "作成"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
