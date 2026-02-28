/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "chem-drill",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage ?? ""),
      home: "aws",
      providers: {
        aws: { region: "ap-northeast-1" },
      },
    };
  },
  async run() {
    const { createBasicAuthEdge } = await import("./infra/basic-auth");
    // --- シークレット定義 ---
    const databaseUrl = new sst.Secret("DatabaseUrl");
    const geminiApiKey = new sst.Secret("GeminiApiKey");
    const betterAuthSecret = new sst.Secret("BetterAuthSecret");
    const sesFromEmail = new sst.Secret("SesFromEmail");
    const basicAuthUser = new sst.Secret("BasicAuthUser");
    const basicAuthPassword = new sst.Secret("BasicAuthPassword");

    // --- ドメイン設定 ---
    const isProduction = $app.stage === "production";
    const domain = "chem-drill.com";
    const siteDomain = isProduction ? domain : `${$app.stage}.${domain}`;
    const apiDomain = isProduction
      ? `api.${domain}`
      : `api.${$app.stage}.${domain}`;

    // --- API Gateway (HTTP API) ---
    const api = new sst.aws.ApiGatewayV2("Api", {
      domain: {
        name: apiDomain,
        dns: sst.aws.dns(),
      },
    });

    // --- Static Site (S3 + CloudFront) ---
    const site = new sst.aws.StaticSite("Web", {
      domain: {
        name: siteDomain,
        dns: sst.aws.dns(),
      },
      path: "apps/web",
      build: {
        command: "pnpm run build",
        output: "dist",
      },
      environment: {
        VITE_API_URL: api.url,
      },
      // dev ステージのみ Basic 認証
      edge: createBasicAuthEdge(
        $app.stage,
        basicAuthUser.value,
        basicAuthPassword.value,
      ),
    });

    // キャッチオールルート: 全リクエストを Hono に委譲
    api.route("$default", {
      handler: "apps/api/src/lambda.handler",
      environment: {
        DATABASE_URL: databaseUrl.value,
        GEMINI_API_KEY: geminiApiKey.value,
        BETTER_AUTH_SECRET: betterAuthSecret.value,
        BETTER_AUTH_URL: api.url,
        CORS_ORIGIN: site.url,
        SES_FROM_EMAIL: sesFromEmail.value,
      },
      nodejs: {
        install: ["postgres"],
      },
    });

    return {
      apiUrl: api.url,
      siteUrl: site.url,
    };
  },
});
