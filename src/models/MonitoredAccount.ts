import mongoose, { Schema } from "mongoose";

const MonitoredAccountSchema = new Schema({
  userId: {
    type: Number,
    required: true,
    unique: true,
  },
  accountCookie: {
    type: String,
    required: true,
    unique: true,
  },
  banStatus: {
    type: String,
    enum: ["UNBANNED", "BANNED"],
  },
  cookieStatus: {
    type: String,
    enum: ["VALID", "INVALID"],
  },
  addedBy: {
    type: String,
    required: true,
  },
});

export const MonitoredAccountModel = mongoose.model(
  "MonitoredAccounts",
  MonitoredAccountSchema
);
