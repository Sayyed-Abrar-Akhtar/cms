import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import { Customer, CustomerData } from "@/lib/models";
import ClientDashboardController from "./ClientDashboardController";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user || !session.user.customerId) {
    redirect("/login");
  }

  await connectDB();
  const customer = await Customer.findById(session.user.customerId);
  if (!customer) {
    redirect("/login");
  }

  const isCollection = customer.jsonSchema?.$mode === "collection";

  // Fetch either the single doc or all entries depending on $mode
  const rawData = await CustomerData.find({ customerId: customer._id });

  const entries = rawData.map((d) => ({
    id: d._id.toString(),
    schemaVersion: d.schemaVersion,
    data: d.data,
    updatedAt: d.updatedAt.toLocaleDateString(),
  }));

  const serializedCustomer = {
    id: customer._id.toString(),
    name: customer.name,
    jsonSchema: customer.jsonSchema,
    schemaVersion: customer.schemaVersion,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* File Path Header */}
      <div className="font-mono text-xs text-zinc-500 flex items-center gap-1.5 border-b border-border-muted pb-4">
        <span className="text-zinc-400">~/dashboard</span>
        <span>/</span>
        <span className="text-accent">content-manager</span>
      </div>

      <ClientDashboardController
        customer={serializedCustomer}
        initialEntries={entries}
        isCollection={isCollection}
      />
    </div>
  );
}
