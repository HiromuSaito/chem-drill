import sharp from "sharp";
import type { IconProcessor } from "../../domain/user/icon-processor.ts";

const ICON_SIZE = 256;

export class SharpIconProcessor implements IconProcessor {
  async process(input: ArrayBuffer): Promise<Buffer> {
    return sharp(Buffer.from(input))
      .resize(ICON_SIZE, ICON_SIZE, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
  }
}
