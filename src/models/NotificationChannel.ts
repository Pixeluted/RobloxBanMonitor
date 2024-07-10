import mongoose, { Schema } from "mongoose";

const NotificationChannelSchema = new Schema({
  channelId: {
    type: String,
    required: true,
    unique: true,
  },
  guildId: {
    type: String,
    required: true,
  },
});

export const NotificationChannelModel = mongoose.model(
  "NotificationChannels",
  NotificationChannelSchema
);
