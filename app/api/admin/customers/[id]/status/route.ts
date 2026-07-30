import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import { Customer } from "@/lib/models";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();
    if (status !== "active" && status !== "suspended") {
      return NextResponse.json({ message: "Invalid status state value." }, { status: 400 });
    }

    await connectDB();

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    customer.status = status;
    customer.updatedAt = new Date();
    await customer.save();

    return NextResponse.json({
      success: true,
      status: customer.status,
      message: "Customer status modified successfully.",
    });
  } catch (error: any) {
    console.error("Error updating customer status:", error);
    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
