import { useNavigate } from "react-router-dom";
import { FlaskConical, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionContainer } from "@/features/question/session-container";
import { LegalFooter } from "@/components/legal-footer";
import { TRIAL_QUESTIONS } from "./trial-questions";

export function TrialPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex items-center border-b bg-background px-6 py-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <FlaskConical className="size-5 text-primary" />
          Chem Drill
        </h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <SessionContainer
          questions={TRIAL_QUESTIONS}
          showRetry={false}
          saveResult={false}
          resultActions={
            <>
              <hr className="border-border" />
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  アカウントを作成すると、もっと多くの問題に挑戦できます
                </p>
                <Button className="w-full" onClick={() => navigate("/signup")}>
                  <UserPlus />
                  新規登録して他の問題も試す
                </Button>
              </div>
            </>
          }
        />
      </main>

      <footer className="border-t bg-background px-6 py-4">
        <LegalFooter />
      </footer>
    </div>
  );
}
