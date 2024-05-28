const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    _id: {
        type: String, // Use String type for UUID
        // default: uuidv4, // Generate UUID as default value
    },
    teacher_id: {
        type: String,
        required: true,
        default: '',
    },
    name: {
        type: String,
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
    demoVideoUrl: {
        type: String,
        default: '',
    }
}, { collection: 'courses', strict: false });


module.exports = mongoose.model('Course', CourseSchema);
