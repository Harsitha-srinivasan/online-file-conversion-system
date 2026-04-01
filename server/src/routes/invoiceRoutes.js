const express = require('express');
const router = express.Router();
const { generateInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateInvoice);

module.exports = router;
