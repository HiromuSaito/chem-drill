import { Resend } from "resend";
import { createTransport } from "nodemailer";
import { requireEnv } from "../../env.ts";

const useResend = process.env.USE_RESEND === "true";

const resend = useResend ? new Resend(requireEnv("RESEND_API_KEY")) : null;

const transport = useResend
  ? null
  : createTransport({
      host: "localhost",
      port: 1025,
      secure: false,
    });

async function sendViaResend(
  from: string,
  to: string,
  subject: string,
  text: string,
) {
  const { error } = await resend!.emails.send({
    from,
    to: [to],
    subject,
    text,
  });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

function sendViaMailpit(
  from: string,
  to: string,
  subject: string,
  text: string,
) {
  return transport!.sendMail({ from, to, subject, text });
}

export async function sendOtpEmail(
  email: string,
  otp: string,
  type: string,
): Promise<void> {
  const from = requireEnv("EMAIL_FROM");
  const subject =
    type === "sign-in" ? "Chem Drill ログインコード" : "Chem Drill 認証コード";
  const text = `あなたの認証コードは ${otp} です。5分以内に入力してください。`;

  if (useResend) {
    await sendViaResend(from, email, subject, text);
  } else {
    await sendViaMailpit(from, email, subject, text);
  }
}
