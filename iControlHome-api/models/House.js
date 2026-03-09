const mongoose = require("mongoose");

const HouseSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "H001",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Mật khẩu tham gia nhà — member nhập để xin vào nhà
    // Mặc định "123456", OWNER có thể đổi sau
    join_password: {
      type: String,
      default: "123456",
    },

    electricity: {
      price_per_kwh: {
        type: Number,
        default: 0,
        min: 0,
      },
      effective_from: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    collection: "houses",
  },
);

module.exports = mongoose.model("House", HouseSchema);