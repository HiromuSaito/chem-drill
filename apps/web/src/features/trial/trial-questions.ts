import type { QuestionDto } from "@/types/question";

export const TRIAL_QUESTIONS: QuestionDto[] = [
  {
    id: "trial-1",
    text: "水の化学式はどれか？",
    difficulty: "easy",
    choices: ["H2O", "CO2", "NaCl", "O2"],
    correctIndexes: [0],
    explanation:
      "水の化学式は H2O です。水素原子2つと酸素原子1つから構成されます。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
  {
    id: "trial-2",
    text: "塩化ナトリウムの化学式はどれか？",
    difficulty: "easy",
    choices: ["NaCl", "KCl", "CaCl2", "MgCl2"],
    correctIndexes: [0],
    explanation: "塩化ナトリウム（食塩）の化学式は NaCl です。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
  {
    id: "trial-3",
    text: "二酸化炭素の化学式はどれか？",
    difficulty: "easy",
    choices: ["CO", "CO2", "C2O", "O2C"],
    correctIndexes: [1],
    explanation:
      "二酸化炭素の化学式は CO2 です。炭素原子1つと酸素原子2つから構成されます。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
  {
    id: "trial-4",
    text: "鉄の元素記号はどれか？",
    difficulty: "easy",
    choices: ["Ir", "Fe", "F", "Fr"],
    correctIndexes: [1],
    explanation: "鉄の元素記号は Fe です。ラテン語の ferrum に由来します。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
  {
    id: "trial-5",
    text: "希ガスに該当する元素はどれか？（複数選択）",
    difficulty: "normal",
    choices: ["ヘリウム", "窒素", "ネオン", "酸素"],
    correctIndexes: [0, 2],
    explanation:
      "ヘリウム（He）とネオン（Ne）は希ガス（第18族元素）です。窒素と酸素は希ガスではありません。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
];
