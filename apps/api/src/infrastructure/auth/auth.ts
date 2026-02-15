import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";
import { requireEnv } from "../../env.js";
import { sendOtpEmail } from "./send-otp-email.js";

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
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail(email, otp, type);
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],
});
