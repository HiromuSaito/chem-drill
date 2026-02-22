import {
  Label,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  correctRate: number;
  coverageRate: number;
};

const chartConfig = {
  correctRate: {
    label: "正答率",
    color: "oklch(0.723 0.219 149.579)",
  },
  coverageRate: {
    label: "カバー率",
    color: "oklch(0.623 0.214 259.815)",
  },
} satisfies ChartConfig;

export function StatsRadialChart({ correctRate, coverageRate }: Props) {
  const data = [
    {
      name: "カバー率",
      value: Math.round(coverageRate * 100),
      fill: "var(--color-coverageRate)",
    },
    {
      name: "正答率",
      value: Math.round(correctRate * 100),
      fill: "var(--color-correctRate)",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">総合スコア</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={data}
            innerRadius={60}
            outerRadius={110}
            startAngle={90}
            endAngle={-270}
          >
            <PolarGrid gridType="circle" radialLines={false} stroke="none" />
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) - 8}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {Math.round(correctRate * 100)}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 14}
                          className="fill-muted-foreground text-xs"
                        >
                          正答率
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="value"
              cornerRadius={5}
              background={{ fill: "hsl(var(--muted))" }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <span>
                      {name}: {String(value)}%
                    </span>
                  )}
                />
              }
            />
          </RadialBarChart>
        </ChartContainer>
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <div
              className="size-3 rounded-full"
              style={{ backgroundColor: chartConfig.correctRate.color }}
            />
            <span className="text-muted-foreground">
              正答率: {Math.round(correctRate * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="size-3 rounded-full"
              style={{ backgroundColor: chartConfig.coverageRate.color }}
            />
            <span className="text-muted-foreground">
              カバー率: {Math.round(coverageRate * 100)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
