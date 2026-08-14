import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Must be NEXT_PUBLIC_-prefixed since this file runs in the browser —
  // same reason `lib/auth.ts`'s BETTER_AUTH_URL doesn't need that prefix
  // (it only ever runs on the server).
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
