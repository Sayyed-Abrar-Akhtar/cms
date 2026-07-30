import mongoose, { Schema, Document, Model } from "mongoose";

// --- Users ---
export interface IUser extends Document {
  email: string;
  role: "admin" | "customer";
  name?: string;
  customerId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ["admin", "customer"], required: true },
  name: { type: String },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
  createdAt: { type: Date, default: Date.now }
});

// --- Customers ---
export interface ICustomer extends Document {
  name: string;
  ownerUserId: mongoose.Types.ObjectId;
  jsonSchema: Record<string, any>;
  schemaVersion: number;
  status: "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jsonSchema: { type: Schema.Types.Mixed, required: true },
  schemaVersion: { type: Number, default: 1 },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// --- ApiKeys ---
export interface IApiKey extends Document {
  customerId: mongoose.Types.ObjectId;
  key: string; // SHA-256 hashed value
  label?: string;
  status: "active" | "revoked";
  lastUsedAt?: Date;
  createdAt: Date;
  revokedAt?: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  key: { type: String, required: true, unique: true, index: true },
  label: { type: String },
  status: { type: String, enum: ["active", "revoked"], default: "active" },
  lastUsedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date }
});

// --- CustomerData ---
export interface ICustomerData extends Document {
  customerId: mongoose.Types.ObjectId;
  schemaVersion: number;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerDataSchema = new Schema<ICustomerData>({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  schemaVersion: { type: Number, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Avoid OverwriteModelError in Next.js Hot Reloading
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
export const ApiKey: Model<IApiKey> = mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
export const CustomerData: Model<ICustomerData> = mongoose.models.CustomerData || mongoose.model<ICustomerData>("CustomerData", CustomerDataSchema);
