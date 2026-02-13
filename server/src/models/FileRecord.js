const mongoose = require('mongoose');

const FileRecordSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true
    },
    storedName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Can be null for guest uploads (if we support that) or enforce auth
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    path: {
        type: String,
        required: true
    },
    conversions: [{
        targetFormat: String,
        convertedPath: String,
        convertedDate: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.model('FileRecord', FileRecordSchema);
