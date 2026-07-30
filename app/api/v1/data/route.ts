import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ApiKey, Customer, CustomerData } from "@/lib/models";
import crypto from "crypto";

// Helper function to hash raw key with PEPPER from environment safely
function hashWithPepper(rawKey: string): string {
  const pepper = process.env.API_KEY_PEPPER || "";
  return crypto
    .createHash("sha256")
    .update(rawKey + pepper)
    .digest("hex");
}

// GET: Fetch customer data using api-key
export async function GET(req: Request) {
  try {
    const apiKeyHeader = req.headers.get("x-api-key");
    if (!apiKeyHeader) {
      return NextResponse.json({ message: "Invalid or missing API key." }, { status: 401 });
    }

    await connectDB();

    // Hash header key safely with PEPPER
    const hashedKey = hashWithPepper(apiKeyHeader);

    const apiKey = await ApiKey.findOne({ key: hashedKey });
    if (!apiKey || apiKey.status !== "active") {
      // Avoid leaking whether a key exists or is revoked: same generic error message
      return NextResponse.json({ message: "Invalid or missing API key." }, { status: 401 });
    }

    const customer = await Customer.findById(apiKey.customerId);
    if (!customer || customer.status === "suspended") {
      return NextResponse.json({ message: "Customer account suspended or inactive." }, { status: 403 });
    }

    // Update lastUsedAt timestamp on API key model
    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    const isCollection = customer.jsonSchema?.$mode === "collection";

    const dataRecords = await CustomerData.find({ customerId: customer._id });

    if (isCollection) {
      // Map and return entries array
      const mapped = dataRecords.map((d) => ({
        id: d._id.toString(),
        schemaVersion: d.schemaVersion,
        data: d.data,
        updatedAt: d.updatedAt,
      }));
      return NextResponse.json(mapped, { status: 200 });
    } else {
      // Single record
      if (dataRecords.length === 0) {
        return NextResponse.json(null, { status: 200 });
      }
      const single = dataRecords[0];
      return NextResponse.json(
        {
          id: single._id.toString(),
          schemaVersion: single.schemaVersion,
          data: single.data,
          updatedAt: single.updatedAt,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("API GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
