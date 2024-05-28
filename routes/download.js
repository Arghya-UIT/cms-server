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

router.get('/assignment/:fileName', async (req, res) => {
    const fileName = req.params.fileName;
    const assignment = await Assignment.findOne({ assignment_file_name: fileName });
    if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
    }
    const courseId = assignment.course_id;
    console.log('assignment course id', courseId);
    const filePath = path.join(__dirname, '..', 'cms', courseId, 'question', fileName);

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading the file:', err);
            res.status(500).send('Error downloading the file');
        }
    });
});

router.get('/submission/:course_id/:assignment_id/:file_name', async (req, res) => {
    const courseId = req.params.course_id;
    const assignmentId = req.params.assignment_id;
    const fileName = req.params.file_name;


    console.log('assignment course id', courseId);
    const filePath = path.join(__dirname, '..', 'cms', courseId, assignmentId, fileName);

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading the file:', err);
            res.status(500).send('Error downloading the file');
        }
    });
});


router.put('/update-task/:assignmentId/:taskId', async (req, res) => {
    const { assignmentId, taskId } = req.params;
    const { marks } = req.body;

    try {
        const assignment = await Assignment.findOneAndUpdate(
            { _id: assignmentId, 'tasks.student_id': taskId },
            {
                $set: {
                    'tasks.$.marks': marks,
                    'tasks.$.checked': true,
                }
            },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({ msg: 'Assignment or task not found' });
        }

        res.json(assignment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
