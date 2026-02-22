import { useState } from "react";
import { User, AtSign, Mail, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/auth-client";
import { client } from "@/client";

const usernamePattern = /^[a-z0-9_-]{3,20}$/;

function AccountForm({
  user,
}: {
  user: { name: string; username?: string | null; email: string };
}) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isUsernameValid = usernamePattern.test(username);
  const hasChanges = name !== user.name || username !== (user.username ?? "");

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (username !== (user.username ?? "")) {
      try {
        const res = await client.api.user["check-username"].$get({
          query: { username },
        });
        const { available } = await res.json();
        if (!available) {
          setIsLoading(false);
          setError("このユーザー名は既に使われています。");
          return;
        }
      } catch {
        setIsLoading(false);
        setError("ユーザー名の確認に失敗しました。");
        return;
      }
    }

    const { error } = await authClient.updateUser({ name, username });

    if (error) {
      setIsLoading(false);
      setError("更新に失敗しました。");
      return;
    }

    await authClient.getSession();
    setIsLoading(false);
    setSuccess("アカウント情報を更新しました。");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <User className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="名前"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSuccess("");
          }}
          required
          className="pl-10"
        />
      </div>
      <div>
        <div className="relative">
          <AtSign className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="ユーザー名（例: taro_123）"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase());
              setSuccess("");
            }}
            required
            className="pl-10"
          />
        </div>
        {username && !isUsernameValid && (
          <p className="text-destructive text-xs mt-1">
            3〜20文字の英小文字・数字・_・- で入力してください
          </p>
        )}
      </div>
      <div className="relative">
        <Mail className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input type="email" value={user.email} disabled className="pl-10" />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <Check className="size-4" />
          {success}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !name.trim() || !isUsernameValid || !hasChanges}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : "保存"}
      </Button>
    </form>
  );
}

export function AccountPage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">アカウント設定</CardTitle>
          <CardDescription>表示名とユーザー名を変更できます</CardDescription>
        </CardHeader>
        <CardContent>
          {session?.user && <AccountForm user={session.user} />}
        </CardContent>
      </Card>
    </div>
  );
}
