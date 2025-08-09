const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Admin = require('./Models/AdminManagement'); // Adjust path if needed

async function createSuperAdmin() {
  await mongoose.connect('mongodb://localhost:27017/ecomm'); // Change DB name if needed

  const hash = await bcrypt.hash('Admin', 10);

  await Admin.create({
    username: 'Admin',
    password: hash,
    profile: { name: 'Super Admin', email: 'admin@example.com' },
    isSuperAdmin: true,
    createdAt: new Date()
  });

  console.log('Superadmin created!');
  process.exit();
}

createSuperAdmin();