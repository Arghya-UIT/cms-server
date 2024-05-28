const express = require('express');
const Course = require('../model/course');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({});
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
