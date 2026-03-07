import { describe, it, expect, vi } from "vitest";
import { GenerateIcon } from "../generate-icon.ts";
import type { IconGenerator } from "../../../domain/user/icon-generator.ts";
import type { IconStorage } from "../../../domain/user/icon-storage.ts";
import type { IconProcessor } from "../../../domain/user/icon-processor.ts";

describe("GenerateIcon", () => {
  it("3枚の候補画像を生成して S3 に保存し、URLとキーを返す", async () => {
    const fakeBuffer = Buffer.from("image-data");
    const processedBuffer = Buffer.from("processed-data");

    const mockGenerator: IconGenerator = {
      generate: vi.fn().mockResolvedValue(fakeBuffer),
    };

    const mockProcessor: IconProcessor = {
      process: vi.fn().mockResolvedValue(processedBuffer),
    };

    const mockStorage: IconStorage = {
      put: vi.fn(),
      delete: vi.fn(),
      putCandidate: vi.fn().mockImplementation(async (_userId, index) => ({
        url: `https://bucket/icons/user1/candidates/${index}.webp`,
        key: `icons/user1/candidates/${index}.webp`,
      })),
      copyToMain: vi.fn(),
      deleteCandidates: vi.fn(),
    };

    const useCase = new GenerateIcon(mockGenerator, mockProcessor, mockStorage);
    const result = await useCase.execute("user1", {
      color: "blue",
      element: "H2O",
      style: "cute",
    });

    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.length).toBeLessThanOrEqual(3);
    expect(mockGenerator.generate).toHaveBeenCalledTimes(3);
    expect(mockProcessor.process).toHaveBeenCalled();
    expect(mockStorage.putCandidate).toHaveBeenCalled();

    for (const candidate of result.candidates) {
      expect(candidate).toHaveProperty("url");
      expect(candidate).toHaveProperty("key");
    }
  });

  it("全ての生成が失敗した場合はエラーをスロー", async () => {
    const mockGenerator: IconGenerator = {
      generate: vi.fn().mockRejectedValue(new Error("API error")),
    };

    const mockProcessor: IconProcessor = {
      process: vi.fn(),
    };

    const mockStorage: IconStorage = {
      put: vi.fn(),
      delete: vi.fn(),
      putCandidate: vi.fn(),
      copyToMain: vi.fn(),
      deleteCandidates: vi.fn(),
    };

    const useCase = new GenerateIcon(mockGenerator, mockProcessor, mockStorage);
    await expect(
      useCase.execute("user1", { color: "red", element: "Fe", style: "cool" }),
    ).rejects.toThrow("画像生成に失敗しました");
  });
});
