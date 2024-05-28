const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
    _id: {
        type: String, // Use String type for UUID
        // default: uuidv4, // Generate UUID as default value
    },
    role: {
        type: String,
        required: true,
        default: 'teacher',
    },
    name: {
        type: String,
        required: true,
        default: '',
    },
    email: {
        type: String,
        required: true,
        unique: true,
        default: '',
    },
    dob: {
        type: Date,
        required: true,
        default: '',
    },
    address: {
        type: String,
        required: true,
        default: '',
    },
    password: {
        type: String,
        required: true,
        default: '',
    },
    qualification: {
        type: String,
        default: '',
    },
    courseName: {
        type: String,
        default: '',
    },
    courseDescription: {
        type: String,
        default: '',
    },
    coursePrice: {
        type: String,
        default: '',
    },
    upiId: {
        type: String,
        default: '',
    },
    course_id: {
        type: String,
        required: true,
        default: '',
    },
    demoVideoUrl: {
        type: String,
        default: '',
    }
}, { collection: 'teachers', strict: false });

module.exports = mongoose.model('Teacher', TeacherSchema);
