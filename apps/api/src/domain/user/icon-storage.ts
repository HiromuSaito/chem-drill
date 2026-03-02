export interface IconStorage {
  put(userId: string, data: Buffer): Promise<string>;
  delete(userId: string): Promise<void>;
}
