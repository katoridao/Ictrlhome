const mongoose = require("mongoose");

const HouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Danh sách thành viên trong nhà
    members: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["OWNER", "USER"], default: "USER" },
        joined_at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    collection: "houses",
  }
);

module.exports = mongoose.model("House", HouseSchema);
