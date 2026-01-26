const mongoose = require("mongoose");
const mongoURL =
  "mongodb+srv://dha:eoYOvunXimG9jx7a@cluster0.1hnmitv.mongodb.net/iControlHome";

// connect mongodb
const connect = async () => {
  try {
    await mongoose
      .connect(mongoURL)
      .then(() => {
        console.log("kết nối mongodb thành công");
      })
      .catch((err) => {
        console.log("kết nối thất bại");
      });
  } catch (error) {
    console.log("kết nối thất bại" + error);
  }
};
module.exports = { connect };
