import { GoogleGenAI } from "@google/genai";
import type {
  IconGenerator,
  IconGeneratorInput,
} from "../../domain/user/icon-generator.ts";

const MODEL = "gemini-2.5-flash";

const STYLE_LABELS: Record<IconGeneratorInput["style"], string> = {
  cute: "かわいい、丸みのある、パステル調",
  cool: "クール、シャープ、メタリック",
  simple: "ミニマル、幾何学的、モノトーン",
  science: "サイエンス風、分子構造モチーフ、実験器具",
};

export class GeminiIconGenerator implements IconGenerator {
  private ai: GoogleGenAI | null = null;

  constructor(private getApiKey: () => string) {}

  private getClient(): GoogleGenAI {
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: this.getApiKey() });
    }
    return this.ai;
  }

  async generate(input: IconGeneratorInput): Promise<Buffer> {
    const prompt = this.buildPrompt(input);

    const response = await this.getClient().models.generateContent({
      model: MODEL,
      contents: [prompt],
      config: {
        responseModalities: ["image"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("Gemini API からのレスポンスが空です");
    }

    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error("Gemini API から画像データを取得できませんでした");
    }

    return Buffer.from(imagePart.inlineData.data, "base64");
  }

  private buildPrompt(input: IconGeneratorInput): string {
    const styleLabel = STYLE_LABELS[input.style];
    return `Generate a flat-design icon image (256x256 pixels) for a user avatar.

Requirements:
- Primary color: ${input.color}
- Theme: inspired by the chemical element or molecule "${input.element}"
- Style: ${styleLabel}
- Flat design, suitable as a profile icon
- No text or letters in the image
- Clean, simple composition with a solid or gradient background
- The design should be visually appealing and recognizable at small sizes`;
  }
}
