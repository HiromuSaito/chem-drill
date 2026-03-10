import type { QuestionDto } from "@/types/question";

export const TRIAL_QUESTIONS: QuestionDto[] = [
  {
    id: "trial-1",
    text: "「SDS」とは何の略称で、その主な目的は何ですか？",
    difficulty: "easy",
    choices: [
      "Security Data Sheetの略で、化学物質の物理的性質を記録する。",
      "Safety Data Sheetの略で、化学物質の危険性や安全な取扱方法などを伝達する。",
      "Standard Data Systemの略で、化学物質の登録番号を管理する。",
      "Supply Document Standardの略で、化学物質の供給履歴を追跡する。",
      "Safety Disposal Standardの略で、化学物質の廃棄方法のみを記載する。",
    ],
    correctIndexes: [1],
    explanation:
      "SDSは「Safety Data Sheet（安全データシート）」の略称です。化学物質を譲渡または提供する際に、その危険性、安全な取扱い方法、保管方法などを相手に伝達することを主な目的としています。",
    category: { categoryId: "trial", categoryName: "SDS" },
  },
  {
    id: "trial-2",
    text: "GHS分類に関する説明として正しいものを全て選びなさい。",
    difficulty: "",
    choices: [
      "化学物質を危険有害性の種類・程度により分類し、使用者にわかりやすい形で表示する国連によって定められたシステムである。",
      "化学品を物理化学的危険性、健康有害性、環境有害性の3つの観点から分析する。",
      "分類結果は主に文章で表現され、絵表示は使用されない。",
      "SDS作成時のGHS分類は、NITE-CHRIPなどの信頼できる機関が公開している情報を参照して行うことができる。",
      "GHS分類の目的は、化学物質の輸送規制にのみある。",
    ],
    correctIndexes: [0, 1, 3],
    explanation:
      "GHS分類は、化学物質の危険有害性を分類し、使用者への情報伝達を容易にするために国連が定めたシステムです。物理化学的危険性、健康有害性、環境有害性の3つの観点から分析し、その結果は絵表示によって示されます。SDS作成時には、原材料のSDSやNITE-CHRIPなどの信頼できる機関の情報を参照してGHS分類を行います。輸送規制だけでなく、職場での安全確保など広範な目的があります。",
    category: { categoryId: "trial", categoryName: "SDS" },
  },
  {
    id: "trial-3",
    text: "SDSの交付義務を定めている「SDS3法」と呼ばれる主要な3つの法令はどれですか？（複数選択可）",
    difficulty: "easy",
    choices: [
      "労働安全衛生法（安衛法）",
      "化学物質排出把握管理促進法（化管法）",
      "化学物質の審査及び製造等の規制に関する法律（化審法）",
      "消防法",
      "毒物及び劇物取締法（毒劇法）",
    ],
    correctIndexes: [0, 1, 4],
    explanation:
      "SDS3法とは、化学物質の安全データシート（SDS）の交付義務を定める3つの法令の総称です。労働安全衛生法（安衛法）は労働者の化学物質ばく露防止を目的としてSDSの交付を義務付け、化学物質排出把握管理促進法（化管法）は環境への化学物質排出量の把握・管理を目的として事業者間でのSDS提供を求めています。毒物及び劇物取締法（毒劇法）は毒物・劇物の譲渡・提供時にSDSに相当する情報提供を義務付けています。なお、化審法は新規化学物質の審査・規制を行う法律であり、消防法は危険物の貯蔵・取扱いを規制する法律ですが、どちらもSDSの交付義務を直接定める法令ではないためSDS3法には含まれません。",
    category: { categoryId: "trial", categoryName: "法令" },
  },
  {
    id: "trial-4",
    text: "かつて日本国内でSDSの旧称として使用されていたものは何ですか？",
    difficulty: "easy",
    choices: [
      "CSDS (Chemical Safety Data Sheet)",
      "PSDS (Product Safety Data Sheet)",
      "MSDS (Material Safety Data Sheet)",
      "HSIS (Hazardous Substance Information Sheet)",
    ],
    correctIndexes: [2],
    explanation:
      "MSDS（Material Safety Data Sheet）はSDSの日本国内での旧称です。国際標準化の観点から、2017年に日本国内でも国連のGHSに基づいてSDSの呼称が使用されるようになりました。",
    category: { categoryId: "trial", categoryName: "SDS" },
  },
  {
    id: "trial-5",
    text: "化管法が定める2つの制度とはどれですか？(複数選択可)",
    difficulty: "easy",
    choices: [
      "PRTR制度（化学物質排出移動量届出制度）",
      "SDS制度（安全データシート提供制度）",
      "GHS制度（化学品の分類および表示に関する世界調和システム）",
      "リスクアセスメント制度",
    ],
    correctIndexes: [0, 1],
    explanation:
      "化管法（化学物質排出把握管理促進法）は2つの制度を定めています。1つ目はPRTR制度で、事業者が化学物質の環境への排出量・移動量を国に届け出る制度です。2つ目はSDS制度で、化学物質を他の事業者に譲渡・提供する際に、その性状や取り扱いに関する情報をSDSとして提供することを義務付ける制度です。GHSは国連が定めた国際的な分類・表示システムであり、リスクアセスメントは安衛法が義務付ける制度であるため、どちらも化管法が定める制度には含まれません。",
    category: { categoryId: "trial", categoryName: "法令" },
  },
];
