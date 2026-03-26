import NextAuthImport from "next-auth";
import Google from "next-auth/providers/google";
import { findUserByEmail, getAdminEmails, upsertUserFromProfile } from "./lib/users";

const NextAuth = NextAuthImport as unknown as (config: Record<string, unknown>) => {
  handlers: { GET: (req: Request) => Promise<Response>; POST: (req: Request) => Promise<Response> };
  auth: (...args: unknown[]) => Promise<any>;
  signIn: (provider?: string, options?: Record<string, unknown>) => Promise<void>;
  signOut: (options?: Record<string, unknown>) => Promise<void>;
};

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const googleAuthConfigured = Boolean(googleClientId && googleClientSecret && process.env.AUTH_SECRET);

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt"
  },
  providers: googleAuthConfigured
    ? [
        Google({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!
        })
      ]
    : [],
  callbacks: {
    async signIn({ user }: { user: { email?: string | null; name?: string | null; image?: string | null } }) {
      if (!user.email) {
        return false;
      }

      await upsertUserFromProfile({
        email: user.email,
        name: user.name ?? user.email.split("@")[0],
        image: user.image ?? null
      });

      return true;
    },
    async jwt({ token }: { token: Record<string, any> }) {
      if (!token.email) {
        return token;
      }

      const storedUser = await findUserByEmail(token.email);
      const adminEmails = getAdminEmails();
      const isAdmin = adminEmails.includes(token.email.toLowerCase()) || storedUser?.role === "admin";

      token.role = isAdmin ? "admin" : storedUser?.role ?? "member";
      token.team = storedUser?.team ?? null;
      token.isActive = storedUser?.isActive ?? true;
      token.name = storedUser?.name ?? token.name;
      token.picture = storedUser?.image ?? token.picture;

      return token;
    },
    async session({ session, token }: { session: { user?: Record<string, any> }; token: Record<string, any> }) {
      if (session.user) {
        session.user.role = token.role === "admin" ? "admin" : "member";
        session.user.team = typeof token.team === "string" ? token.team : null;
        session.user.isActive = token.isActive !== false;
      }

      return session;
    }
  }
});
