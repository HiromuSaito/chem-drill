import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuestionDto } from "@/types/question";
import { ChoiceList } from "./ChoiceList";
import { AnswerFeedback } from "./AnswerFeedback";

type Props = {
  question: QuestionDto;
  selectedIndexes: number[];
  isAnswered: boolean;
  isCorrect: boolean | null;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  isLast: boolean;
};

export function QuestionCard({
  question,
  selectedIndexes,
  isAnswered,
  isCorrect,
  onSelect,
  onSubmit,
  onNext,
  isLast,
}: Props) {
  const isMultiple = question.correctIndexes.length > 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{question.category}</Badge>
          <Badge variant="outline">{question.difficulty}</Badge>
          {isMultiple && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              複数選択
            </Badge>
          )}
        </div>
        <CardTitle className="text-base">{question.text}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChoiceList
          choices={question.choices}
          correctIndexes={question.correctIndexes}
          selectedIndexes={selectedIndexes}
          isAnswered={isAnswered}
          onSelect={onSelect}
        />

        {isAnswered && isCorrect !== null && (
          <AnswerFeedback
            isCorrect={isCorrect}
            explanation={question.explanation}
          />
        )}

        <div className="mt-6 flex justify-end">
          {!isAnswered ? (
            <Button onClick={onSubmit} disabled={selectedIndexes.length === 0}>
              回答する
            </Button>
          ) : (
            <Button onClick={onNext}>
              {isLast ? "結果を見る" : "次の問題へ"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
