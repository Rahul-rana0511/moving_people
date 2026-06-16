import { Schema, model } from "mongoose";

const contactHistorySchema = new Schema(
  {
    contact_us_id: {
      type: Schema.Types.ObjectId,
      ref: "ContactUs",
      required: true,
    },
    event_type: {
      type: String,
      required: true,
    },
    actor_id: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    data: {
      type: Schema.Types.Mixed,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

const ContactHistory = model("ContactHistory", contactHistorySchema, "ContactHistory");
export default ContactHistory;
