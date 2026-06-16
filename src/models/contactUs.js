import { Schema, model } from "mongoose";

const contactUsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    telephone_number: {
      type: String,
      required: true,
    },
    object_type: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3, 4, 5],
      description:
        "0 -> Appointment, 1 -> Request info, 2 -> Document assistance, 3 -> Status of practice, 4 -> General request, 5 -> Others",
    },
    status: {
      type: Number,
      default: 0,
      description:
        "0 -> New, 1 -> In Progress, 2 -> Resolved"
    },
    assigned_employee: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    assigned_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    service_of_interest: {
      type: Number,
      default: 0,
    },
    preferred_contact_method: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3],
      description:
        "0 -> Email, 1 -> Phone, 2 -> WhatsApp, 3 -> Visit in person",
    },
    message: {
      type: String,
      required: true,
    },
    is_read: {
      type: Number,
      default: 0,
      enum: [0, 1],
      description: "0 -> Unread, 1 -> Read",
    },
    consent_share_data_for_advertising: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    consent_third_party_promotional: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
     consent_for_contact: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
  },
  { timestamps: true }
);

const ContactUs = model("ContactUs", contactUsSchema, "ContactUs");
export default ContactUs;
