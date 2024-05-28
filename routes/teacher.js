require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Course = require('../model/course')
const Teacher = require('../model/teacher');
const User = require('../model/user');

const router = express.Router();

function generateCourseId(teacherName, teacherId) {
    const sanitizedName = teacherName.replace(/[^a-zA-Z0-9 ]/g, "");
    const abbreviatedName = sanitizedName.charAt(0).toUpperCase() + sanitizedName.split(" ").pop().toUpperCase();
    return `${teacherId}_${abbreviatedName}`;
}

// Signup route with file upload
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('dob').notEmpty().withMessage('Date of birth is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('qualification').notEmpty().withMessage('Qualification is required'),
    body('courseName').notEmpty().withMessage('Course name is required'),
    body('courseDescription').notEmpty().withMessage('Course description is required'),
    body('coursePrice').notEmpty().withMessage('Course price is required'),
    body('upiId').notEmpty().withMessage('Upi Id is required'),
    body('demoVideoUrl').notEmpty().withMessage('Demo video URL is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, dob, address, password, qualification, courseName, courseDescription, coursePrice, upiId, demoVideoUrl } = req.body;

    try {
        // Check if teacher already exists
        let existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ error: 'teacher_already_exists', msg: 'Teacher already exists' });
        }

        const teacherId = uuidv4(); // Generate UUID
        const courseId = generateCourseId(name, teacherId);
        // Create password hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save teacher to database
        const newTeacher = new Teacher({
            _id: teacherId,
            name,
            email,
            dob,
            address,
            password: hashedPassword,
            qualification,
            courseName,
            courseDescription,
            coursePrice,
            upiId,
            course_id: courseId,
            demoVideoUrl
        });
        const newUser = new User({

            _id: teacherId,
            role: 'teacher',
            email,
            password: hashedPassword,
        });
        const newCourse = new Course({
            _id: courseId,
            teacher_id: teacherId,
            name,
            qualification,
            courseName,
            courseDescription,
            coursePrice,
            upiId,
            demoVideoUrl
        });

        await newTeacher.save();
        await newUser.save();
        await newCourse.save();


        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        // Send the response with the token and user info
        res.status(201).json({
            msg: 'Teacher registered successfully',
            token,
            user: { id: newUser._id, email: newUser.email, role: newUser.role }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
