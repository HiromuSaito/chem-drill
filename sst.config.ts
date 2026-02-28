/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "chem-drill",
      removal:
        input?.stage === "production" || input?.stage === "shared"
          ? "retain"
          : "remove",
      protect: ["production", "shared"].includes(input?.stage ?? ""),
      home: "aws",
      providers: {
        aws: { region: "ap-northeast-1" },
      },
    };
  },
  async run() {
    const domain = "chem-drill.com";
    const isShared = $app.stage === "shared";

    // --- shared ステージ: SES リソースのみ作成 ---
    if (isShared) {
      const sesIdentity = new aws.sesv2.EmailIdentity("SesIdentity", {
        emailIdentity: domain,
        dkimSigningAttributes: {
          nextSigningKeyLength: "RSA_2048_BIT",
        },
      });

      const zoneId = aws.route53
        .getZone({ name: domain })
        .then((z) => z.zoneId);
      const tokens = sesIdentity.dkimSigningAttributes.tokens;
      for (let i = 0; i < 3; i++) {
        const token = tokens.apply((t) => t[i]);
        new aws.route53.Record(`SesDkim${i}`, {
          zoneId,
          name: token.apply((t) => `${t}._domainkey.${domain}`),
          type: "CNAME",
          ttl: 300,
          records: [token.apply((t) => `${t}.dkim.amazonses.com`)],
        });
      }

      new aws.route53.Record("SesDmarc", {
        zoneId,
        name: `_dmarc.${domain}`,
        type: "TXT",
        ttl: 300,
        records: ["v=DMARC1; p=none;"],
      });

      return {};
    }

    // --- dev / production ステージ ---
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
    const siteDomain = isProduction ? domain : `${$app.stage}.${domain}`;
    const apiDomain = isProduction
      ? `api.${domain}`
      : `api.${$app.stage}.${domain}`;

    // --- SES ARN（shared ステージで作成済みの EmailIdentity を参照）---
    const callerIdentity = aws.getCallerIdentity({});
    const sesIdentityArn = callerIdentity.then(
      (id) => `arn:aws:ses:ap-northeast-1:${id.accountId}:identity/${domain}`,
    );

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
      permissions: [
        {
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: [sesIdentityArn],
        },
      ],
      environment: {
        DATABASE_URL: databaseUrl.value,
        GEMINI_API_KEY: geminiApiKey.value,
        BETTER_AUTH_SECRET: betterAuthSecret.value,
        BETTER_AUTH_URL: `https://${apiDomain}`,
        CORS_ORIGIN: `https://${siteDomain}`,
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
