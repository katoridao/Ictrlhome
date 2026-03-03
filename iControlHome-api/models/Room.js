const mongoose = require("mongoose");

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
  },
  {
    timestamps: true,
    collection: "rooms",
  },
);

module.exports = mongoose.model("Room", RoomSchema);
