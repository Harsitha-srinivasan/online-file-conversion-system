const express = require('express');
const { uploadFile, getStats, convertFile, downloadFile, txtToPdfDirect, renameFileRecord, deleteFileRecord, convertMultiple } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/upload', protect, uploadFile);
router.post('/convert', protect, convertFile);
router.post('/convert-multiple', protect, convertMultiple);
router.post('/txt-to-pdf', protect, txtToPdfDirect);
router.get('/download/:id', protect, downloadFile);
router.get('/', protect, getStats);
router.patch('/:id', protect, renameFileRecord);
router.delete('/:id', protect, deleteFileRecord);

module.exports = router;
