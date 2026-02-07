const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  device_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  device_name: String, 
  device_type: String,
  user_name: String,  
  action: { type: String, enum: ['ON', 'OFF'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', historySchema);
