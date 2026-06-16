import { Schema, model } from "mongoose";

const notesSchema = new Schema(
  {
    contact_us_id: {
      type: Schema.Types.ObjectId,
      ref: "ContactUs",
      required: true,
    },
    employee_id: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    note: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Notes = model("Notes", notesSchema, "Notes");
export default Notes;
