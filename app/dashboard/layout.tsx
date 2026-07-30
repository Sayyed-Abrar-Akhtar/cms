import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Terminal, LogOut, FileCode, Settings } from "lucide-react";
import connectDB from "@/lib/mongodb";
import { Customer } from "@/lib/models";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "customer" || !session.user.customerId) {
    redirect("/login");
  }

  await connectDB();
  const customer = await Customer.findById(session.user.customerId);
  if (!customer) {
    redirect("/login");
  }

  if (customer.status === "suspended") {
    return (
      <div className="flex-1 bg-background text-foreground flex flex-col items-center justify-center p-6">
        <div className="terminal-border max-w-md w-full p-8 rounded bg-red-500/5 border-red-500/20 flex flex-col gap-4 text-center">
          <h2 className="text-xl font-mono text-red-500 font-bold">$ account-suspended</h2>
          <p className="text-zinc-400 text-sm">
            Your client profile has been administrative locked. Please contact your agency coordinator or support channels to reactivate dashboard access.
          </p>
          <Link href="/login" className="terminal-btn text-xs mt-2">
            $ return-to-login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground flex flex-col font-sans">
      {/* Customer Header */}
      <header className="border-b border-border-muted p-4 md:p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-accent font-bold text-base md:text-lg">
            <Terminal className="w-5 h-5" />
            <span>~/dashboard</span>
          </Link>
          <span className="text-zinc-500 font-mono hidden md:inline">|</span>
          <nav className="hidden md:flex items-center gap-4 font-mono text-xs">
            <Link href="/dashboard" className="text-zinc-300 hover:text-accent flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5" />
              <span>my-content</span>
            </Link>
            <Link href="/dashboard/api-info" className="text-zinc-300 hover:text-accent flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              <span>api-credentials</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <span className="live-dot active"></span>
            <span>{customer.name}</span>
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
