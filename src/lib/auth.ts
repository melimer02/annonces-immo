import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {
      role: {
        type: ["USER", "AGENT", "ADMIN"],
        defaultValue: "USER",
        input: false,
      },
      statutPro: {
      type: ["AUCUN", "EN_ATTENTE", "VALIDE", "REFUSE"],
      defaultValue: "AUCUN",
      input: false,
  },
    },
  },

socialProviders: {

    google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  },

  plugins: [nextCookies()],
})
console.log("GITHUB :", process.env.GITHUB_CLIENT_ID?.length, process.env.GITHUB_CLIENT_SECRET?.length)