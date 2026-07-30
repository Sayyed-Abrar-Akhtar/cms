"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Terminal } from "lucide-react";

export default function ClientLoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await signIn("email", {
        email: email.trim().toLowerCase(),
        redirect: false,
        callbackUrl: "/",
      });

      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred during authentication request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-xs text-zinc-400 flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-accent" />
          <span>$ email_address</span>
        </label>
        <input
          type="email"
          name="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || success}
          className="terminal-input w-full text-sm"
        />
      </div>

      {error && (
        <div className="font-mono text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {`[error] // ${error}`}
        </div>
      )}

      {success ? (
        <div className="font-mono text-xs text-accent bg-accent/10 border border-accent/20 p-3 rounded">
          {`[success] // Verification email dispatched! Please check your mailbox for the magic sign-in link.`}
        </div>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="terminal-btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
        >
          {loading ? "$ transmitting..." : "$ send-magic-link"}
        </button>
      )}
    </form>
  );
}
