import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/client";
import { ChoiceList } from "@/features/question/choice-list";
import { AnswerFeedback } from "@/features/question/answer-feedback";
import { difficultyLabels } from "../proposals/constants";

export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: question, isLoading } = useQuery({
    queryKey: ["question", id],
    queryFn: async () => {
      const res = await client.api.questions[":id"].$get({
        param: { id: id! },
      });
      if (!res.ok) throw new Error("Failed to fetch question");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <p className="text-muted-foreground">読み込み中...</p>;
  }

  if (!question || "error" in question) {
    return <p className="text-destructive">問題が見つかりません</p>;
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/questions")}
      >
        <ArrowLeft className="size-4" />
        一覧に戻る
      </Button>

      <Tabs defaultValue="detail">
        <TabsList>
          <TabsTrigger value="detail">
            <Eye className="size-4" />
            詳細表示
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Gamepad2 className="size-4" />
            クイズプレビュー
          </TabsTrigger>
        </TabsList>
        <TabsContent value="detail">
          <DetailView question={question} />
        </TabsContent>
        <TabsContent value="preview">
          <QuizPreview question={question} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type QuestionData = {
  id: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  category: { categoryId: string; categoryName: string };
  createdAt: string;
  updatedAt: string;
};

function DetailView({ question }: { question: QuestionData }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">問題文</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{question.text}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">選択肢</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {question.choices.map((choice, i) => (
              <li
                key={i}
                className={`rounded-md border px-3 py-2 ${
                  question.correctIndexes.includes(i)
                    ? "border-green-500 bg-green-50 font-medium text-green-800 dark:bg-green-950 dark:text-green-200"
                    : ""
                }`}
              >
                {choice}
                {question.correctIndexes.includes(i) && (
                  <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                    (正解)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">解説</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{question.explanation}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">メタ情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">難易度</dt>
            <dd>
              <Badge variant="secondary">
                {difficultyLabels[question.difficulty] ?? question.difficulty}
              </Badge>
            </dd>
            <dt className="text-muted-foreground">カテゴリ</dt>
            <dd>
              <Badge variant="outline">{question.category.categoryName}</Badge>
            </dd>
            <dt className="text-muted-foreground">作成日</dt>
            <dd>{new Date(question.createdAt).toLocaleString("ja-JP")}</dd>
            <dt className="text-muted-foreground">更新日</dt>
            <dd>{new Date(question.updatedAt).toLocaleString("ja-JP")}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function QuizPreview({ question }: { question: QuestionData }) {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);

  const isMultiple = question.correctIndexes.length > 1;

  const handleSelect = useCallback(
    (index: number) => {
      if (isAnswered) return;
      if (isMultiple) {
        setSelectedIndexes((prev) =>
          prev.includes(index)
            ? prev.filter((i) => i !== index)
            : [...prev, index],
        );
      } else {
        setSelectedIndexes([index]);
      }
    },
    [isAnswered, isMultiple],
  );

  const handleAnswer = () => {
    setIsAnswered(true);
  };

  const handleReset = () => {
    setSelectedIndexes([]);
    setIsAnswered(false);
  };

  const isCorrect =
    isAnswered &&
    selectedIndexes.length === question.correctIndexes.length &&
    selectedIndexes.every((i) => question.correctIndexes.includes(i));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question.text}</CardTitle>
        {isMultiple && (
          <p className="text-sm text-muted-foreground">
            複数選択（{question.correctIndexes.length}つ選択）
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ChoiceList
          choices={question.choices}
          correctIndexes={question.correctIndexes}
          selectedIndexes={selectedIndexes}
          isAnswered={isAnswered}
          onSelect={handleSelect}
        />

        {isAnswered ? (
          <>
            <AnswerFeedback
              isCorrect={isCorrect}
              explanation={question.explanation}
            />
            <Button variant="outline" onClick={handleReset}>
              リセット
            </Button>
          </>
        ) : (
          <Button
            onClick={handleAnswer}
            disabled={selectedIndexes.length === 0}
          >
            回答する
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
