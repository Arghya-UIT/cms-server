require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Student = require('../model/student');
const User = require('../model/user');

const router = express.Router();

// Signup route
router.post('/', [

    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('dob').notEmpty().withMessage('Date of birth is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
    console.log(res);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, dob, address, password } = req.body;

    try {
        // Check if student already exists
        let exittingstudent = await Student.findOne({ email });
        if (exittingstudent) {
            return res.status(400).json({ error: 'student_already_exists', msg: 'Student already exists' });
        }

        const studentId = uuidv4(); // Generate UUID
        // cteae password hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save student to database
        const newstudent = new Student({
            _id: studentId,
            name,
            email,
            dob,
            address,
            password: hashedPassword,
        });
        const newUser = new User({
            _id: studentId,
            role: 'student',
            email,
            password: hashedPassword,
        })

        await newstudent.save();
        await newUser.save();

        // generate jwt token and send
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        // Send the response with the token and user info
        res.status(201).json({
            msg: 'student registered successfully',
            token,
            user: { id: newUser._id, email: newUser.email, role :newUser.role }

        });
        console.log(User);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
