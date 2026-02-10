import { GoogleGenAI } from "@google/genai";
import type {
  QuestionGenerationService,
  GeneratedQuestion,
} from "../../application/question-proposal/question-generation-service.js";
import { questionGenerationResultSchema } from "./schema.js";

const MODEL = "gemini-2.5-flash";

export class GeminiQuestionGenerationAdapter implements QuestionGenerationService {
  private ai: GoogleGenAI | null = null;

  constructor(private getApiKey: () => string) {}

  private getClient(): GoogleGenAI {
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: this.getApiKey() });
    }
    return this.ai;
  }

  async generate(
    url: string,
    questionCount: number,
  ): Promise<GeneratedQuestion[]> {
    const prompt = this.buildPrompt(url, questionCount);

    const response = await this.getClient().models.generateContent({
      model: MODEL,
      contents: [prompt],
      config: {
        tools: [{ urlContext: {} }],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini API からのレスポンスが空です");
    }

    try {
      const jsonText = this.extractJson(text);
      const parsed = JSON.parse(jsonText);
      return questionGenerationResultSchema.parse(parsed);
    } catch (e) {
      throw new Error(
        `Gemini の出力を解析できませんでした: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private extractJson(text: string): string {
    // ```json ... ``` ブロックを抽出
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      return match[1];
    }
    // フォールバック: そのまま返す
    return text;
  }

  private buildPrompt(url: string, questionCount: number): string {
    return `以下のURLの内容を読み取り、化学物質管理に関するクイズを${questionCount}問生成してください。

URL: ${url}

## ルール
1. 各問題は4〜8個の選択肢を持ってください。
2. 正解は1つ以上設定できます。複数正解の問題も含めてください。
3. 難易度は easy / medium / hard のいずれかで、バランスよく割り振ってください。
4. 問題文は500文字以内、解説文は1000文字以内としてください。
5. 正確な情報に基づいた問題を作成してください。

## 出力形式
以下の JSON 配列形式で出力してください。JSON のみを出力し、それ以外のテキストは含めないでください。

\`\`\`json
[
  {
    "questionText": "問題文",
    "difficulty": "easy",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correctIndexes": [0],
    "explanation": "解説文"
  }
]
\`\`\``;
  }
}
