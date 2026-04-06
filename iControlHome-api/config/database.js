const mongoose = require("mongoose");

const mongoURL = process.env.MONGO_URL;

// connect mongodb
const connect = async () => {
  try {
    if (!mongoURL) {
      throw new Error("Thiếu biến môi trường MONGO_URL");
    }

    await mongoose
      .connect(mongoURL)
      .then(() => {
        console.log("kết nối mongodb thành công");
      })
      .catch((err) => {
        console.log("kết nối thất bại");
      });
  } catch (error) {
    console.log("kết nối thất bại: " + error.message);
  }
};
module.exports = { connect };
