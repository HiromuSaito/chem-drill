/* eslint-disable @typescript-eslint/no-explicit-any */
const env = ((globalThis as any).process?.env ?? {}) as Record<
  string,
  string | undefined
>;

export function requireEnv(key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value;
}
