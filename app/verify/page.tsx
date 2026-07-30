import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="flex-1 bg-background text-foreground flex flex-col items-center justify-center font-sans p-4">
      <div className="terminal-border bg-black/40 p-8 rounded max-w-md w-full flex flex-col gap-6 items-center text-center">
        <div className="w-12 h-12 rounded-full border border-accent/20 bg-accent/5 flex items-center justify-center text-accent">
          <Mail className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-accent text-xs flex items-center justify-center gap-1">
            <span>~/verify</span>
            <span className="live-dot active"></span>
          </div>
          <h2 className="text-2xl font-mono font-bold text-white">$ check-email</h2>
          <p className="text-zinc-400 text-sm">
            We have transmitted a secure magic link email to your terminal. Click the link in the email to authenticate your active session.
          </p>
        </div>

        <div className="border-t border-border-muted pt-4 w-full flex flex-col gap-3">
          <p className="text-[11px] font-mono text-zinc-500">
            Link expires in 24 hours. Check spam folders if missing.
          </p>
          <Link href="/login" className="terminal-btn text-xs">
            $ back-to-login
          </Link>
        </div>
      </div>
    </div>
  );
}
