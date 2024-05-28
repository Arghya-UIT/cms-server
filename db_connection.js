// db_connection.js
const mongoose = require('mongoose');

const connectToDatabase = () => {
    mongoose.connect('mongodb://localhost:27017/cms', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => console.log('MongoDB connected successfully'))
        .catch(error => console.error('MongoDB connection error:', error));
};

module.exports = connectToDatabase;
