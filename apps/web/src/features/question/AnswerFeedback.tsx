import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

type Props = {
  isCorrect: boolean;
  explanation: string;
};

export function AnswerFeedback({ isCorrect, explanation }: Props) {
  return (
    <Alert variant={isCorrect ? "default" : "destructive"} className="mt-4">
      {isCorrect ? (
        <CheckCircle2 className="size-4 text-green-600" />
      ) : (
        <XCircle className="size-4" />
      )}
      <AlertTitle>{isCorrect ? "正解！" : "不正解"}</AlertTitle>
      <AlertDescription>{explanation}</AlertDescription>
    </Alert>
  );
}
