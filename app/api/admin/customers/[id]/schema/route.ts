import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import { Customer } from "@/lib/models";
import { isValidJSONSchema } from "@/lib/validator";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { schema } = await req.json();
    if (!schema || typeof schema !== "object") {
      return NextResponse.json({ message: "Invalid schema payload." }, { status: 400 });
    }

    if (!schema.$mode || (schema.$mode !== "single" && schema.$mode !== "collection")) {
      return NextResponse.json(
        { message: "Schema top-level '$mode' must be either 'single' or 'collection'." },
        { status: 400 }
      );
    }

    // --- CRITICAL SERVER-SIDE SCHEMA VALIDATION ---
    if (!isValidJSONSchema(schema)) {
      return NextResponse.json(
        { message: "The provided payload is not a valid standard JSON Schema definition structure." },
        { status: 400 }
      );
    }

    await connectDB();

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    // Update schema and increment version
    customer.jsonSchema = schema;
    customer.schemaVersion += 1;
    customer.updatedAt = new Date();

    await customer.save();

    return NextResponse.json({
      success: true,
      schemaVersion: customer.schemaVersion,
      message: "Schema updated successfully.",
    });
  } catch (error: any) {
    console.error("Error updating schema:", error);
    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
