import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password required");
        }

        const user = await prisma.user.findUnique({
          where: { username: (credentials.username as string).toLowerCase() },
          select: {
            id: true,
            name: true,
            username: true,
            roleId: true,
            password: true,
            status: true,
            deletedAt: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("Username atau password salah");
        }

        // Check soft delete
        if (user.deletedAt) {
          throw new Error("Akun telah dinonaktifkan. Hubungi administrator.");
        }

        // Check status
        if (!user.status) {
          throw new Error("Akun tidak aktif. Hubungi administrator.");
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Username atau password salah");
        }

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          roleId: user.roleId,
        };
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.username = user.username;
        token.roleId = user.roleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.username = token.username as string;
        session.user.roleId = token.roleId as number;
      }
      return session;
    },
  },
});
