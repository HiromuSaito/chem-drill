import { Progress } from "@/components/ui/progress";

type Props = {
  current: number;
  total: number;
};

export function SessionProgress({ current, total }: Props) {
  const percentage = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {current + 1} / {total}
      </span>
      <Progress value={percentage} className="h-2 flex-1" />
    </div>
  );
}
