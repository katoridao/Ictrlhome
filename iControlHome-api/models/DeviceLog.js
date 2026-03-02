const mongoose = require('mongoose');

const deviceLogSchema = new mongoose.Schema({
  device_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  device_name: String, 
  device_type: String,
  user_name: String,  
  action: { type: String, enum: ['ON', 'OFF'] },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'device_logs' });

module.exports = mongoose.model('DeviceLog', deviceLogSchema);