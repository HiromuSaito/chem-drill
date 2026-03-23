import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <>
      <Loader2
        className={cn("size-6 animate-spin text-muted-foreground", className)}
      />
      <span className="sr-only">読み込み中</span>
    </>
  );
}
