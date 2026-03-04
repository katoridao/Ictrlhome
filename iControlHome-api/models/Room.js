const mongoose = require("mongoose");

const RoomPermissionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    can_view: {
      type: Boolean,
      default: true,
    },
    can_control: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    house_id: {
      type: String,
      default: "H001",
    },
    // Thêm mảng permissions theo phòng
    permissions: [RoomPermissionSchema],
  },
  {
    timestamps: true,
    collection: "rooms",
  }
);

module.exports = mongoose.model("Room", RoomSchema);