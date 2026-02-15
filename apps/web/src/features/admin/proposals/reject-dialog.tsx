import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_REJECT_REASON = 500;

const rejectSchema = z.object({
  rejectReason: z
    .string()
    .trim()
    .min(1, "却下理由を入力してください")
    .max(MAX_REJECT_REASON, `${MAX_REJECT_REASON}文字以内で入力してください`),
});

type RejectForm = z.infer<typeof rejectSchema>;

type RejectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (reason: string) => void;
  isPending: boolean;
};

export function RejectDialog({
  open,
  onOpenChange,
  onReject,
  isPending,
}: RejectDialogProps) {
  const form = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejectReason: "" },
  });

  const rejectReasonValue = form.watch("rejectReason");

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>却下理由を入力</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => onReject(data.rejectReason))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="rejectReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>理由</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="却下の理由を入力してください"
                      rows={4}
                      maxLength={MAX_REJECT_REASON}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <p className="ml-auto text-xs text-muted-foreground">
                      {rejectReasonValue.length} / {MAX_REJECT_REASON}
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "送信中..." : "却下する"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
