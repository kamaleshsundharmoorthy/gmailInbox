import mongoose, { Schema, model, models } from "mongoose";

const GmailAccountSchema = new Schema(
  {
    // Temporary browser-profile identifier for this local prototype.
    ownerId: {
      type: String,
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
    },

    googleSub: {
      type: String,
      required: true,
    },

    encryptedRefreshToken: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

GmailAccountSchema.index(
  { ownerId: 1, email: 1 },
  { unique: true },
);

export const GmailAccount =
  models.GmailAccount ||
  model("GmailAccount", GmailAccountSchema);