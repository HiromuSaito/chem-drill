import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { FlaskConical, ShieldCheck, Loader2 } from "lucide-react";
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

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authClient.signIn.emailOtp({ email, otp });
      navigate("/", { replace: true });
    } catch {
      setError("認証コードが正しくないか、期限切れです。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
    } catch {
      setError("再送信に失敗しました。");
    }
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
          <CardTitle className="text-lg">認証コードを入力</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{email}</span>{" "}
            に送信された6桁のコードを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <ShieldCheck className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                className="pl-10 text-center text-xl tracking-[0.4em] font-mono"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "ログイン"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline transition-colors"
              >
                コードを再送信
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
