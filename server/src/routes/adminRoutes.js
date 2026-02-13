const express = require('express');
const { getSystemStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getSystemStats);

module.exports = router;
