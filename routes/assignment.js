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
const Course = require('../model/course');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

let assignmentId;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const courseId = req.params.course_id;
        const dir = `./cms/${courseId}/question`;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Generating a unique filename with timestamp and removing non-Latin characters and spaces
        const uniqueFilename = assignmentId + '_' + file.originalname.replace(/[^a-zA-Z0-9]/g, '');
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
        console.log("auth successful " + JSON.stringify(decoded));
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

router.post('/question', authMiddleware, async (req, res) => {
    console.log('Request received for /assignment/question route');

    try {
        const teacher = await Teacher.findById(req.user);

        if (!teacher) {
            return res.status(404).json({ msg: 'User not found' });
        }

        assignmentId = uuidv4();
        const course_id = teacher.course_id;
        req.params.course_id = course_id;

        // Upload the single file
        await uploadSingle(req, res);
        let  course= await Course.findById(course_id);
        const permanentStudent = course.permanent_student;

        const tasks = permanentStudent.map(studentId => ({
            student_id: studentId,
            submission_id: '', 
            file_name: '', 
            marks: null, 
            checked: false, 
            submitted:false,
            student_name: '', 
            student_email: '' 
          }));
          
        // Create a new Assignment document
        const newAssignment = new Assignment({
            _id: assignmentId,
            course_id: course_id,
            assignment_name: req.file.originalname,
            assignment_file_name: assignmentId + '_' + req.file.originalname.replace(/[^a-zA-Z0-9]/g, ''),
            tasks:tasks,
        });

        // Save the new Assignment document
        await newAssignment.save();

        // Update the Course document to add the assignment ID
         course = await Course.findOneAndUpdate(
            { _id: course_id },
            { $addToSet: { 'assignments': assignmentId } },
            { new: true }
        );
        console.log(permanentStudent);

        for (const studentId of permanentStudent) {
            await Student.findOneAndUpdate(
                {
                    _id: studentId,
                    'courses.course_id': course_id // Find document with matching course_id and temp_users.student_id
                },
                {
                    $addToSet: { 'courses.$.assignments': assignmentId } // Add assignmentId to the 'assignments' array of the matched course
                },
                {
                    new: true // Return the updated document
                }
            );
        }

        console.log('File uploaded successfully:', req.file.filename);

        res.status(200).json({ msg: 'File uploaded successfully', filename: req.file.filename });

    } catch (err) {
        console.error('Error processing upload:', err.message);
        if (err.message === 'Only PDF files are allowed') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error');
    }
});


router.get('/:courseId', authMiddleware,async (req, res) => {
    const courseId = req.params.courseId;

    try {
        const course = await Course.findOne({ _id: courseId });
        
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        console.log(course);

        const assignments = course.assignments;
        console.log('Assignments:', assignments);

        const formattedAssignments = [];

        for (const assignmentId of assignments) {
            const assignment = await Assignment.findOne({ _id: assignmentId });

            if (!assignment) {
                console.error('Assignment not found:', assignmentId);
                continue; // Skip this assignment and proceed with the next one
            }

            // const tasks = await Task.find({ assignment_id: assignment._id });

            formattedAssignments.push({
                _id: assignment._id,
                assignment_file_name: assignment.assignment_file_name,
                assignment_name: assignment.assignment_name,
                course_id: assignment.course_id,
                tasks: assignment.tasks
            });
        }

        console.log("Assignments sent to teacher");
        res.json({ assignments: formattedAssignments });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ msg: 'Server error' });
    }

});
module.exports = router;
