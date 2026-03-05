const mongoose = require("mongoose");

const DeviceUsageSchema = new mongoose.Schema(
  {
    device_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },

    start_time: {
      type: Date,
      required: true,
    },

    end_time: {
      type: Date,
      default: null,
    },
     // số phút hoạt động(tính bằng phút)
    duration_minutes: {
      type: Number,
      default: 0,
    },

    energy_kwh: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "device_usages",
  },
);

module.exports = mongoose.model("DeviceUsage", DeviceUsageSchema);
