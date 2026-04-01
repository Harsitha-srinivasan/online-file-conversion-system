const express = require('express');
const { getHistory, renameHistory, deleteHistory, payHistory } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getHistory);
router.post('/:id/pay', protect, payHistory);
router.patch('/:id', protect, renameHistory);
router.delete('/:id', protect, deleteHistory);

module.exports = router;
