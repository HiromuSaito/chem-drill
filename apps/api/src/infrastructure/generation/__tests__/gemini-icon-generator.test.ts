import { describe, it, expect, vi } from "vitest";
import { GeminiIconGenerator } from "../gemini-icon-generator.ts";

describe("GeminiIconGenerator", () => {
  it("generate が Buffer を返す", async () => {
    const fakeImageData = Buffer.from("fake-png-data");
    const base64Data = fakeImageData.toString("base64");

    const mockGenerateContent = vi.fn().mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data,
                },
              },
            ],
          },
        },
      ],
    });

    const mockAi = {
      models: { generateContent: mockGenerateContent },
    };

    const generator = new GeminiIconGenerator(() => "fake-api-key");
    // @ts-expect-error テスト用にモック注入
    generator["ai"] = mockAi;

    const result = await generator.generate({
      color: "blue",
      element: "H2O",
      style: "cute",
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe("fake-png-data");
    expect(mockGenerateContent).toHaveBeenCalledOnce();

    // プロンプトに入力値が含まれていることを確認
    const callArgs = mockGenerateContent.mock.calls[0][0];
    const promptText = JSON.stringify(callArgs);
    expect(promptText).toContain("blue");
    expect(promptText).toContain("H2O");
  });

  it("画像データがない場合はエラーをスロー", async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ text: "Sorry, I cannot generate images." }],
          },
        },
      ],
    });

    const mockAi = {
      models: { generateContent: mockGenerateContent },
    };

    const generator = new GeminiIconGenerator(() => "fake-api-key");
    // @ts-expect-error テスト用にモック注入
    generator["ai"] = mockAi;

    await expect(
      generator.generate({ color: "red", element: "Fe", style: "cool" }),
    ).rejects.toThrow();
  });
});
