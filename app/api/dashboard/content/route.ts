import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import { Customer, CustomerData } from "@/lib/models";
import { validateAgainstSchema } from "@/lib/validator";

// POST: Upsert or Create Customer Record
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "customer" || !session.user.customerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { data, schemaVersion, entryId } = await req.json();
    if (!data || typeof data !== "object") {
      return NextResponse.json({ message: "Data payload is required." }, { status: 400 });
    }

    await connectDB();

    const customer = await Customer.findById(session.user.customerId);
    if (!customer) {
      return NextResponse.json({ message: "Customer profile not found." }, { status: 404 });
    }

    if (customer.status === "suspended") {
      return NextResponse.json({ message: "Customer account suspended." }, { status: 403 });
    }

    // --- CRITICAL SERVER-SIDE VALIDATION INITIATED ---
    const validationErrors = validateAgainstSchema(customer.jsonSchema, data);
    if (validationErrors) {
      return NextResponse.json(
        { message: "Validation error against JSON Schema layout.", errors: validationErrors },
        { status: 422 }
      );
    }

    const isCollection = customer.jsonSchema?.$mode === "collection";

    let customerDataRecord;

    if (isCollection) {
      if (entryId) {
        // Edit existing collection item
        customerDataRecord = await CustomerData.findOne({
          _id: entryId,
          customerId: customer._id,
        });

        if (!customerDataRecord) {
          return NextResponse.json({ message: "Record not found." }, { status: 404 });
        }

        customerDataRecord.data = data;
        customerDataRecord.schemaVersion = schemaVersion || customer.schemaVersion;
        customerDataRecord.updatedAt = new Date();
        await customerDataRecord.save();
      } else {
        // Add new collection item
        customerDataRecord = new CustomerData({
          customerId: customer._id,
          schemaVersion: schemaVersion || customer.schemaVersion,
          data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await customerDataRecord.save();
      }
    } else {
      // Single mode: Find existing, or create first one
      customerDataRecord = await CustomerData.findOne({ customerId: customer._id });

      if (customerDataRecord) {
        customerDataRecord.data = data;
        customerDataRecord.schemaVersion = schemaVersion || customer.schemaVersion;
        customerDataRecord.updatedAt = new Date();
        await customerDataRecord.save();
      } else {
        customerDataRecord = new CustomerData({
          customerId: customer._id,
          schemaVersion: schemaVersion || customer.schemaVersion,
          data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await customerDataRecord.save();
      }
    }

    return NextResponse.json({
      success: true,
      entryId: customerDataRecord._id.toString(),
      message: "Data persisted successfully.",
    });
  } catch (error: any) {
    console.error("Error upserting content data:", error);
    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a collection record
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "customer" || !session.user.customerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { entryId } = await req.json();
    if (!entryId) {
      return NextResponse.json({ message: "Entry ID is required." }, { status: 400 });
    }

    await connectDB();

    const result = await CustomerData.deleteOne({
      _id: entryId,
      customerId: session.user.customerId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Record not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Record removed successfully.",
    });
  } catch (error: any) {
    console.error("Error deleting content data:", error);
    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
