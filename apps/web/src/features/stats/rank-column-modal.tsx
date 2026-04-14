import { BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { RankColumn } from "./rank-column-data";

type RankColumnModalProps = {
  column: RankColumn;
};

export function RankColumnModal({ column }: RankColumnModalProps) {
  const paragraphs = column.body.split("\n\n");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex size-6 items-center justify-center rounded-full border border-primary text-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all hover:scale-110 hover:shadow-[0_0_14px_rgba(var(--primary),0.8)]"
          aria-label="この物質のコラムを読む"
        >
          <BookOpen className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-relaxed">
            {column.title}
          </DialogTitle>
        </DialogHeader>
        <div className="from-primary h-0.5 w-full bg-gradient-to-r to-transparent" />
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
