import type { IconStorage } from "../../domain/user/icon-storage.ts";

export class DeleteIcon {
  constructor(private iconStorage: IconStorage) {}

  async execute(userId: string): Promise<void> {
    await this.iconStorage.delete(userId);
  }
}
