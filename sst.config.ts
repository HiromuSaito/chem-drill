/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "chem-drill",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
      home: "aws",
      providers: {
        aws: { region: "ap-northeast-1" },
      },
    };
  },
  async run() {
    const domain = "chem-drill.com";

    // --- dev / production ステージ ---
    const { createBasicAuthEdge } = await import("./infra/basic-auth");

    // --- シークレット定義 ---
    const databaseUrl = new sst.Secret("DatabaseUrl");
    const geminiApiKey = new sst.Secret("GeminiApiKey");
    const betterAuthSecret = new sst.Secret("BetterAuthSecret");
    const emailFrom = new sst.Secret("EmailFrom");
    const resendApiKey = new sst.Secret("ResendApiKey");
    const basicAuthUser = new sst.Secret("BasicAuthUser");
    const basicAuthPassword = new sst.Secret("BasicAuthPassword");

    // --- アイコンストレージ ---
    const iconBucket = new sst.aws.Bucket("IconBucket", {
      access: "public",
    });

    // --- ドメイン設定 ---
    const isProduction = $app.stage === "production";
    const siteDomain = isProduction ? domain : `${$app.stage}.${domain}`;
    const apiDomain = isProduction
      ? `api.${domain}`
      : `api.${$app.stage}.${domain}`;

    // --- API Gateway (HTTP API) ---
    const api = new sst.aws.ApiGatewayV2("Api", {
      cors: false,
      domain: {
        name: apiDomain,
        dns: sst.aws.dns(),
      },
      transform: {
        api: {
          corsConfiguration: undefined,
        },
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
      memory: "512 MB",
      timeout: "30 seconds",
      environment: {
        DATABASE_URL: databaseUrl.value,
        GEMINI_API_KEY: geminiApiKey.value,
        BETTER_AUTH_SECRET: betterAuthSecret.value,
        BETTER_AUTH_URL: `https://${apiDomain}`,
        CORS_ORIGIN: `https://${siteDomain}`,
        EMAIL_FROM: emailFrom.value,
        RESEND_API_KEY: resendApiKey.value,
        USE_RESEND: "true",
        ICON_BUCKET_NAME: iconBucket.name,
      },
      nodejs: {
        install: ["postgres", "sharp"],
      },
      permissions: [
        {
          actions: ["s3:PutObject", "s3:DeleteObject"],
          resources: [$interpolate`${iconBucket.arn}/*`],
        },
      ],
    });

    return {
      apiUrl: api.url,
      siteUrl: site.url,
    };
  },
});
