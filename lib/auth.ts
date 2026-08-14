import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

export const auth = betterAuth({
  // Reuse the same Prisma client (with the Neon adapter already wired in)
  // instead of creating a second, separate connection.
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  // nextCookies() makes cookie-setting work correctly when auth actions are
  // called from Server Actions later. Must be the last plugin in the array.
  plugins: [nextCookies()],
});
