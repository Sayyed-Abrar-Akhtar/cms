import Link from "next/link";
import connectDB from "@/lib/mongodb";
import { Customer, User } from "@/lib/models";
import { Plus, ChevronRight, UserMinus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await connectDB();

  // Find all customers and enrich with their owners' user profile (email)
  const rawCustomers = await Customer.find({}).sort({ createdAt: -1 });

  const customers = await Promise.all(
    rawCustomers.map(async (cust) => {
      const owner = await User.findById(cust.ownerUserId);
      return {
        id: cust._id.toString(),
        name: cust.name,
        email: owner ? owner.email : "N/A",
        status: cust.status,
        schemaMode: cust.jsonSchema?.$mode || "single",
        createdAt: cust.createdAt.toLocaleDateString(),
      };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-border-muted pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-white">$ customer-records</h1>
          <p className="text-zinc-400 text-sm">
            Manage your client accounts, configure their schema layouts, and handle API authentication keys.
          </p>
        </div>
        <Link href="/admin/customers/new" className="terminal-btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          <span>$ create-customer</span>
        </Link>
      </div>

      {/* Customer List */}
      <div className="terminal-border rounded overflow-hidden">
        <div className="bg-zinc-950/80 p-3 font-mono text-xs border-b border-border-muted grid grid-cols-12 gap-2 text-zinc-500">
          <div className="col-span-4 md:col-span-3">CUSTOMER NAME</div>
          <div className="col-span-4 md:col-span-3">OWNER EMAIL</div>
          <div className="col-span-2 hidden md:block">SCHEMA MODE</div>
          <div className="col-span-2 md:col-span-2">STATUS</div>
          <div className="col-span-2 md:col-span-2 text-right">ACTIONS</div>
        </div>

        {customers.length === 0 ? (
          <div className="p-8 text-center bg-black/20">
            <p className="font-mono text-xs text-zinc-500 italic">No customers registered yet. Create one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-muted bg-black/10">
            {customers.map((c) => (
              <div key={c.id} className="p-4 grid grid-cols-12 gap-2 text-sm items-center hover:bg-zinc-950/40 transition-colors">
                <div className="col-span-4 md:col-span-3 font-mono font-semibold text-white">
                  {c.name}
                </div>
                <div className="col-span-4 md:col-span-3 font-mono text-xs text-zinc-400 truncate">
                  {c.email}
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="font-mono text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-border-muted">
                    {c.schemaMode}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-2 flex items-center gap-1.5">
                  <span className={`live-dot ${c.status === "active" ? "active" : "inactive"}`}></span>
                  <span className="font-mono text-xs capitalize text-zinc-300">{c.status}</span>
                </div>
                <div className="col-span-2 md:col-span-2 text-right">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="terminal-btn py-1 px-2.5 text-xs inline-flex items-center gap-1"
                  >
                    <span>$ configure</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
