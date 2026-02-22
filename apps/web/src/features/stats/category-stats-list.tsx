import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

type CategoryStat = {
  categoryId: string;
  categoryName: string;
  totalAnswered: number;
  correctCount: number;
  uniqueQuestionsAnswered: number;
  totalQuestions: number;
};

type Props = {
  categoryStats: CategoryStat[];
};

export function CategoryStatsList({ categoryStats }: Props) {
  if (categoryStats.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">カテゴリ別成績</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>カテゴリ</TableHead>
              <TableHead className="text-right">正答率</TableHead>
              <TableHead className="text-right">カバー率</TableHead>
              <TableHead className="text-right">回答数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryStats.map((stat) => {
              const correctRate =
                stat.totalAnswered > 0
                  ? Math.round((stat.correctCount / stat.totalAnswered) * 100)
                  : 0;
              const coverageRate =
                stat.totalQuestions > 0
                  ? Math.round(
                      (stat.uniqueQuestionsAnswered / stat.totalQuestions) *
                        100,
                    )
                  : 0;

              return (
                <TableRow key={stat.categoryId}>
                  <TableCell className="font-medium">
                    {stat.categoryName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Progress
                        value={correctRate}
                        className="w-16 [&>*]:bg-[oklch(0.723_0.219_149.579)]"
                      />
                      <span className="w-10 text-sm tabular-nums">
                        {correctRate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Progress
                        value={coverageRate}
                        className="w-16 [&>*]:bg-[oklch(0.623_0.214_259.815)]"
                      />
                      <span className="w-10 text-sm tabular-nums">
                        {coverageRate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {stat.totalAnswered}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
