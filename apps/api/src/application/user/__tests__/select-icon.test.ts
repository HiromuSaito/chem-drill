import { describe, it, expect, vi } from "vitest";
import { SelectIcon } from "../select-icon.ts";
import type { IconStorage } from "../../../domain/user/icon-storage.ts";
import type { UserRepository } from "../../../domain/user/repository/user-repository.ts";
import type { UnitOfWork } from "../../unit-of-work.ts";

describe("SelectIcon", () => {
  const userId = "user1";
  const selectedKey = "icons/user1/candidates/0.webp";
  const rejectedKeys = [
    "icons/user1/candidates/1.webp",
    "icons/user1/candidates/2.webp",
  ];
  const mainUrl = "https://bucket/icons/user1/icon.webp";

  function createMocks() {
    const mockStorage: IconStorage = {
      put: vi.fn(),
      delete: vi.fn(),
      putCandidate: vi.fn(),
      copyToMain: vi.fn().mockResolvedValue(mainUrl),
      deleteCandidates: vi.fn(),
    };

    const mockUserRepository: UserRepository = {
      updateImage: vi.fn(),
    };

    const mockUow: UnitOfWork = {
      run: vi.fn().mockImplementation((work) => work()),
    };

    return { mockStorage, mockUserRepository, mockUow };
  }

  it("選択した候補画像をメインにコピーし、DB を更新して不要な候補を削除する", async () => {
    const { mockStorage, mockUserRepository, mockUow } = createMocks();
    const useCase = new SelectIcon(mockStorage, mockUserRepository, mockUow);

    const result = await useCase.execute(userId, {
      selectedKey,
      rejectedKeys,
    });

    expect(mockStorage.copyToMain).toHaveBeenCalledWith(userId, selectedKey);
    expect(mockUow.run).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.updateImage).toHaveBeenCalledWith(
      userId,
      mainUrl,
    );
    expect(mockStorage.deleteCandidates).toHaveBeenCalledWith(rejectedKeys);
    expect(result).toEqual({ imageUrl: mainUrl });
  });

  it("rejectedKeys が空の場合は deleteCandidates を呼ばない", async () => {
    const { mockStorage, mockUserRepository, mockUow } = createMocks();
    const useCase = new SelectIcon(mockStorage, mockUserRepository, mockUow);

    await useCase.execute(userId, {
      selectedKey,
      rejectedKeys: [],
    });

    expect(mockStorage.copyToMain).toHaveBeenCalledWith(userId, selectedKey);
    expect(mockUserRepository.updateImage).toHaveBeenCalledWith(
      userId,
      mainUrl,
    );
    expect(mockStorage.deleteCandidates).not.toHaveBeenCalled();
  });
});
