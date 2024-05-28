const express = require('express');
const Course = require('../model/course');
const Student = require('../model/student');
const Assignment = require('../model/assignment');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const router = express.Router();

// Middleware to check token
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id;
        console.log("successful this" + JSON.stringify(decoded));
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};


router.get('/:id', async (req, res) => {
    console.log('fetching' + req.params.id);
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.status(500).send('Server error');
    }
});
router.post('/:id/buy', authMiddleware, async (req, res) => {
    console.log("Headers:", JSON.stringify(req.headers));
    console.log("Body:", JSON.stringify(req.body));
    const { id } = req.params;
    console.log("Course ID:", id);
    const { transactionCode } = req.body;

    try {
        // Ensure req.user exists and contains the id
        if (!req.user) {
            throw new Error('User not authenticated or missing user id in token');
        }
        const userId = req.user;

        console.log(`Course ID: ${id}, Transaction Code: ${transactionCode}, User ID: ${req.user}`);

        const course = await Course.findByIdAndUpdate(
            id,
            { $push: { temp_users: { student_id: userId, transaction_code: transactionCode } } },

            { new: true, upsert: true }
        );

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Assuming the transaction is successful
        res.json({ message: 'Transaction successful' });
    } catch (err) {
        console.error('Error processing transaction:', err.message);
        res.status(500).send('Server error');
    }
});


router.get('/courseItem/:courseId', authMiddleware, async (req, res) => {
    const { courseId } = req.params;
    const token = req.headers['authorization'];

    try {
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("here ", decoded);
        const studentId = decoded.id;
        console.log(studentId);

        const student = await Student.findOne({ _id: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const assignmentIds = [];
        for (const course of student.courses) {
            if (course.course_id === courseId) {
                assignmentIds.push(...course.assignments);
            }
        }
        console.log("assids ", assignmentIds);
        const assignmentDetails = [];
        for (const iterator of assignmentIds) {
            const assignment = await Assignment.findById(iterator);
            if (!assignment) {
                // return res.status(404).json({ message: 'Assignment not found' });
                continue;
            }
            const studentTask = assignment.tasks.find(task => task.student_id === studentId);
            if (studentTask) {
                assignmentDetails.push({
                    assignmentId: assignment._id,
                    assignmentName: assignment.assignment_name,
                    assignmentFileName: assignment.assignment_file_name,

                    studentId: studentTask.student_id,
                    submissionId: studentTask.submission_id,
                    fileName: studentTask.file_name,
                    marks: studentTask.marks,
                    checked: studentTask.checked,
                    studentName: studentTask.student_name,
                    studentEmail: studentTask.student_email,
                    taskId: studentTask._id

                });
            }
        }
        return res.json({ assignments: assignmentDetails });

    } catch (error) {
        console.error('Error fetching assignments:', error.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;
