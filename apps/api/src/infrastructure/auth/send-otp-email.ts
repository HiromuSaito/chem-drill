import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { requireEnv } from "../../env";

const sesClient = new SESv2Client({
  ...(process.env.SES_ENDPOINT && { endpoint: process.env.SES_ENDPOINT }),
  region: process.env.AWS_REGION ?? "ap-northeast-1",
  ...(process.env.SES_ENDPOINT && {
    credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
  }),
});

export async function sendOtpEmail(
  email: string,
  otp: string,
  type: string,
): Promise<void> {
  const subject =
    type === "sign-in" ? "Chem Drill ログインコード" : "Chem Drill 認証コード";

  await sesClient.send(
    new SendEmailCommand({
      FromEmailAddress: requireEnv("SES_FROM_EMAIL"),
      Destination: { ToAddresses: [email] },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: {
            Text: {
              Data: `あなたの認証コードは ${otp} です。5分以内に入力してください。`,
            },
          },
        },
      },
    }),
  );
}
