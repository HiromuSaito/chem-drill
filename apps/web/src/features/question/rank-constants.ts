export type RankDefinition = {
  rank: number;
  substance: string;
  category: string;
};

export const RANK_DEFINITIONS: RankDefinition[] = [
  { rank: 0, substance: "見習い", category: "見習い" },
  { rank: 1, substance: "水 (H₂O)", category: "日常物質" },
  { rank: 2, substance: "食塩 (NaCl)", category: "日常物質" },
  { rank: 3, substance: "重曹 (NaHCO₃)", category: "日常物質" },
  { rank: 4, substance: "エタノール (C₂H₅OH)", category: "日常物質" },
  { rank: 5, substance: "酢酸 (CH₃COOH)", category: "日常物質" },
  { rank: 6, substance: "過酸化水素 (H₂O₂)", category: "一般薬品" },
  { rank: 7, substance: "アンモニア (NH₃)", category: "一般薬品" },
  { rank: 8, substance: "塩酸 (HCl)", category: "一般薬品" },
  { rank: 9, substance: "硫酸 (H₂SO₄)", category: "一般薬品" },
  { rank: 10, substance: "水酸化ナトリウム (NaOH)", category: "一般薬品" },
  { rank: 11, substance: "硝酸 (HNO₃)", category: "劇物" },
  { rank: 12, substance: "ホルムアルデヒド (HCHO)", category: "劇物" },
  { rank: 13, substance: "クロロホルム (CHCl₃)", category: "劇物" },
  { rank: 14, substance: "フッ化水素 (HF)", category: "毒物" },
  { rank: 15, substance: "黄リン (P₄)", category: "毒物" },
  { rank: 16, substance: "シアン化カリウム (KCN)", category: "毒物" },
  { rank: 17, substance: "ヒ素 (As)", category: "毒物" },
  { rank: 18, substance: "水銀 (Hg)", category: "特定毒物" },
  { rank: 19, substance: "VXガス", category: "特定毒物" },
  { rank: 20, substance: "プルトニウム (Pu)", category: "最終ランク" },
];
