import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb-client";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import nodemailer from "nodemailer";

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
    {
      id: "email",
      type: "email",
      name: "Email",
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM || "noreply@cms.local",
      maxAge: 24 * 60 * 60, // 24 hours
      async sendVerificationRequest({ identifier: email, url, provider }) {
        console.log(`[auth] sendVerificationRequest invoked for: ${email}`);

        // If EMAIL_SERVER is not set or equals "console", just log it
        if (!process.env.EMAIL_SERVER || process.env.EMAIL_SERVER === "console") {
          console.log(`\n========================================`);
          console.log(`MAGIC LINK SENT TO: ${email}`);
          console.log(`URL: ${url}`);
          console.log(`========================================\n`);
          return;
        }

        try {
          const transport = nodemailer.createTransport(provider.server);
          const { host } = new URL(url);
          const result = await transport.sendMail({
            to: email,
            from: provider.from,
            subject: `Sign in to CMS Terminal (${host})`,
            text: `Sign in to your account by clicking this link:\n\n${url}\n\n`,
            html: `
              <div style="background-color: #0a0a0a; color: #ededed; font-family: monospace; padding: 24px; border: 1px solid rgba(255,255,255,0.1); max-width: 600px; margin: auto;">
                <h2 style="color: #22c55e;">$ cat magic-link.txt</h2>
                <p>You requested a magic link login to CMS Terminal.</p>
                <p style="margin: 24px 0;">
                  <a href="${url}" style="background-color: #22c55e; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">
                    $ login-now --url
                  </a>
                </p>
                <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
                <p style="font-size: 12px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
              </div>
            `,
          });
          const failed = result.rejected.concat(result.pending).filter(Boolean);
          if (failed.length) {
            throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
          }
          console.log(`[auth] Email successfully sent to ${email}`);
        } catch (error) {
          console.error(`[auth] Error in sendVerificationRequest for ${email}:`, error);
          throw error;
        }
      },
    },
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
