export const statusLabels: Record<string, string> = {
  pending: "保留中",
  approved: "承認済",
  rejected: "却下",
};

export const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
};

export const difficultyLabels: Record<string, string> = {
  easy: "簡単",
  medium: "普通",
  hard: "難しい",
};
