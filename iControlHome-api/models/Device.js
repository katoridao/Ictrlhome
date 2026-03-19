const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    can_control: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const DeviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    esp32_id: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    power_watt: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: Boolean,
      default: false, // false = OFF
    },

    // Tổng thời gian/kWh đã tích lũy qua nhiều lần bật/tắt
    total_runtime_seconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_energy_kwh: {
      type: Number,
      default: 0,
      min: 0,
    },

    house_id: {
      type: String,
      ref: "House",
      default: "H001",
      required: true,
    },

    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    permissions: [permissionSchema],
  },
  {
    timestamps: true,
    collection: "devices",
  },
);

module.exports = mongoose.model("Device", DeviceSchema);
