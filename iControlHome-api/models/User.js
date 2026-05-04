const mongoose = require("mongoose");

const notificationSettingsSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    new_member: {
      type: Boolean,
      default: true,
    },
    permission_granted: {
      type: Boolean,
      default: true,
    },
    device_status: {
      type: Boolean,
      default: true,
    },
    device_offline: {
      type: Boolean,
      default: true,
    },
    automation_triggered: {
      type: Boolean,
      default: true,
    },
    camera_detected: {
      type: Boolean,
      default: true,
    },
    consumption_estimate: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      enum: ["OWNER", "MEMBER"],
      default: "MEMBER",
    },

    settings: {
      theme: {
        type: String,
        enum: ["LIGHT", "DARK"],
        default: "LIGHT",
      },
      language: {
        type: String,
        enum: ["VI", "EN"],
        default: "VI",
      },
      notification: {
        type: notificationSettingsSchema,
        default: () => ({}),
      },
    },

    notification_settings: {
      type: notificationSettingsSchema,
      default: undefined,
    },

    fcm_tokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

module.exports = mongoose.model("User", UserSchema);
