const FileRecord = require('../models/FileRecord');
const ConversionHistory = require('../models/ConversionHistory');
const { convertFileService, convertDirectTextToPdf } = require('../services/conversionService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('file');

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|md|ppt|pptx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
        return cb(null, true);
    } else {
        cb('Error: Images, Documents and Text files Only!');
    }
}

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, error: err });
        }
        if (req.file == undefined) {
            return res.status(400).json({ success: false, error: 'No file selected!' });
        }
        try {
            const fileRecord = await FileRecord.create({
                originalName: req.file.originalname,
                storedName: req.file.filename,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                owner: req.user ? req.user._id : null,
                conversions: []
            });
            res.status(200).json({ success: true, message: 'File Uploaded!', data: fileRecord });
        } catch (dbErr) {
            return res.status(500).json({ success: false, error: dbErr.message });
        }
    });
};

// @desc    Get All User Files
// @route   GET /api/files
// @access  Private
exports.getStats = async (req, res) => {
    try {
        const files = await FileRecord.find({ owner: req.user._id }).sort({ uploadDate: -1 });
        res.status(200).json({ success: true, count: files.length, data: files });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Convert uploaded file
// @route   POST /api/convert (or /api/files/convert)
// @access  Private
exports.convertFile = async (req, res) => {
    try {
        const { fileId, targetFormat } = req.body;
        const fileRecord = await FileRecord.findById(fileId);

        if (!fileRecord) return res.status(404).json({ success: false, error: 'File not found' });
        if (fileRecord.owner && !fileRecord.owner.equals(req.user._id)) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const result = await convertFileService(fileRecord.path, targetFormat);

        // Update record (Legacy)
        fileRecord.conversions.push({
            targetFormat,
            convertedPath: result.path,
            convertedDate: Date.now()
        });
        await fileRecord.save();

        // Log to history (New)
        const historyEntry = await ConversionHistory.create({
            userId: req.user._id,
            originalFileName: fileRecord.originalName,
            convertedFileName: result.filename,
            conversionType: `${path.extname(fileRecord.originalName).slice(1)} to ${targetFormat}`,
            downloadUrl: `/converted/${result.filename}`
        });

        res.status(200).json({
            success: true,
            message: 'File converted successfully',
            convertedFileUrl: `/converted/${result.filename}`,
            originalFileName: fileRecord.originalName,
            convertedFileName: result.filename,
            data: historyEntry
        });

    } catch (err) {
        console.error('Conversion error:', err);
        const status = err.message.includes('Unsupported') ? 400 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
};

// @desc    Direct Text to PDF conversion
// @route   POST /api/files/txt-to-pdf
// @access  Private
exports.txtToPdfDirect = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, error: 'Text content is required' });

        const outputFilename = `text-conversion-${Date.now()}.pdf`;
        const result = await convertDirectTextToPdf(text, outputFilename);

        await ConversionHistory.create({
            userId: req.user._id,
            originalFileName: "direct-text-input",
            convertedFileName: result.filename,
            conversionType: 'text-input to pdf',
            downloadUrl: `/converted/${result.filename}`
        });

        res.status(200).json({
            success: true,
            convertedFileUrl: `/converted/${result.filename}`,
            convertedFileName: result.filename
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get conversion history
// @route   GET /api/history
// @access  Private
exports.getHistory = async (req, res) => {
    try {
        const history = await ConversionHistory.find({ userId: req.user._id }).sort({ date: -1 });
        res.status(200).json({ success: true, count: history.length, data: history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Download Original File
// @route   GET /api/files/download/:id
// @access  Private
exports.downloadFile = async (req, res) => {
    try {
        const fileRecord = await FileRecord.findById(req.params.id);
        if (!fileRecord) return res.status(404).json({ success: false, error: 'File not found' });
        if (fileRecord.owner && !fileRecord.owner.equals(req.user._id)) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const filePath = fileRecord.path;
        if (fs.existsSync(filePath)) {
            res.download(filePath, fileRecord.originalName);
        } else {
            res.status(404).json({ success: false, error: 'File not found on server' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
