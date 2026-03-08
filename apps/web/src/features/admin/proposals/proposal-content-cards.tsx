import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProposalContentCardsProps = {
  text: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  rejectReason?: string | null;
};

export function ProposalContentCards({
  text,
  choices,
  correctIndexes,
  explanation,
  rejectReason,
}: ProposalContentCardsProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">問題文</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{text}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">選択肢</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {choices.map((choice, i) => {
              const isCorrect = correctIndexes.includes(i);
              return (
                <li
                  key={i}
                  className={`rounded-md border px-4 py-2 text-sm ${
                    isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : ""
                  }`}
                >
                  <span className="mr-2 font-mono text-muted-foreground">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {choice}
                  {isCorrect && (
                    <Check className="ml-2 inline size-4 text-green-600" />
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">解説</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{explanation}</p>
        </CardContent>
      </Card>

      {rejectReason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              却下理由
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{rejectReason}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
