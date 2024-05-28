const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    _id: {
        type: String, // Use String type for UUID
        // default: uuidv4, // Generate UUID as default value
    },
    role: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },
}, { collection: 'user' });


module.exports = mongoose.model('User', UserSchema);
