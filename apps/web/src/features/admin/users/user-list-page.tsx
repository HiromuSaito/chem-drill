import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserIcon } from "@/components/user-icon";
import { client } from "@/client";

const PAGE_SIZE = 20;

const roleLabels: Record<string, string> = {
  admin: "管理者",
  user: "ユーザー",
};

export function UserListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", submittedSearch, offset],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (submittedSearch) {
        query.search = submittedSearch;
      }
      const res = await client.api.admin.users.$get({ query });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handleSearch = () => {
    setSubmittedSearch(search);
    setOffset(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">ユーザー</h2>
      </div>

      <div className="flex items-center gap-4">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <Input
            placeholder="名前・メールで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="size-4" />
          </Button>
        </form>
        {data && (
          <span className="text-sm text-muted-foreground">{data.total} 件</span>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : (
        <>
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-b-2 border-primary/30">
                  <TableHead className="w-10 font-bold text-primary" />
                  <TableHead className="font-bold text-primary">名前</TableHead>
                  <TableHead className="font-bold text-primary">
                    ユーザー名
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    メール
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    ロール
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    登録日
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    最終ログイン
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      ユーザーが見つかりません
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/users/${item.id}`)}
                    >
                      <TableCell>
                        <UserIcon
                          name={item.name}
                          image={item.image}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.username ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">{item.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {roleLabels[item.role] ?? item.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.lastLoginAt
                          ? new Date(item.lastLoginAt).toLocaleDateString(
                              "ja-JP",
                            )
                          : "-"}
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
