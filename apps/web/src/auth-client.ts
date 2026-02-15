import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import type { auth } from "../../api/src/infrastructure/auth/auth.js";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  plugins: [
    adminClient(),
    emailOTPClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
