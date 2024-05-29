const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fs = require('fs');
const util = require('util');
const Teacher = require('../model/teacher');
const Student = require('../model/student');
const Assignment = require('../model/assignment');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
let submissionId;

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const assignmentId = req.params.assignmentId;

        try {
            // Fetch the assignment to get the courseId
            const assignment = await Assignment.findOne({ _id: assignmentId });
            if (!assignment) {
                return cb(new Error('Assignment not found'));
            }
            const courseId = assignment.course_id;

            const uploadPath = path.join(__dirname, '..', 'cms', courseId, assignmentId);

            // Ensure the directory exists
            fs.mkdir(uploadPath, { recursive: true }, (err) => {
                if (err) return cb(err);
                cb(null, uploadPath);
            });
        } catch (err) {
            return cb(err);
        }
    },
    filename: function (req, file, cb) {
        const uniqueFilename = submissionId + '_' + file.originalname.replace(/[^a-zA-Z0-9]/g, '');
        cb(null, uniqueFilename);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

const uploadSingle = util.promisify(upload.single('file'));

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

router.post('/:assignmentId', authMiddleware, async (req, res) => {
    const assignmentId = req.params.assignmentId;
    const token = req.header('Authorization')?.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const studentId = decoded.id;

        // Fetch the assignment to get the courseId
        const assignment = await Assignment.findOne({ _id: assignmentId });
        if (!assignment) {
            return res.status(404).json({ msg: 'Assignment not found' });
        }
        const courseId = assignment.course_id;

        submissionId = uuidv4();
        const student = await Student.findOne({ _id: studentId });
        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }
        const studentName = student.name;
        const studentEmail = student.email;

        await uploadSingle(req, res);

        // Add the submission details to the assignment
        await Assignment.findOneAndUpdate(
            { _id: assignmentId, 'tasks.student_id': studentId },
            {
                $set: {
                    'tasks.$.submission_id': submissionId,
                    'tasks.$.student_name': studentName,
                    'tasks.$.file_name': submissionId + '_' + req.file.originalname.replace(/[^a-zA-Z0-9]/g, ''),
                    'tasks.$.submitted':true,
                    'tasks.$.student_email': studentEmail,
                }
            },
            { new: true }
        );

        // Add the assignmentId to the student's submitted assignments
        await Student.findOneAndUpdate(
            { _id: studentId, 'courses.course_id': courseId },
            { $addToSet: { 'courses.$.submitted_assignments': assignmentId } },
            { new: true }
        );

        res.status(200).json({ msg: 'File uploaded successfully', filename: req.file.filename });

    } catch (err) {
        console.error('Error processing upload:', err.message);
        if (err.message === 'Only PDF files are allowed') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;
