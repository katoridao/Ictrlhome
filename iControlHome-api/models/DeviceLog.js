const mongoose = require("mongoose");

const DeviceLogSchema = new mongoose.Schema(
  {
    device_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    action: {
      type: String,
      enum: ["ON", "OFF"],
      required: true,
    },

    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "device_logs",
  },
);

module.exports = mongoose.model("DeviceLog", DeviceLogSchema);
