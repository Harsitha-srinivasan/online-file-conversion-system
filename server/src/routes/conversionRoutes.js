const express = require('express');
const { 
    convertFile, 
    getHistory, 
    mergeFiles, 
    splitFile,
    splitPdfDirect,
    mergePdfDirect,
    pptToPdfDirect,
    pdfToPptDirect,
    downloadFile 
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Standard conversion (JSON-based)
router.post('/', protect, convertFile);
router.post('/merge', protect, mergeFiles);
router.post('/split', protect, splitFile);
router.get('/history', protect, getHistory);

// Direct upload + processing (form-data based)
router.post('/split-pdf', protect, splitPdfDirect);
router.post('/merge-pdf', protect, mergePdfDirect);
router.post('/ppt-to-pdf', protect, pptToPdfDirect);
router.post('/pdf-to-ppt', protect, pdfToPptDirect);

// Download
router.get('/download/:filename', protect, downloadFile);

module.exports = router;