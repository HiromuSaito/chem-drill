import type { Output } from "@pulumi/pulumi";

/**
 * dev ステージ用の Basic 認証 CloudFront Functions 設定を生成する。
 * production ステージでは undefined を返す。
 */
export function createBasicAuthEdge(
  stage: string,
  user: Output<string>,
  password: Output<string>,
) {
  if (stage === "production") return undefined;

  const encoded = $resolve([user, password]).apply(([u, p]) =>
    Buffer.from(u + ":" + p).toString("base64"),
  );

  return {
    viewerRequest: {
      injection: $interpolate`
var expected = "Basic ${encoded}";
if (!event.request.headers.authorization || event.request.headers.authorization.value !== expected) {
  return { statusCode: 401, headers: { "www-authenticate": { value: "Basic" } } };
}`,
    },
  };
}
