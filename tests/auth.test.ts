import { describe, it, expect, afterAll } from "vitest"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const EMAIL = "test-role@example.com"

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: EMAIL } })
})

describe("rôle non falsifiable", () => {
  it("une inscription qui poste role=ADMIN crée un compte USER", async () => {
    await auth.api.signUpEmail({

      body: { email: EMAIL, name: "Test", password: "motdepasse123", role: "ADMIN" } as never,
    })

    const user = await prisma.user.findUnique({ where: { email: EMAIL } })
    expect(user?.role).toBe("USER")
  })
})