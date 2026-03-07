export const statusLabels: Record<string, string> = {
  pending: "下書き",
  reviewed: "レビュー待ち",
  approved: "承認済",
  rejected: "却下",
  withdrawn: "取り下げ済み",
};

export const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  reviewed: "secondary",
  approved: "default",
  rejected: "destructive",
  withdrawn: "outline",
};

export const difficultyLabels: Record<string, string> = {
  easy: "簡単",
  medium: "普通",
  hard: "難しい",
};
