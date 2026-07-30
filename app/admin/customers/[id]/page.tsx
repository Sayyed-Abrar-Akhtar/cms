import connectDB from "@/lib/mongodb";
import { Customer, User, ApiKey, CustomerData } from "@/lib/models";
import { notFound } from "next/navigation";
import ClientCustomerConfig from "./ClientCustomerConfig";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  await connectDB();

  const customer = await Customer.findById(id);
  if (!customer) {
    notFound();
  }

  const owner = await User.findById(customer.ownerUserId);
  const keys = await ApiKey.find({ customerId: customer._id }).sort({ createdAt: -1 });
  const rawDataList = await CustomerData.find({ customerId: customer._id }).sort({ updatedAt: -1 });

  const serializedCustomer = {
    id: customer._id.toString(),
    name: customer.name,
    jsonSchema: customer.jsonSchema,
    schemaVersion: customer.schemaVersion,
    status: customer.status,
  };

  const serializedOwner = owner
    ? {
        id: owner._id.toString(),
        email: owner.email,
      }
    : null;

  const serializedKeys = keys.map((k) => ({
    id: k._id.toString(),
    label: k.label || "No label",
    status: k.status,
    createdAt: k.createdAt.toLocaleDateString(),
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toLocaleString() : "Never",
  }));

  const serializedData = rawDataList.map((d) => ({
    id: d._id.toString(),
    schemaVersion: d.schemaVersion,
    data: d.data,
    updatedAt: d.updatedAt.toLocaleString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* File-path styled breadcrumbs */}
      <div className="font-mono text-xs text-zinc-500 flex items-center gap-1.5 border-b border-border-muted pb-4">
        <span className="text-zinc-400">~/admin</span>
        <span>/</span>
        <span className="text-zinc-400">customers</span>
        <span>/</span>
        <span className="text-accent">{customer.name.toLowerCase().replace(/\s+/g, "-")}</span>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-white flex items-center gap-2">
            <span>$ configure --target={customer.name}</span>
            <span className={`live-dot ${customer.status === "active" ? "active" : "inactive"}`}></span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Owner user is registered under email: <code className="text-zinc-200">{owner?.email}</code>
          </p>
        </div>
      </div>

      <ClientCustomerConfig
        customer={serializedCustomer}
        owner={serializedOwner}
        keys={serializedKeys}
        dataList={serializedData}
      />
    </div>
  );
}
