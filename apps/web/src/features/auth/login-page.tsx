import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FlaskConical, Mail, ArrowRight, Loader2 } from "lucide-react";
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

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await client.api.user["check-email"].$get({
        query: { email },
      });
      const { registered } = await res.json();
      if (!registered) {
        setIsLoading(false);
        setError("アカウントが見つかりません。");
        return;
      }
    } catch {
      setIsLoading(false);
      setError("メールアドレスの確認に失敗しました。");
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
    navigate("/verify-otp", { state: { email, type: "sign-in" } });
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
          <CardTitle className="text-lg">ログイン</CardTitle>
          <CardDescription>
            メールアドレスに認証コードを送信します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={isLoading || !email}
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
            アカウントをお持ちでない方は
            <Link
              to="/signup"
              className="text-primary underline underline-offset-4 ml-1"
            >
              新規登録
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
