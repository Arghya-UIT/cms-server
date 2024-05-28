const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  _id: {
    type: String, // Use String type for UUID
    // default: uuidv4, // Generate UUID as default value
  },
  role: {
    type: String,
    required: true,
    default: 'student',
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
}, { collection: 'students', strict: false });


module.exports = mongoose.model('Student', StudentSchema);
