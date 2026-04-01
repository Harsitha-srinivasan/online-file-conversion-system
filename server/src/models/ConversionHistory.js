const mongoose = require('mongoose');

const ConversionHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    convertedFileName: {
        type: String,
        required: true
    },
    conversionType: {
        type: String,
        required: true // e.g., 'pdf-to-txt'
    },
    downloadUrl: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    isPaid: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ConversionHistory', ConversionHistorySchema);
