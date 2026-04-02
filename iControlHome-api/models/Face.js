const mongoose = require("mongoose");

const FaceSchema = new mongoose.Schema(
  {
    house_id: {
      type: String,
      default: "H001",
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    // 128-dim face encoding vector (dùng face_recognition)
    // Dùng để so sánh khuôn mặt, tránh 1 người đăng ký 2 tên khác nhau
    encoding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "faces",
  },
);

// Unique theo (house_id, name) - mỗi tên chỉ 1 khuôn mặt
FaceSchema.index({ house_id: 1, name: 1 }, { unique: true });
// Index trên encoding để query nhanh khi so sánh
FaceSchema.index({ house_id: 1, encoding: 1 });

module.exports = mongoose.model("Face", FaceSchema);

