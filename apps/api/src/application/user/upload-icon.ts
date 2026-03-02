import type { IconStorage } from "../../domain/user/icon-storage.ts";
import type { IconProcessor } from "../../domain/user/icon-processor.ts";

export class UploadIcon {
  constructor(
    private iconStorage: IconStorage,
    private iconProcessor: IconProcessor,
  ) {}

  async execute(userId: string, fileData: ArrayBuffer): Promise<string> {
    const processed = await this.iconProcessor.process(fileData);
    return this.iconStorage.put(userId, processed);
  }
}
