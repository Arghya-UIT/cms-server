
const express = require('express')
const app = express()
const cors = require("cors");
const bodyParser = require('body-parser');

const connection = require("./db_connection");
const studentRoure = require('./routes/student');
const teacherRoure = require('./routes/teacher');
const ProfileRoute = require('./routes/profile');
const LoginRoute = require('./routes/login');
const Courses = require('./routes/course');
const CourseDetails = require("./routes/courseDetails");
const AssignmentRoute = require('./routes/assignment');
const DownloadRoute=require('./routes/download');
const UploadRoute=require('./routes/upload');

const port = 3000

connection();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use('/upload', FileUpload);
app.use('/signup/student', studentRoure);
app.use('/signup/teacher', teacherRoure);
app.use('/profile', ProfileRoute);
app.use('/login', LoginRoute);
app.use('/courses', Courses);
app.use('/course-details', CourseDetails);
app.use('/assignment', AssignmentRoute);
app.use('/download', DownloadRoute);
app.use ('/upload',UploadRoute);



app.listen(port, () => {
    console.log(`cms app listening on port ${port}`)
})


