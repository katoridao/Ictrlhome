const mongoose = require("mongoose");

const DetectionSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("Detection", DetectionSchema);