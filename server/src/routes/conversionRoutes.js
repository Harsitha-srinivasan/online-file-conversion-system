const express = require('express');
const { convertFile, getHistory } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, convertFile);
router.get('/history', protect, getHistory);

module.exports = router;
