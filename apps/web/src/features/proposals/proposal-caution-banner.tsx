import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProposalCautionBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 px-5 py-4",
        className,
      )}
    >
      <AlertTriangle
        className="size-7 shrink-0 text-amber-600"
        strokeWidth={1.5}
      />
      <div>
        <p className="text-sm font-semibold text-amber-800">ご注意ください</p>
        <p className="mt-0.5 text-xs text-slate-600">
          個人情報や特定の法人に関わる出題案は作成しないでください。万が一作成・申請された場合でも、問題として公開されることはありません。
        </p>
      </div>
    </div>
  );
}
