import { Schema, model } from "mongoose";

const visitorSchema = new Schema(
  {
    timezone: {
      type: String,
      default: null,
    },
    language: {
      type: String,
      default: null,
    },
    page: {
      type: String,
      default: null,
    },
    ip_address: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    country_code: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    region: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
    referrer: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Visitor = model("Visitor", visitorSchema, "Visitors");
export default Visitor;
