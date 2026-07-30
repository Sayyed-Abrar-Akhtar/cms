import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import { User, Customer } from "@/lib/models";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createCustomerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Validation error", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email } = result.data;
    const emailLower = email.trim().toLowerCase();

    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ email: emailLower });
    if (user && user.role === "admin") {
      return NextResponse.json(
        { message: "This email address is registered as an Administrator." },
        { status: 400 }
      );
    }

    if (user && user.customerId) {
      return NextResponse.json(
        { message: "A customer account already exists with this email." },
        { status: 400 }
      );
    }

    // Default JSON schema for newly created clients
    const defaultSchema = {
      $mode: "single",
      type: "object",
      properties: {
        fullName: { type: "string", title: "Full Name" },
        bio: { type: "string", title: "Bio", format: "textarea" },
        skills: {
          type: "array",
          title: "Skills",
          items: { type: "string" },
        },
      },
      required: ["fullName"],
    };

    // Create user if not existing
    if (!user) {
      user = new User({
        email: emailLower,
        role: "customer",
        createdAt: new Date(),
      });
    }

    // Create customer profile
    const customer = new Customer({
      name,
      ownerUserId: user._id,
      jsonSchema: defaultSchema,
      schemaVersion: 1,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await customer.save();

    user.customerId = customer._id as any;
    user.role = "customer";
    await user.save();

    return NextResponse.json({
      success: true,
      customerId: customer._id.toString(),
      message: "Customer provisioned successfully.",
    });
  } catch (error: any) {
    console.error("Error provisioning customer:", error);
    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
