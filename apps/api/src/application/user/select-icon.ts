import type { IconStorage } from "../../domain/user/icon-storage.ts";
import type { UserRepository } from "../../domain/user/repository/user-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

interface SelectIconInput {
  selectedKey: string;
  rejectedKeys: string[];
}

interface SelectIconResult {
  imageUrl: string;
}

export class SelectIcon {
  constructor(
    private iconStorage: IconStorage,
    private userRepository: UserRepository,
    private uow: UnitOfWork,
  ) {}

  async execute(
    userId: string,
    input: SelectIconInput,
  ): Promise<SelectIconResult> {
    const imageUrl = await this.iconStorage.copyToMain(
      userId,
      input.selectedKey,
    );

    await this.uow.run(async () => {
      await this.userRepository.updateImage(userId, imageUrl);
    });

    if (input.rejectedKeys.length > 0) {
      await this.iconStorage.deleteCandidates(input.rejectedKeys);
    }

    return { imageUrl };
  }
}
