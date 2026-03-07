import { useState } from "react";
import { client } from "@/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerateIconDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIconSet: (imageUrl: string) => void;
}

const COLORS = [
  { name: "レッド", value: "red", class: "bg-red-500" },
  { name: "ブルー", value: "blue", class: "bg-blue-500" },
  { name: "グリーン", value: "green", class: "bg-green-500" },
  { name: "イエロー", value: "yellow", class: "bg-yellow-500" },
  { name: "パープル", value: "purple", class: "bg-purple-500" },
  { name: "ピンク", value: "pink", class: "bg-pink-500" },
  { name: "オレンジ", value: "orange", class: "bg-orange-500" },
  { name: "ティール", value: "teal", class: "bg-teal-500" },
] as const;

const STYLES = [
  { label: "かわいい", value: "cute" },
  { label: "クール", value: "cool" },
  { label: "シンプル", value: "simple" },
  { label: "サイエンス風", value: "science" },
] as const;

const initialState = {
  step: 1,
  color: "",
  element: "",
  style: "",
  candidates: [] as Array<{ url: string; key: string }>,
  selectedKey: null as string | null,
  isGenerating: false,
  isSelecting: false,
  error: "",
};

export function GenerateIconDialog({
  open,
  onOpenChange,
  onIconSet,
}: GenerateIconDialogProps) {
  const [state, setState] = useState(initialState);
  const {
    step,
    color,
    element,
    style,
    candidates,
    selectedKey,
    isSelecting,
    error,
  } = state;

  const resetState = () => setState(initialState);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      resetState();
    }
    onOpenChange(value);
  };

  const handleGenerate = async () => {
    setState((s) => ({ ...s, step: 4, isGenerating: true, error: "" }));
    try {
      const res = await client.api.user.icon.generate.$post({
        json: { color, element, style },
      });
      if (res.status === 429) {
        setState((s) => ({
          ...s,
          step: 3,
          isGenerating: false,
          error: "現在生成が混み合っています。しばらく待ってからお試しください",
        }));
        return;
      }
      if (!res.ok) {
        setState((s) => ({
          ...s,
          step: 3,
          isGenerating: false,
          error: "画像生成に失敗しました",
        }));
        return;
      }
      const data = await res.json();
      setState((s) => ({
        ...s,
        step: 5,
        isGenerating: false,
        candidates: (
          data as { candidates: Array<{ url: string; key: string }> }
        ).candidates,
      }));
    } catch {
      setState((s) => ({
        ...s,
        step: 3,
        isGenerating: false,
        error: "画像生成に失敗しました",
      }));
    }
  };

  const handleSelect = async () => {
    if (!selectedKey) return;
    setState((s) => ({ ...s, isSelecting: true, error: "" }));
    try {
      const res = await client.api.user.icon.select.$post({
        json: {
          selectedKey,
          rejectedKeys: candidates
            .filter((c) => c.key !== selectedKey)
            .map((c) => c.key),
        },
      });
      if (!res.ok) {
        setState((s) => ({
          ...s,
          isSelecting: false,
          error: "アイコンの設定に失敗しました",
        }));
        return;
      }
      const selected = candidates.find((c) => c.key === selectedKey);
      if (selected) {
        onIconSet(selected.url);
      }
      handleOpenChange(false);
    } catch {
      setState((s) => ({
        ...s,
        isSelecting: false,
        error: "アイコンの設定に失敗しました",
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={step !== 4}>
        {/* Step 1: Color selection */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>好きな色を選んでください</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-4 py-4">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className="flex flex-col items-center gap-1.5"
                  onClick={() =>
                    setState((s) => ({ ...s, color: c.value, step: 2 }))
                  }
                >
                  <div
                    className={cn(
                      "size-12 rounded-full transition-shadow",
                      c.class,
                      color === c.value && "ring-2 ring-offset-2 ring-primary",
                    )}
                  />
                  <span className="text-xs">{c.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Element input */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>好きな化学元素・分子を入力</DialogTitle>
              <DialogDescription>
                例: 水素、H2O、ベンゼン、Au など
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={element}
                onChange={(e) =>
                  setState((s) => ({ ...s, element: e.target.value }))
                }
                placeholder="元素・分子を入力..."
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setState((s) => ({ ...s, step: 1 }))}
              >
                <ChevronLeft className="size-4" />
                戻る
              </Button>
              <Button
                disabled={!element.trim()}
                onClick={() => setState((s) => ({ ...s, step: 3 }))}
              >
                次へ
                <ChevronRight className="size-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Style selection */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle>アイコンの雰囲気を選んでください</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={cn(
                    "rounded-lg border p-4 text-sm font-medium transition-shadow hover:bg-accent",
                    style === s.value && "ring-2 ring-primary",
                  )}
                  onClick={() =>
                    setState((prev) => ({ ...prev, style: s.value }))
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setState((s) => ({ ...s, step: 2, error: "" }))}
              >
                <ChevronLeft className="size-4" />
                戻る
              </Button>
              <Button disabled={!style} onClick={handleGenerate}>
                <Sparkles className="size-4" />
                生成する
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 4: Generating */}
        {step === 4 && (
          <>
            <DialogHeader>
              <DialogTitle>アイコンを生成中...</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="size-12 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                AIがアイコンを生成しています
              </p>
            </div>
          </>
        )}

        {/* Step 5: Candidate selection */}
        {step === 5 && (
          <>
            <DialogHeader>
              <DialogTitle>お気に入りのアイコンを選んでください</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-3 py-4">
              {candidates.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={cn(
                    "overflow-hidden rounded-lg transition-shadow",
                    selectedKey === c.key && "ring-2 ring-primary",
                  )}
                  onClick={() =>
                    setState((s) => ({ ...s, selectedKey: c.key }))
                  }
                >
                  <img
                    src={c.url}
                    alt="候補アイコン"
                    className="size-24 object-cover"
                  />
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                disabled={!selectedKey || isSelecting}
                onClick={handleSelect}
              >
                {isSelecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                設定する
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
