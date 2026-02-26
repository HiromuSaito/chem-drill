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
    // --- シークレット定義 ---
    const databaseUrl = new sst.Secret("DatabaseUrl");
    const geminiApiKey = new sst.Secret("GeminiApiKey");
    const betterAuthSecret = new sst.Secret("BetterAuthSecret");
    const corsOrigin = new sst.Secret("CorsOrigin");
    const sesFromEmail = new sst.Secret("SesFromEmail");

    // --- API Gateway (HTTP API) ---
    const api = new sst.aws.ApiGatewayV2("Api");

    // キャッチオールルート: 全リクエストを Hono に委譲
    api.route("$default", {
      handler: "apps/api/src/lambda.handler",
      environment: {
        DATABASE_URL: databaseUrl.value,
        GEMINI_API_KEY: geminiApiKey.value,
        BETTER_AUTH_SECRET: betterAuthSecret.value,
        BETTER_AUTH_URL: api.url,
        CORS_ORIGIN: corsOrigin.value,
        SES_FROM_EMAIL: sesFromEmail.value,
      },
      nodejs: {
        install: ["postgres"],
      },
    });

    return { apiUrl: api.url };
  },
});
