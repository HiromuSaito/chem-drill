import type {
  IconGenerator,
  IconGeneratorInput,
} from "../../domain/user/icon-generator.ts";
import type { IconProcessor } from "../../domain/user/icon-processor.ts";
import type { IconStorage } from "../../domain/user/icon-storage.ts";

interface Candidate {
  url: string;
  key: string;
}

interface GenerateIconResult {
  candidates: Candidate[];
}

export class GenerateIcon {
  constructor(
    private iconGenerator: IconGenerator,
    private iconProcessor: IconProcessor,
    private iconStorage: IconStorage,
  ) {}

  async execute(
    userId: string,
    input: IconGeneratorInput,
  ): Promise<GenerateIconResult> {
    const results = await Promise.allSettled(
      [0, 1, 2].map(() => this.iconGenerator.generate(input)),
    );

    const candidates: Candidate[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        const processed = await this.iconProcessor.process(result.value);
        const candidate = await this.iconStorage.putCandidate(
          userId,
          i,
          processed,
        );
        candidates.push(candidate);
      }
    }

    if (candidates.length === 0) {
      throw new Error("画像生成に失敗しました");
    }

    return { candidates };
  }
}
