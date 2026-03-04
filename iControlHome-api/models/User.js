const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      enum: ["OWNER", "MEMBER"],
      default: "MEMBER",
    },

    settings: {
      theme: {
        type: String,
        enum: ["LIGHT", "DARK"],
        default: "LIGHT",
      },
      language: {
        type: String,
        enum: ["VI", "EN"],
        default: "VI",
      },
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

module.exports = mongoose.model("User", UserSchema);
