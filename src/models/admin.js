import { Schema, model } from "mongoose";

const adminSchema = new Schema(
  {
    admin_name: {
      type: String,
    },
    last_name:{
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    country_code:{
      type: String,
    },
    phone_number:{
      type: Number
    },
    password: {
      type: String,
    },
    role: {
      type: Number,
      enum: [1, 2, 3],
      default: 2,
      description: "1 -> Super Admin, 2 -> Admin, 3 -> Employee",
    },
    profile_image: {
      type: String,
    },
    otp: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Admin = model("Admin", adminSchema, "Admins");
export default Admin;
