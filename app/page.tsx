import Link from "next/link";
import { Terminal, Code, Cpu, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border-muted p-4 md:p-6 max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-2 font-mono text-accent font-bold text-lg md:text-xl">
          <Terminal className="w-5 h-5" />
          <span>~/cms-terminal</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="terminal-btn text-sm">
            $ login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 md:py-24 flex flex-col gap-12 justify-center">
        <div className="flex flex-col gap-4">
          <div className="font-mono text-accent text-sm md:text-base flex items-center gap-2">
            <span>01 // PROMPT</span>
            <span className="live-dot active"></span>
          </div>
          <h1 className="text-4xl md:text-6xl font-mono tracking-tight font-extrabold text-white">
            Schema-driven headless CMS for devs & clients.
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl font-sans leading-relaxed">
            Define a standard JSON Schema for your customers. Empower them to manage nested portfolios, lists, or docs with auto-generated IDE-grade forms. Serve isolated data with sub-millisecond API response times.
          </p>
        </div>

        {/* Code Snippet Box */}
        <div className="terminal-border bg-black/50 rounded p-4 font-mono text-xs md:text-sm text-zinc-300 relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-border-muted pb-2 mb-3">
            <span className="text-zinc-500">schema-configuration.json</span>
            <span className="text-accent">● Draft 2020-12</span>
          </div>
          <pre className="overflow-x-auto text-emerald-400">
{`{
  "$mode": "single",
  "type": "object",
  "properties": {
    "fullName": { "type": "string", "title": "Full Name" },
    "bio": { "type": "string", "format": "textarea" },
    "skills": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}`}
          </pre>
        </div>

        {/* Features list */}
        <div className="grid md:grid-cols-3 gap-6 pt-6">
          <div className="terminal-border p-6 flex flex-col gap-3 rounded hover:border-accent/40 transition-all">
            <div className="text-accent flex items-center gap-2">
              <Code className="w-5 h-5" />
              <h3 className="font-mono font-bold">02 / Schema Driven</h3>
            </div>
            <p className="text-zinc-400 text-sm">
              Change the schema, instantly update customer form interfaces and backend validations without code deployments.
            </p>
          </div>

          <div className="terminal-border p-6 flex flex-col gap-3 rounded hover:border-accent/40 transition-all">
            <div className="text-accent flex items-center gap-2">
              <Database className="w-5 h-5" />
              <h3 className="font-mono font-bold">03 / Key Secured</h3>
            </div>
            <p className="text-zinc-400 text-sm">
              Protect endpoints using crypto-hashed custom API keys. Fully isolated multi-tenant records.
            </p>
          </div>

          <div className="terminal-border p-6 flex flex-col gap-3 rounded hover:border-accent/40 transition-all">
            <div className="text-accent flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              <h3 className="font-mono font-bold">04 / Magic Links</h3>
            </div>
            <p className="text-zinc-400 text-sm">
              Passwordless secure verification email authentication. Direct login without cognitive password fatigue.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-8 border-t border-border-muted mt-8">
          <Link href="/login" className="terminal-btn-primary text-base w-full sm:w-auto text-center">
            $ get-started --now
          </Link>
          <span className="text-zinc-500 font-mono text-sm">or view details on GitHub</span>
        </div>
      </main>

      <footer className="border-t border-border-muted p-6 text-center text-zinc-600 font-mono text-xs">
        <span>© {new Date().getFullYear()} CMS-TERMINAL // CONSOLE_SESSION_ACTIVE</span>
      </footer>
    </div>
  );
}
