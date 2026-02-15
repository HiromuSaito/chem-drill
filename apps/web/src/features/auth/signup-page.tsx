import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FlaskConical,
  Mail,
  User,
  AtSign,
  ArrowRight,
  Loader2,
} from "lucide-react";
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

export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const usernamePattern = /^[a-z0-9_-]{3,20}$/;
  const isUsernameValid = usernamePattern.test(username);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

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

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setIsLoading(false);

    if (error) {
      setError("認証コードの送信に失敗しました。");
      return;
    }
    navigate("/verify-otp", {
      state: { email, name, username, type: "sign-up" },
    });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center gap-2">
            <FlaskConical className="size-6 text-primary" />
            <span className="text-xl font-semibold tracking-tight">
              Chem Drill
            </span>
          </div>
          <CardTitle className="text-lg">新規登録</CardTitle>
          <CardDescription>
            メールアドレスでアカウントを作成します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="名前"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
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
              <Input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !name.trim() || !isUsernameValid || !email}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  認証コードを送信
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            すでにアカウントをお持ちの方は
            <Link
              to="/login"
              className="text-primary underline underline-offset-4 ml-1"
            >
              ログイン
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
