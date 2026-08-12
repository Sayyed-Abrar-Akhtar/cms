This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication & Environment Variables

This CMS uses Auth.js (NextAuth v5) with a passwordless email (magic link) sign-in strategy. An official `@auth/mongodb-adapter` is utilized to persist verification tokens in the database.

The following environment variables must be configured in `.env.local` for the application to function correctly:

```env
# MongoDB Connection URI
MONGODB_URI="mongodb://127.0.0.1:27017/customer-cms"

# A secure secret used to sign NextAuth sessions and cookies.
# (Generate one using: `openssl rand -hex 32`)
AUTH_SECRET="8f828a55ef88da1e8efee7278297b83c"

# The base URL of the running server.
AUTH_URL="http://localhost:3000"

# Authentication Provider Configuration (Magic.link)
# Set to "console" to bypass Magic link validation and log authentication directly to the terminal for debugging/development.
EMAIL_SERVER="console"

# Your Magic.link Publishable and Secret Keys
# (Set both of these for live Magic link authentication)
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY="pk_live_1234567890"
MAGIC_SECRET_KEY="sk_live_1234567890"

# Comma-separated list of whitelisted admin email addresses.
# Any login from these emails will be automatically upgraded to "admin".
ADMIN_EMAILS="admin@cms.local"

# Pepper for encrypting API Keys
API_KEY_PEPPER="d9f7a78efea123490cf8"
```

### Verifying Authentication Configuration

To verify that the authentication provider is correctly configured:
1. Fire up the development server using `pnpm dev`.
2. Navigate to `http://localhost:3000/login`.
3. Submit your email address.
4. If `EMAIL_SERVER` is configured as `"console"` (or if no Magic secret key is set), check your terminal/server logs for a block that outputs:
   ```text
   ========================================
   CONSOLE BYPASS LOGIN TRIGGERED FOR: <your-email>
   ========================================
   ```
5. If `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` and `MAGIC_SECRET_KEY` are configured and live, you will experience the live Magic.link authentication flow.

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
