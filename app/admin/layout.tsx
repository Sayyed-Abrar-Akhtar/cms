import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Terminal, LogOut, Users, Settings } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex-1 bg-background text-foreground flex flex-col font-sans">
      {/* Admin Nav */}
      <header className="border-b border-border-muted p-4 md:p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2 font-mono text-accent font-bold text-base md:text-lg">
            <Terminal className="w-5 h-5" />
            <span>~/admin</span>
          </Link>
          <span className="text-zinc-500 font-mono hidden md:inline">|</span>
          <nav className="hidden md:flex items-center gap-4 font-mono text-xs">
            <Link href="/admin" className="text-zinc-300 hover:text-accent flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>customers</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <span className="live-dot active"></span>
            <span>{session.user.email}</span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="terminal-btn py-1.5 px-3 text-xs flex items-center gap-1">
              <LogOut className="w-3 h-3" />
              <span>$ logout</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
