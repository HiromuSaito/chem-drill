import { Link } from "react-router-dom";

export function LegalFooter({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-xs text-muted-foreground ${className ?? ""}`}
    >
      <Link
        to="/privacy"
        className="underline underline-offset-4 hover:text-foreground"
      >
        プライバシーポリシー
      </Link>
      <span>|</span>
      <Link
        to="/terms"
        className="underline underline-offset-4 hover:text-foreground"
      >
        利用規約
      </Link>
    </div>
  );
}
