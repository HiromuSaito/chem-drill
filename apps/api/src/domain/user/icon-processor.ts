export interface IconProcessor {
  process(input: ArrayBuffer): Promise<Buffer>;
}
