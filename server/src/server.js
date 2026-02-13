const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Body parser
app.use(cors()); // Enable CORS
app.use(helmet()); // Set security headers
app.use(morgan('dev')); // Request logging
app.use('/uploads', express.static('uploads'));
app.use('/converted', express.static('converted'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Online File Conversion API is running' });
});

// Routes placeholders
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/convert', require('./routes/conversionRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Server Error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
