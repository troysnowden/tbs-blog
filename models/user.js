const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isWriter: {
        type: Boolean,
        default: false
    }
})

const User = mongoose.model('User', userSchema);
module.exports = User;