import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Rate limit по IP на попытки входа — защита от брутфорса на уровне запросов,
        // независимо от блокировки конкретного аккаунта ниже.
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
          request.headers.get("x-real-ip") ??
          "unknown";
        const { ok } = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
        if (!ok) {
          await logAudit({
            event: "RATE_LIMIT",
            severity: "critical",
            ip,
            actor: parsed.data.email,
            detail: "Превышен лимит попыток входа в админку",
          });
          return null;
        }

        const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
        if (!user) {
          // Постоянное время ответа независимо от существования пользователя —
          // не даём отличить "нет такого email" от "неверный пароль" по таймингу.
          await bcrypt.compare(parsed.data.password, "$2b$12$invalidsaltinvalidsaltinvalidsaltinval");
          await logAudit({
            event: "LOGIN_FAILED",
            severity: "warning",
            ip,
            actor: parsed.data.email,
            detail: "Неизвестный email",
          });
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await logAudit({
            event: "LOGIN_LOCKED",
            severity: "critical",
            ip,
            actor: user.email,
            detail: `Попытка входа в заблокированный аккаунт до ${user.lockedUntil.toISOString()}`,
          });
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          const locked = attempts >= MAX_FAILED_ATTEMPTS;
          await prisma.adminUser.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil: locked ? new Date(Date.now() + LOCK_DURATION_MS) : null,
            },
          });
          await logAudit({
            event: locked ? "LOGIN_LOCKED" : "LOGIN_FAILED",
            severity: locked ? "critical" : "warning",
            ip,
            actor: user.email,
            detail: `Неверный пароль, попытка ${attempts}/${MAX_FAILED_ATTEMPTS}`,
          });
          return null;
        }

        await prisma.adminUser.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        await logAudit({ event: "LOGIN_SUCCESS", ip, actor: user.email });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
