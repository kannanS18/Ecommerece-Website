const mongoose = require('mongoose');
const AdminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String, // Store hashed password!
  profile: {
    name: String,
    email: String,
    avatar: String
  },
  isSuperAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: String },  
  lastLogout: { type: String } 
});
module.exports = mongoose.model('AdminManagement', AdminSchema, 'adminmanagements');