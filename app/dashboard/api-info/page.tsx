import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import { Customer, ApiKey } from "@/lib/models";
import { Terminal, Key, Cpu, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApiInfoPage() {
  const session = await auth();
  if (!session?.user || !session.user.customerId) {
    redirect("/login");
  }

  await connectDB();
  const customer = await Customer.findById(session.user.customerId);
  if (!customer) {
    redirect("/login");
  }

  // Fetch the active key label/status for this customer (without leaking the hash/raw key itself)
  const keys = await ApiKey.find({ customerId: customer._id }).sort({ createdAt: -1 });

  const activeKey = keys.find((k) => k.status === "active");

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* File Path Header */}
      <div className="font-mono text-xs text-zinc-500 flex items-center gap-1.5 border-b border-border-muted pb-4">
        <span className="text-zinc-400">~/dashboard</span>
        <span>/</span>
        <span className="text-accent">api-credentials</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-mono font-bold text-white flex items-center gap-1.5">
          <span>$ api-documentation</span>
        </h1>
        <p className="text-zinc-400 text-sm">
          Integrate this headless CMS endpoint with your external website code. All requests require authenticating headers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Credentials Card */}
        <div className="md:col-span-5 terminal-border p-6 bg-black/40 rounded flex flex-col gap-4">
          <h2 className="text-sm font-mono font-bold text-white flex items-center gap-1.5 border-b border-border-muted pb-2">
            <Key className="w-4 h-4 text-accent" />
            <span>Active Keys</span>
          </h2>

          {activeKey ? (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-500">Label:</span>
                <span className="text-white font-semibold">{activeKey.label}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-500">Status:</span>
                <span className="flex items-center gap-1">
                  <span className="live-dot active"></span>
                  <span className="text-accent font-semibold uppercase">ACTIVE</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-500">Created:</span>
                <span className="text-zinc-300">{activeKey.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="mt-3 p-3.5 bg-zinc-950 rounded border border-border-muted">
                <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                  Your raw API key is managed exclusively by the admin developer. Contact them to provision/revoke keys.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-center justify-center py-6 text-center">
              <span className="live-dot revoked"></span>
              <p className="font-mono text-xs text-zinc-500 italic mt-2">
                No active API keys found. Please ask the administrator to generate a key for your website.
              </p>
            </div>
          )}
        </div>

        {/* Integration Docs Card */}
        <div className="md:col-span-7 terminal-border p-6 bg-black/40 rounded flex flex-col gap-4">
          <h2 className="text-sm font-mono font-bold text-white flex items-center gap-1.5 border-b border-border-muted pb-2">
            <Cpu className="w-4 h-4 text-accent" />
            <span>Developer Guide / Integration</span>
          </h2>

          <div className="flex flex-col gap-4 font-mono text-xs">
            <div>
              <p className="text-zinc-400 mb-1.5">// Fetch your current schema data</p>
              <pre className="bg-zinc-950 p-3 rounded text-emerald-400 overflow-x-auto border border-border-muted text-[10px]">
{`curl -X GET \\
  "http://localhost:3000/api/v1/data" \\
  -H "x-api-key: YOUR_API_KEY"`}
              </pre>
            </div>

            <div className="border-t border-border-muted pt-4">
              <p className="text-zinc-400 mb-1.5">// Expected JSON response payload</p>
              <pre className="bg-zinc-950 p-3 rounded text-zinc-300 overflow-x-auto border border-border-muted text-[10px]">
{customer.jsonSchema?.$mode === "collection"
? `[
  {
    "id": "rec_67d283f",
    "data": { ... }
  }
]`
: `{
  "id": "rec_67d283f",
  "data": { ... }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
