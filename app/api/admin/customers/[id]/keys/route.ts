import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import { ApiKey } from "@/lib/models";
import crypto from "crypto";

// Helper function to hash raw key with PEPPER from environment safely
function hashWithPepper(rawKey: string): string {
  const pepper = process.env.API_KEY_PEPPER || "";
  return crypto
    .createHash("sha256")
    .update(rawKey + pepper)
    .digest("hex");
}

// POST: Create a new API Key (returns raw key once)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { label } = await req.json();
    if (!label || typeof label !== "string") {
      return NextResponse.json({ message: "Label is required." }, { status: 400 });
    }

    // Generate random secure API key string
    const rawKey = `tcms_${crypto.randomBytes(32).toString("hex")}`;

    // Hash key with PEPPER safely
    const hashedKey = hashWithPepper(rawKey);

    await connectDB();

    const apiKey = new ApiKey({
      customerId: id,
      key: hashedKey,
      label,
      status: "active",
      createdAt: new Date(),
    });

    await apiKey.save();

    return NextResponse.json({
      success: true,
      rawKey, // Pass to UI EXACTLY ONCE
      keyId: apiKey._id.toString(),
      label: apiKey.label,
    });
  } catch (error: any) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Revoke an API key
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = await req.json();
    if (!keyId) {
      return NextResponse.json({ message: "Key ID is required." }, { status: 400 });
    }

    await connectDB();

    const apiKey = await ApiKey.findById(keyId);
    if (!apiKey) {
      return NextResponse.json({ message: "API key not found." }, { status: 404 });
    }

    apiKey.status = "revoked";
    apiKey.revokedAt = new Date();
    await apiKey.save();

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully.",
    });
  } catch (error: any) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
