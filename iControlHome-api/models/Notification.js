const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  house_id: {
    type: String,
    default: "H001",
    index: true,
  },
  title: String,
  message: String,
  type: {
    type: String,
    enum: ["MEMBER", "PERMISSION", "DEVICE", "AUTOMATION", "CAMERA", "SYSTEM"],
    default: "SYSTEM",
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", NotificationSchema);
