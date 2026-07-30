import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClientLoginForm from "./ClientLoginForm";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "admin") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex-1 bg-background text-foreground flex flex-col items-center justify-center font-sans p-4">
      <div className="terminal-border bg-black/40 p-8 rounded max-w-md w-full flex flex-col gap-6 relative">
        <div className="absolute top-2 right-3 font-mono text-[10px] text-zinc-500">
          SYS_SECURE_AUTH
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-accent text-xs flex items-center gap-1">
            <span>~/login</span>
            <span className="live-dot active"></span>
          </div>
          <h2 className="text-2xl font-mono font-bold text-white">$ auth-request</h2>
          <p className="text-zinc-400 text-sm">
            Enter your email to request a magic link. If you are an admin or an registered customer, a login email will be triggered instantly.
          </p>
        </div>

        <ClientLoginForm />
      </div>
    </div>
  );
}
