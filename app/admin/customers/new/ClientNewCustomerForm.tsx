"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal } from "lucide-react";

export default function ClientNewCustomerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      router.push(`/admin/customers/${data.customerId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-xs text-zinc-400 flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-accent" />
          <span>$ customer_company_name</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Acme Corporation"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          className="terminal-input w-full text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-xs text-zinc-400 flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-accent" />
          <span>$ owner_user_email</span>
        </label>
        <input
          type="email"
          placeholder="client@acme.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="terminal-input w-full text-sm"
        />
      </div>

      {error && (
        <div className="font-mono text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 rounded">
          {`[error] // ${error}`}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="terminal-btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5 mt-2"
      >
        {loading ? "$ provisioning..." : "$ register-and-invite"}
      </button>
    </form>
  );
}
