import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb-client";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import Credentials from "next-auth/providers/credentials";
import { Magic as MagicAdmin } from "@magic-sdk/admin";

export const authConfig: NextAuthConfig = {
  adapter: MongoDBAdapter(clientPromise, {
    collections: {
      Users: "users",
      Accounts: "accounts",
      Sessions: "sessions",
      VerificationTokens: "verification_tokens",
    }
  }),
  providers: [
    Credentials({
      name: "Magic.link",
      credentials: {
        didToken: { label: "DID Token", type: "text" },
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        const didToken = credentials?.didToken as string | undefined;
        const email = credentials?.email as string | undefined;

        console.log(`[auth] authorize callback invoked. email: ${email}`);

        const secretKey = process.env.MAGIC_SECRET_KEY;
        const isConsole =
          process.env.EMAIL_SERVER === "console" ||
          secretKey === "console" ||
          !secretKey;

        if (isConsole) {
          console.log(`\n========================================`);
          console.log(`CONSOLE BYPASS LOGIN TRIGGERED FOR: ${email}`);
          console.log(`========================================\n`);
          if (!email) {
            throw new Error("Email is required for console bypass login.");
          }
          return { email: email.toLowerCase().trim() };
        }

        if (!didToken) {
          throw new Error("No Magic DID token provided.");
        }

        try {
          const mAdmin = new MagicAdmin(secretKey);
          await mAdmin.token.validate(didToken);
          const metadata = await mAdmin.users.getMetadataByToken(didToken);

          if (!metadata.email) {
            throw new Error("Failed to retrieve user email from Magic metadata.");
          }

          const resolvedEmail = metadata.email.toLowerCase().trim();
          if (email && email.toLowerCase().trim() !== resolvedEmail) {
            throw new Error("Submitted email does not match authenticated Magic email.");
          }

          console.log(`[auth] Magic DID token successfully validated for: ${resolvedEmail}`);
          return { email: resolvedEmail };
        } catch (error) {
          console.error("[auth] Error in Magic validation:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      console.log(`[auth] jwt callback invoked. trigger: ${trigger}, user: ${JSON.stringify(user)}, token: ${JSON.stringify(token)}`);

      if (user || trigger === "signUp" || trigger === "signIn") {
        await connectDB();
        const emailLower = (user?.email || token.email || "").toLowerCase().trim();

        if (!emailLower) {
          console.error("[auth] jwt callback failed: No email available on user or token object.");
          return token;
        }

        console.log(`[auth] jwt callback processing user with email: ${emailLower}`);

        // Check if user email is in the admin whitelist
        const adminEmails = (process.env.ADMIN_EMAILS || "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);

        let dbUser = await User.findOne({ email: emailLower });

        if (!dbUser) {
          // Determine role
          const role = adminEmails.includes(emailLower) ? "admin" : "customer";
          console.log(`[auth] User ${emailLower} not found in DB. Automatically provisioning new user with role: ${role}`);
          dbUser = await User.create({
            email: emailLower,
            role,
            name: user?.name || undefined,
            createdAt: new Date(),
          });
        } else {
          // If already exists, make sure they get upgraded to admin if they are added to env whitelist
          if (adminEmails.includes(emailLower) && dbUser.role !== "admin") {
            console.log(`[auth] Upgrading existing user ${emailLower} to admin due to whitelist change.`);
            dbUser.role = "admin";
            await dbUser.save();
          }
        }

        token.id = dbUser._id.toString();
        token.role = dbUser.role;
        token.customerId = dbUser.customerId ? dbUser.customerId.toString() : undefined;
        token.email = dbUser.email;

        console.log(`[auth] jwt callback completed. Prepared JWT token: ${JSON.stringify(token)}`);
      }
      return token;
    },
    async session({ session, token }) {
      console.log(`[auth] session callback invoked. token: ${JSON.stringify(token)}, session: ${JSON.stringify(session)}`);
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "customer";
        session.user.customerId = token.customerId as string | undefined;
        session.user.email = token.email as string;
      }
      console.log(`[auth] session callback completed. Final session: ${JSON.stringify(session)}`);
      return session;
    },
  },
  events: {
    async signIn(message) {
      console.log(`[auth] Event signIn: ${JSON.stringify(message)}`);
    },
    async createUser(message) {
      console.log(`[auth] Event createUser: ${JSON.stringify(message)}`);
    },
    async session(message) {
      console.log(`[auth] Event session: ${JSON.stringify(message)}`);
    },
  },
  logger: {
    error(code, ...args) {
      console.error(`[auth-error] code: ${code}`, ...args);
    },
    warn(code, ...args) {
      console.warn(`[auth-warn] code: ${code}`, ...args);
    },
    debug(code, ...args) {
      console.log(`[auth-debug] code: ${code}`, ...args);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
