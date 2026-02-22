import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { difficultyLabels } from "../proposals/constants";

const PAGE_SIZE = 20;

export function QuestionListPage() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await client.api.categories.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["questions", categoryFilter, offset],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (categoryFilter !== "all") {
        query.categoryId = categoryFilter;
      }
      const res = await client.api.questions.$get({ query });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">問題</h2>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのカテゴリ</SelectItem>
            {categoriesData?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data && (
          <span className="text-sm text-muted-foreground">{data.total} 件</span>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : (
        <>
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-b-2 border-primary/30">
                  <TableHead className="w-[50%] font-bold text-primary">
                    問題文
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    難易度
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    カテゴリ
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    作成日
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      問題がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/questions/${item.id}`)}
                    >
                      <TableCell className="max-w-0 truncate font-medium">
                        {item.text}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {difficultyLabels[item.difficulty] ?? item.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.category.categoryName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              >
                前へ
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
              >
                次へ
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
