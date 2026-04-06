const mongoose = require("mongoose");

const DetectionSchema = new mongoose.Schema(
  {
    house_id: {
      type: String,
      default: "H001",
      index: true,
    },
    name: {
      type: String,
      default: "Unknown",
    },
    image: {
      type: String, // base64 hoặc url
    },
    status: {
      type: String,
      enum: ["known", "unknown"],
      default: "unknown",
    },
    time: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "detections",
  },
);

module.exports = mongoose.model("Detection", DetectionSchema);
