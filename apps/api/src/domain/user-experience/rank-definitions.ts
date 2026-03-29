export type SubstanceCategory =
  | "日常物質"
  | "一般薬品"
  | "劇物"
  | "毒物"
  | "特定毒物"
  | "最終ランク";

export type RankDefinition = {
  readonly rank: number;
  readonly requiredExp: number;
  readonly substance: string;
  readonly category: SubstanceCategory;
};

export const RANK_DEFINITIONS: readonly RankDefinition[] = Object.freeze([
  { rank: 1, requiredExp: 0, substance: "水 (H₂O)", category: "日常物質" },
  { rank: 2, requiredExp: 50, substance: "食塩 (NaCl)", category: "日常物質" },
  {
    rank: 3,
    requiredExp: 120,
    substance: "重曹 (NaHCO₃)",
    category: "日常物質",
  },
  {
    rank: 4,
    requiredExp: 200,
    substance: "エタノール (C₂H₅OH)",
    category: "日常物質",
  },
  {
    rank: 5,
    requiredExp: 300,
    substance: "酢酸 (CH₃COOH)",
    category: "日常物質",
  },
  {
    rank: 6,
    requiredExp: 420,
    substance: "過酸化水素 (H₂O₂)",
    category: "一般薬品",
  },
  {
    rank: 7,
    requiredExp: 560,
    substance: "アンモニア (NH₃)",
    category: "一般薬品",
  },
  { rank: 8, requiredExp: 720, substance: "塩酸 (HCl)", category: "一般薬品" },
  {
    rank: 9,
    requiredExp: 900,
    substance: "硫酸 (H₂SO₄)",
    category: "一般薬品",
  },
  {
    rank: 10,
    requiredExp: 1100,
    substance: "水酸化ナトリウム (NaOH)",
    category: "一般薬品",
  },
  { rank: 11, requiredExp: 1350, substance: "硝酸 (HNO₃)", category: "劇物" },
  {
    rank: 12,
    requiredExp: 1650,
    substance: "ホルムアルデヒド (HCHO)",
    category: "劇物",
  },
  {
    rank: 13,
    requiredExp: 2000,
    substance: "クロロホルム (CHCl₃)",
    category: "劇物",
  },
  {
    rank: 14,
    requiredExp: 2400,
    substance: "フッ化水素 (HF)",
    category: "毒物",
  },
  { rank: 15, requiredExp: 2850, substance: "黄リン (P₄)", category: "毒物" },
  {
    rank: 16,
    requiredExp: 3350,
    substance: "シアン化カリウム (KCN)",
    category: "毒物",
  },
  { rank: 17, requiredExp: 3900, substance: "ヒ素 (As)", category: "毒物" },
  { rank: 18, requiredExp: 4500, substance: "水銀 (Hg)", category: "特定毒物" },
  { rank: 19, requiredExp: 5200, substance: "VXガス", category: "特定毒物" },
  {
    rank: 20,
    requiredExp: 6000,
    substance: "プルトニウム (Pu)",
    category: "最終ランク",
  },
]);

export function getRankForExp(totalExp: number): number {
  let rank = 1;
  for (const def of RANK_DEFINITIONS) {
    if (totalExp >= def.requiredExp) {
      rank = def.rank;
    } else {
      break;
    }
  }
  return rank;
}

export function getRankInfo(rank: number): RankDefinition {
  const def = RANK_DEFINITIONS[rank - 1];
  if (!def) {
    throw new Error(`Invalid rank: ${rank}`);
  }
  return def;
}
