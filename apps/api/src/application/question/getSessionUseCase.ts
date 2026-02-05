export type QuestionDto = {
  id: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  category: string;
};

export type GetSessionResult = {
  questions: QuestionDto[];
};

// TODO: QuestionRepository に差し替える
const stubQuestions: QuestionDto[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    text: "SDSの記載項目として正しいものはどれか",
    difficulty: "medium",
    choices: ["GHS分類", "市場価格", "製造者の趣味", "天気予報"],
    correctIndexes: [0],
    explanation: "GHS分類はSDSの必須記載項目です。",
    category: "化学物質管理",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    text: "GHSピクトグラムの枠の色として正しいものはどれか",
    difficulty: "easy",
    choices: ["赤", "青", "緑", "黄"],
    correctIndexes: [0],
    explanation: "GHSピクトグラムの枠は赤色のひし形です。",
    category: "GHS",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    text: "労働安全衛生法でSDS交付が義務付けられている物質の通称はどれか",
    difficulty: "medium",
    choices: ["表示対象物質", "届出対象物質", "通知対象物質", "管理対象物質"],
    correctIndexes: [2],
    explanation: "SDS交付義務のある物質は「通知対象物質」と呼ばれます。",
    category: "法規制",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    text: "化管法（PRTR法）で届出が必要な物質の種類はどれか",
    difficulty: "medium",
    choices: [
      "第一種指定化学物質",
      "第二種指定化学物質",
      "特定化学物質",
      "有機溶剤",
    ],
    correctIndexes: [0],
    explanation:
      "化管法では第一種指定化学物質の排出量・移動量の届出が義務付けられています。",
    category: "法規制",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    text: "SDSの記載項目数として正しいものはどれか",
    difficulty: "easy",
    choices: ["12項目", "14項目", "16項目", "18項目"],
    correctIndexes: [2],
    explanation: "SDSはJIS Z 7253に基づき16項目で構成されます。",
    category: "化学物質管理",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440006",
    text: "GHS分類で「急性毒性」のカテゴリー数はいくつか",
    difficulty: "hard",
    choices: ["3", "4", "5", "6"],
    correctIndexes: [2],
    explanation: "急性毒性はカテゴリー1〜5の5段階に分類されます。",
    category: "GHS",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440007",
    text: "リスクアセスメントの手法として適切なものをすべて選べ",
    difficulty: "hard",
    choices: [
      "コントロール・バンディング",
      "実測によるばく露評価",
      "目視確認のみ",
      "数理モデルによる推定",
    ],
    correctIndexes: [0, 1, 3],
    explanation:
      "コントロール・バンディング、実測、数理モデルはいずれも有効な手法です。目視確認のみでは不十分です。",
    category: "リスクアセスメント",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440008",
    text: "有機溶剤中毒予防規則で第1種有機溶剤に分類されるものはどれか",
    difficulty: "hard",
    choices: ["二硫化炭素", "トルエン", "アセトン", "メタノール"],
    correctIndexes: [0],
    explanation:
      "二硫化炭素は毒性が高く第1種有機溶剤に分類されます。トルエンは第2種です。",
    category: "法規制",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440009",
    text: "特定化学物質障害予防規則における特別管理物質の管理として正しいものはどれか",
    difficulty: "medium",
    choices: [
      "作業記録を30年間保存する",
      "作業記録を5年間保存する",
      "作業記録の保存義務はない",
      "作業記録を10年間保存する",
    ],
    correctIndexes: [0],
    explanation:
      "特別管理物質は発がん性等が懸念されるため、作業記録を30年間保存する義務があります。",
    category: "法規制",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    text: "化学物質の保管場所に求められる条件として正しいものをすべて選べ",
    difficulty: "medium",
    choices: [
      "換気が十分であること",
      "直射日光を避けること",
      "施錠管理ができること",
      "室温を50度以上に保つこと",
    ],
    correctIndexes: [0, 1, 2],
    explanation:
      "換気・遮光・施錠管理は保管の基本要件です。高温保管は危険です。",
    category: "化学物質管理",
  },
];

export function getSessionUseCase(): GetSessionResult {
  // TODO: リポジトリからランダム10問取得に差し替え
  return { questions: stubQuestions };
}
