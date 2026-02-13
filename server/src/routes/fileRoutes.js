const express = require('express');
const { uploadFile, getStats, convertFile, downloadFile, txtToPdfDirect } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/upload', protect, uploadFile);
router.post('/convert', protect, convertFile);
router.post('/txt-to-pdf', protect, txtToPdfDirect);
router.get('/download/:id', protect, downloadFile);
router.get('/', protect, getStats);

module.exports = router;
