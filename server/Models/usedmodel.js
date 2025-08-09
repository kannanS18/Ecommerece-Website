const mongoose = require('mongoose');
const usedSchema = new mongoose.Schema({
    registerName: {
        type: String,
        required: true
    },
    registerEmail: {
        type: String,
        required: true,
        unique: true
    },
    registerPassword: {
        type: String,
        required: true
    },
    userName: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    gender: { type: String, default: '' },
    age: { type: Number, default: 0 },
    img: {
    data: Buffer,
    contentType: String
    }
});
module.exports = mongoose.model('User', usedSchema);
mongoose.model.exports=usedSchema;