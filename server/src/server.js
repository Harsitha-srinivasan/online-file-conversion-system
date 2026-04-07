const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ Database connected successfully');
    } catch (err) {
        console.error('❌ DB connection failed:', err.message);
        process.exit(1);
    }

    const app = express();

    // Middleware
    app.use(express.json());
    app.use(cors());
    app.use(helmet());
    app.use(morgan('dev'));
    app.use('/uploads', express.static('uploads'));

    // Basic route
    app.get('/', (req, res) => {
        res.json({ message: 'Online File Conversion API is running' });
    });

    // Routes
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/files', require('./routes/fileRoutes'));
    app.use('/api/convert', require('./routes/conversionRoutes'));
    app.use('/api/conversion', require('./routes/conversionRoutes'));
    app.use('/api/history', require('./routes/historyRoutes'));
    app.use('/api/admin', require('./routes/adminRoutes'));
    app.use('/api/invoices', require('./routes/invoiceRoutes'));

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
};

startServer();