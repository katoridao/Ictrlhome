const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    
    name: {
      type: String,
      required: true,
      trim: true,
    },

    
    house_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "rooms",
  }
);

module.exports = mongoose.model("Room", RoomSchema);
