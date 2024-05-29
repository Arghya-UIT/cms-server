const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    _id: {
        type: String, // Use String type for UUID
        // default: uuidv4, // Generate UUID as default value
    },
    assignment_file_name: {
        type: String,
        default: '',
    },
    assignment_name: {
        type: String,
        default: '',
    },
    course_id: {
        type: String,
        default: '',
    },
    tasks: [{
        student_id: {
            type: String,
            required: true,
        },
        submission_id: {
            type: String,
            default: '',
        },
        file_name: {
            type: String,
            default: '',
        },
        marks: {
            type: Number,
            default: null,
        },
        checked: {
            type: Boolean,
            default: false,
        },
        submitted:{
            type:Boolean,
            default:false,
        },
        student_name: {
            type: String,
            default: '',
        },
        student_email: {
            type: String,
            default: '',
        },
    }]



}, { collection: 'assignments', strict: false });


module.exports = mongoose.model('Assignment', AssignmentSchema);
