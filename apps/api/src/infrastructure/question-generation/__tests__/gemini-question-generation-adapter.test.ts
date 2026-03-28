import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
  },
}));

import { GeminiQuestionGenerationAdapter } from "../gemini-question-generation-adapter.ts";

const VALID_RESPONSE = JSON.stringify([
  {
    questionText: "テスト問題",
    difficulty: "easy",
    choices: ["A", "B", "C", "D"],
    correctIndexes: [0],
    explanation: "解説",
  },
]);

describe("GeminiQuestionGenerationAdapter", () => {
  let adapter: GeminiQuestionGenerationAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new GeminiQuestionGenerationAdapter(() => "test-api-key");
  });

  describe("URL source", () => {
    it("urlContext ツールを使用し、プロンプトに URL を含める", async () => {
      mockGenerateContent.mockResolvedValue({ text: VALID_RESPONSE });

      await adapter.generate({ type: "url", url: "https://example.com" }, 3);

      expect(mockGenerateContent).toHaveBeenCalledOnce();
      const args = mockGenerateContent.mock.calls[0][0];
      expect(args.config?.tools).toEqual([{ urlContext: {} }]);
      expect(args.contents).toEqual(
        expect.arrayContaining([
          expect.stringContaining("https://example.com"),
        ]),
      );
    });
  });

  describe("PDF source", () => {
    it("inlineData に application/pdf mimeType を使用し、urlContext を使わない", async () => {
      mockGenerateContent.mockResolvedValue({ text: VALID_RESPONSE });

      await adapter.generate({ type: "pdf", data: "base64pdfdata" }, 3);

      expect(mockGenerateContent).toHaveBeenCalledOnce();
      const args = mockGenerateContent.mock.calls[0][0];

      // urlContext が含まれていないこと
      expect(args.config?.tools).toBeUndefined();

      // inlineData が正しく設定されていること
      const parts = args.contents[0].parts;
      expect(parts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            inlineData: {
              mimeType: "application/pdf",
              data: "base64pdfdata",
            },
          }),
        ]),
      );
    });
  });

  describe("Image source", () => {
    it("inlineData に指定された mimeType を使用する", async () => {
      mockGenerateContent.mockResolvedValue({ text: VALID_RESPONSE });

      await adapter.generate(
        { type: "image", data: "base64imagedata", mimeType: "image/png" },
        3,
      );

      expect(mockGenerateContent).toHaveBeenCalledOnce();
      const args = mockGenerateContent.mock.calls[0][0];

      // urlContext が含まれていないこと
      expect(args.config?.tools).toBeUndefined();

      // inlineData が正しく設定されていること
      const parts = args.contents[0].parts;
      expect(parts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            inlineData: {
              mimeType: "image/png",
              data: "base64imagedata",
            },
          }),
        ]),
      );
    });
  });

  describe("空レスポンス", () => {
    it("Gemini API からのレスポンスが空の場合エラーを投げる", async () => {
      mockGenerateContent.mockResolvedValue({ text: "" });

      await expect(
        adapter.generate({ type: "url", url: "https://example.com" }, 3),
      ).rejects.toThrow("Gemini API からのレスポンスが空です");
    });
  });
});
