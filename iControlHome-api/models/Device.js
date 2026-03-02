const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    esp32Id: {
      type: String,
      required: true,
    },
    // Công suất tiêu thụ (W)
    power_watt: {
      type: Number,
      default: 0,
    },
    // 0 = OFF, 1 = ON
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    house_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
      required: true,
    },
    // Phân quyền thiết bị (Embedded document)
    permissions: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        can_control: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: true,
    collection: "devices",
  }
);

module.exports = mongoose.model("Device", DeviceSchema);
