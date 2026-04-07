import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { HandHeart, Plus, Sparkles } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  statusLabels,
  statusVariants,
  difficultyLabels,
} from "../admin/proposals/constants";

const PAGE_SIZE = 20;

export function UserProposalListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["user-proposals", statusFilter, offset],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (statusFilter !== "all") {
        query.status = statusFilter;
      }
      const res = await client.api["user-proposals"].$get({
        query,
      });
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6 px-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">出題案</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/proposals/generate")}
          >
            <Sparkles className="size-4" />
            AI生成
          </Button>
          <Button onClick={() => navigate("/proposals/new")}>
            <Plus className="size-4" />
            新規作成
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-green-50 px-5 py-4">
        <HandHeart
          className="size-7 shrink-0 text-blue-600"
          strokeWidth={1.5}
        />
        <div>
          <p className="text-sm font-semibold text-blue-800">
            あなたの知識を共有しませんか？
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            出題案を作成して、化学物質管理を学ぶ仲間の力になりましょう
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="pending">下書き</SelectItem>
            <SelectItem value="reviewed">レビュー待ち</SelectItem>
            <SelectItem value="approved">承認済</SelectItem>
            <SelectItem value="rejected">却下</SelectItem>
          </SelectContent>
        </Select>
        {data && (
          <span className="text-sm text-muted-foreground">{data.total} 件</span>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
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
                    ステータス
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
                      提案がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <TableRow
                      key={item.questionProposalId}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/proposals/${item.questionProposalId}`)
                      }
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
                        <Badge
                          variant={statusVariants[item.status] ?? "outline"}
                        >
                          {statusLabels[item.status] ?? item.status}
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
