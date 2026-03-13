const mongoose = require("mongoose");

const AutomationSchema = new mongoose.Schema({
  device_id: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["ON", "OFF"], required: true },
  trigger_time: { type: String, required: true },
  repeat_type: { 
    type: String, 
    enum: ["ONCE", "DAILY", "WEEKLY"], 
    default: "DAILY" 
  },
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Automation", AutomationSchema);