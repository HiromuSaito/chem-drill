export interface IconStorage {
  put(userId: string, data: Buffer): Promise<string>;
  delete(userId: string): Promise<void>;
  putCandidate(
    userId: string,
    index: number,
    data: Buffer,
  ): Promise<{ url: string; key: string }>;
  copyToMain(userId: string, candidateKey: string): Promise<string>;
  deleteCandidates(keys: string[]): Promise<void>;
}
