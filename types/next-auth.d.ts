import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "customer";
      customerId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "admin" | "customer";
    customerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "customer";
    customerId?: string;
  }
}

// Ensure the mongoose models compiled correctly
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      AUTH_SECRET: string;
      EMAIL_SERVER?: string;
      EMAIL_FROM?: string;
      ADMIN_EMAILS?: string;
      NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY?: string;
      MAGIC_SECRET_KEY?: string;
    }
  }
}
