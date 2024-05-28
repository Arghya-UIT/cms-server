require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../model/user'); // Adjust the path based on your project structure
const Student = require('../model/student'); // Adjust the path based on your project structure
const Teacher = require('../model/teacher'); // Adjust the path based on your project structure
const Course = require('../model/course');
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
		console.log("successful " + JSON.stringify(decoded));
		next();
	} catch (err) {
		res.status(401).json({ msg: 'Token is not valid' });
	}
};

router.get('/', async (req, res) => {
	console.log('request come');
	console.log(req.headers);
	const token = req.headers['authorization'];
	console.log(token);

	if (!token) {
		console.log('auth failed');
		return res.status(401).json({ msg: 'No token, authorization denied' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log(decoded);
		const userId = decoded.id;
		console.log(userId);

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ msg: 'User not found' });
		}

		const userType = user.role;

		console.log(userType);
		if (userType === 'student') {
			const student = await Student.findById(userId).select('-__v -password -_id');
			if (student) {
				console.log('send successfully');
				return res.status(200).json(student);
			}
		} else if (userType === 'teacher') {
			const teacher = await Teacher.findById(userId).select('-__v -password -_id');
			if (teacher) {
				console.log('send successfully');
				return res.status(200).json(teacher);
			}
		}
		return res.status(404).json({ msg: 'Profile data not found' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	}
});

router.get('/teacher/course_id/:course_id', authMiddleware, async (req, res) => {
	console.log('request come');
	const token = req.headers['authorization'];
	console.log(token);

	if (!token) {
		console.log('auth failed');
		return res.status(401).json({ msg: 'No token, authorization denied' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log(decoded);
		const teacherId = decoded.id;
		console.log(teacherId);

		const user = await User.findById(teacherId);
		if (!user) {
			return res.status(404).json({ msg: 'User not found' });
		}

		const courseId = req.params.course_id;
		const course = await Course.findById(courseId);
		if (!course) {
			return res.status(404).json({ msg: 'Course not found' }); // Updated error message
		}

		const tempUsers = course.temp_users;
		const studentDetails = [];

		for (const tempUser of tempUsers) {
			const student = await Student.findById(tempUser.student_id);
			if (student) {
				studentDetails.push({
					studentId: student._id,
					name: student.name,
					email: student.email,
					transactionCode: tempUser.transaction_code
				});
			}
		}
		return res.json({ students: studentDetails });

	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	}
});

router.post('/enrollStudent/:student_id', async (req, res) => {
	const studentId = req.params.student_id;
	const token = req.headers['authorization'];

	console.log('Enrolling student with ID:', studentId);


	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log(decoded);
		const teacherId = decoded.id;
		console.log(teacherId);

		const teacher = await Teacher.findOne({ _id: teacherId });
		if (!teacher) {
			return res.status(404).json({ msg: 'User not found' });
		}
		const course_id = teacher.course_id;
		console.log(course_id);

		const { studentId } = req.body;
		console.log(studentId);

		let course = await Course.findOneAndUpdate(
			{
				_id: course_id,
				'temp_users.student_id': studentId // Find document with matching course_id and temp_users.student_id
			},
			{
				$pull: { 'temp_users': { student_id: studentId } }, // Remove student from temp_users
				$addToSet: { 'permanent_student': studentId } // Add student to permanent_student (if not already present)
			},
			{
				new: true // Return the updated document
			}
		);

		if (!course) {
			return res.status(404).json({ error: 'Student not found in temporary users' });
		}

		const updatedStudent = await Student.findOneAndUpdate(
			{ _id: studentId },
			{ $addToSet: { 'courses': { course_id: course_id } } }, // Assuming the field in student collection is named 'courses'
			{ new: true }
		);

		if (!updatedStudent) {
			return res.status(404).json({ error: 'Student not found' });
		}
		res.status(200).json({ msg: 'Student successfully moved to permanent students' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	}


});

router.get('/student-courses', authMiddleware, async (req, res) => {
	console.log('request come');
	const token = req.headers['authorization'];
	console.log(token);

	if (!token) {
		console.log('auth failed');
		return res.status(401).json({ msg: 'No token, authorization denied' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log(decoded);
		const studentId = decoded.id;
		console.log(studentId);

		const student = await Student.findById(studentId);
		if (!student) {
			return res.status(404).json({ msg: 'User not found' });
		}

		const allCourses = [];
		for (let i = 0; i < student.courses.length; i++) {
			allCourses.push(student.courses[i].course_id);
		}
		console.log(allCourses);

		const courseDetails = [];

		for (const courseid of allCourses) {
			const course = await Course.findById(courseid);
			if (course) {
				courseDetails.push({
					courseId: course._id,
					courseName: course.courseName,
					teacherName: course.name
				});
			}
		}

		return res.json({ students: courseDetails });

	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	}
});


module.exports = router;
