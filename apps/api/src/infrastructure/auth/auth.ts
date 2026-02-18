import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP } from "better-auth/plugins";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { requireEnv } from "../../env.ts";
import { sendOtpEmail } from "./send-otp-email.ts";

export const auth = betterAuth({
  secret: requireEnv("BETTER_AUTH_SECRET"),
  baseURL: requireEnv("BETTER_AUTH_URL"),
  trustedOrigins: [process.env.CORS_ORIGIN ?? "http://localhost:5173"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        unique: true,
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    admin(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail(email, otp, type);
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],
});
