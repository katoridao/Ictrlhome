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
    // 0 = OFF, 1 = ON
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "devices",
  }
);

module.exports = mongoose.model("Device", DeviceSchema);
