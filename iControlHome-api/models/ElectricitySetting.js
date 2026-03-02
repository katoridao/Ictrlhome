const mongoose = require("mongoose");

const ElectricitySettingSchema = new mongoose.Schema(
  {
    house_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
      required: true,
    },
    // Giá điện đơn giá (VNĐ/kWh)
    price_per_kwh: {
      type: Number,
      required: true,
      default: 3000, // Giá mặc định nếu không thiết lập
    },
    effective_from: { type: Date, default: Date.now },
  },
  {
    collection: "electricity_settings",
  }
);

module.exports = mongoose.model("ElectricitySetting", ElectricitySettingSchema);