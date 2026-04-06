const mongoose = require("mongoose");

const AutomationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    device_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    house_id: {
      type: String,
      default: "H001",
      trim: true,
    },
    action: { type: String, enum: ["ON", "OFF"], required: true },
    trigger_time: { type: String, required: true },
    repeat_type: {
      type: String,
      enum: ["ONCE", "DAILY", "WEEKLY"],
      default: "DAILY",
    },
    enabled: { type: Boolean, default: true },
    auto_delete_on_trigger: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Automation", AutomationSchema);
