const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const DeviceUsage = require("../models/DeviceUsage");
const ElectricitySetting = require("../models/ElectricitySetting");

// GET /api/statistics
router.get('/', async (req, res) => {
  try {
    const { house_id, period } = req.query; // period: 'DAY', 'WEEK', 'MONTH'
    
    // 1. Lấy danh sách thiết bị trong nhà
    const devices = await Device.find({ house_id: house_id });
    
    // 2. Xác định khoảng thời gian
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'DAY') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'WEEK') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 đầu tuần
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'MONTH') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setHours(0, 0, 0, 0); // Mặc định là hôm nay
    }

    // 3. Lấy giá điện & Dữ liệu sử dụng thực tế
    let setting = await ElectricitySetting.findOne({ house_id });
    const pricePerKwh = setting ? setting.price_per_kwh : 3000;

    const usages = await DeviceUsage.find({
      house_id: house_id,
      start_time: { $gte: startDate }
    });

    // Tổng hợp kWh theo từng thiết bị
    const usageMap = {};
    usages.forEach(u => {
      const did = u.device_id.toString();
      usageMap[did] = (usageMap[did] || 0) + (u.energy_kwh || 0);
    });
    
    let totalKwh = 0;
    let totalCost = 0;

    const deviceStats = devices.map(device => {
      const kwh = usageMap[device._id.toString()] || 0; // Lấy số liệu thực, nếu không có thì là 0
      const cost = Math.round(kwh * pricePerKwh);

      totalKwh += kwh;
      totalCost += cost;

      return {
        name: device.name,
        kwh: kwh,
        cost: cost,
        percent: 0 // Sẽ tính sau
      };
    });

    // 3. Tính phần trăm và sắp xếp
    deviceStats.forEach(d => {
      d.percent = totalKwh > 0 ? Math.round((d.kwh / totalKwh) * 100) : 0;
    });

    // Sắp xếp thiết bị tiêu thụ nhiều nhất lên đầu
    deviceStats.sort((a, b) => b.kwh - a.kwh);

    res.json({
      totalKwh: parseFloat(totalKwh.toFixed(2)),
      totalCost: totalCost,
      devices: deviceStats
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
