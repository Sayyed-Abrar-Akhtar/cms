import ClientNewCustomerForm from "./ClientNewCustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full py-6">
      <div className="border-b border-border-muted pb-4">
        <h1 className="text-2xl font-mono font-bold text-white">$ create-customer</h1>
        <p className="text-zinc-400 text-sm">
          Register a new client account. This will automatically seed a customer record and send an invitation magic link.
        </p>
      </div>

      <div className="terminal-border bg-black/40 p-6 rounded">
        <ClientNewCustomerForm />
      </div>
    </div>
  );
}
