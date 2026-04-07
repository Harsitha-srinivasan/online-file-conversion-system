const FileRecord = require('../models/FileRecord');
const ConversionHistory = require('../models/ConversionHistory');
const { convertFileService, convertDirectTextToPdf, mergePdfs, splitPdf } = require('../services/conversionService');
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
const uploadFile = (req, res) => {
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
const getStats = async (req, res) => {
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
const convertFile = async (req, res) => {
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
            convertedFileUrl: `/api/conversion/download/${result.filename}`,
            originalFileName: fileRecord.originalName,
            convertedFileName: result.filename,
            data: historyEntry
        });

    } catch (err) {
        console.error('Conversion error details:', err);
        const status = err.message.includes('Unsupported') ? 400 :
            err.message.includes('LibreOffice') ? 503 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
};

// @desc    Direct Text to PDF conversion
// @route   POST /api/files/txt-to-pdf
// @access  Private
const txtToPdfDirect = async (req, res) => {
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
            convertedFileUrl: `/api/conversion/download/${result.filename}`,
            convertedFileName: result.filename
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get conversion history
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res) => {
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
const downloadFile = async (req, res) => {
    try {
        const idOrName = req.params.id || req.params.filename;
        let filePath;
        let originalName;

        // Try to find in ConversionHistory first by filename
        const history = await ConversionHistory.findOne({ convertedFileName: idOrName });
        if (history) {
            if (history.conversionType === 'PDF to PPT' && !history.isPaid) {
                return res.status(402).json({ success: false, error: 'Payment required for this download' });
            }
            filePath = path.join(__dirname, '../../converted', history.convertedFileName);
            originalName = history.convertedFileName;
        } else {
            // Check if it's a valid ObjectId (workspace file)
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(idOrName)) {
                const fileRecord = await FileRecord.findById(idOrName);
                if (fileRecord) {
                    filePath = fileRecord.path;
                    originalName = fileRecord.originalName;
                }
            }
        }

        if (!filePath) return res.status(404).json({ success: false, error: 'File record not found' });

        if (fs.existsSync(filePath)) {
            res.download(filePath, originalName);
        } else {
            res.status(404).json({ success: false, error: 'File not found on server' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// @desc    Merge multiple PDF files
// @route   POST /api/convert/merge
// @access  Private
const mergeFiles = async (req, res) => {
    try {
        const { fileIds } = req.body;
        if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
            return res.status(400).json({ success: false, error: 'At least two files are required for merging' });
        }

        const files = await FileRecord.find({ _id: { $in: fileIds } });
        if (files.length !== fileIds.length) {
            return res.status(404).json({ success: false, error: 'One or more files not found' });
        }

        // Restore order based on fileIds
        const filesMap = files.reduce((acc, f) => ({ ...acc, [f._id.toString()]: f }), {});
        const orderedFiles = fileIds.map(id => filesMap[id.toString()]).filter(f => !!f);

        // Verify ownership
        for (const file of orderedFiles) {
            if (file.owner && !file.owner.equals(req.user._id)) {
                return res.status(401).json({ success: false, error: 'Not authorized to access one or more files' });
            }
        }

        const inputPaths = orderedFiles.map(f => f.path);
        const outputFilename = `merged-${Date.now()}.pdf`;
        const outputDir = path.join(__dirname, '../../converted');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, outputFilename);

        const result = await mergePdfs(inputPaths, outputPath);

        const historyEntry = await ConversionHistory.create({
            userId: req.user._id,
            originalFileName: orderedFiles.map(f => f.originalName).join(', '),
            convertedFileName: outputFilename,
            conversionType: 'Merge PDFs',
            downloadUrl: `/converted/${outputFilename}`
        });

        res.status(200).json({
            success: true,
            message: 'Files merged successfully',
            convertedFileUrl: `/api/conversion/download/${outputFilename}`,
            data: { ...historyEntry.toObject(), pageCount: result.pageCount }
        });
    } catch (err) {
        console.error('Merge error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Split PDF file
// @route   POST /api/convert/split
// @access  Private
const splitFile = async (req, res) => {
    try {
        const { fileId, startPage, endPage } = req.body;
        if (!fileId || !startPage || !endPage) {
            return res.status(400).json({ success: false, error: 'File ID, start page, and end page are required' });
        }

        const fileRecord = await FileRecord.findById(fileId);
        if (!fileRecord) return res.status(404).json({ success: false, error: 'File not found' });
        if (fileRecord.owner && !fileRecord.owner.equals(req.user._id)) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const outputFilename = `split-${fileRecord.originalName.replace('.pdf', '')}-${startPage}-${endPage}-${Date.now()}.pdf`;
        const outputDir = path.join(__dirname, '../../converted');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, outputFilename);

        await splitPdf(fileRecord.path, outputPath, parseInt(startPage), parseInt(endPage));

        const historyEntry = await ConversionHistory.create({
            userId: req.user._id,
            originalFileName: fileRecord.originalName,
            convertedFileName: outputFilename,
            conversionType: `Split PDF (${startPage}-${endPage})`,
            downloadUrl: `/converted/${outputFilename}`
        });

        res.status(200).json({
            success: true,
            message: 'File split successfully',
            convertedFileUrl: `/api/conversion/download/${outputFilename}`,
            data: historyEntry
        });
    } catch (err) {
        console.error('Split error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Split PDF file (Direct upload)
// @route   POST /api/convert/split-pdf
// @access  Private
const splitPdfDirect = async (req, res) => {
    console.log('splitPdfDirect: Received request');
    upload(req, res, async (err) => {
        if (err) {
            console.error('splitPdfDirect: Upload error:', err);
            return res.status(400).json({ success: false, error: err });
        }
        if (!req.file) {
            console.warn('splitPdfDirect: No file in request');
            return res.status(400).json({ success: false, error: 'No file selected!' });
        }
        console.log('splitPdfDirect: File received:', req.file.originalname);

        try {
            const { splitPoints, ranges } = req.body;
            const outputFilename = `split-${Date.now()}-${req.file.originalname}`;
            const outputDir = path.join(__dirname, '../../converted');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
            const outputPath = path.join(outputDir, outputFilename);

            // Handle SplitPDF.jsx logic
            const points = splitPoints ? (typeof splitPoints === 'string' ? JSON.parse(splitPoints) : splitPoints) : [];
            const rangeArr = ranges ? (typeof ranges === 'string' ? JSON.parse(ranges) : ranges) : [];
            
            // For now, let's use the first range if available, else first split point
            // In a better version, we would loop and return multiple files (perhaps a ZIP)
            let start = 1, end = 1;
            if (rangeArr.length > 0) {
                start = rangeArr[0][0];
                end = rangeArr[0][1];
            } else if (points.length > 0) {
                start = 1;
                end = points[0];
            } else {
                // Default: just split the first page if nothing specified
                start = 1;
                end = 1;
            }

            const splitResult = await splitPdf(req.file.path, outputPath, start, end);

            const result = {
                fileName: outputFilename,
                results: [{ 
                    fileName: outputFilename, 
                    page: start === end ? start : null,
                    range: start !== end ? `${start}-${end}` : null,
                    pageCount: splitResult.pageCount 
                }],
                totalPages: splitResult.totalPages
            };

            await ConversionHistory.create({
                userId: req.user ? req.user._id : null,
                originalFileName: req.file.originalname,
                convertedFileName: outputFilename,
                conversionType: 'Split PDF',
                downloadUrl: `/converted/${outputFilename}`
            });

            res.status(200).json({
                success: true,
                message: 'PDF split successfully',
                data: result
            });
        } catch (err) {
            console.error('Split direct error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });
};

// @desc    Merge PDF files (Direct upload)
// @route   POST /api/convert/merge-pdf
// @access  Private
const mergePdfDirect = async (req, res) => {
    console.log('mergePdfDirect: Received request');
    const uploadMulti = multer({ storage: storage }).array('files', 15);
    uploadMulti(req, res, async (err) => {
        if (err) {
            console.error('mergePdfDirect: Upload error:', err);
            return res.status(400).json({ success: false, error: err });
        }
        if (!req.files || req.files.length < 2) {
            console.warn('mergePdfDirect: Insufficient files:', req.files?.length);
            return res.status(400).json({ success: false, error: 'At least two files required!' });
        }
        console.log('mergePdfDirect: Files received:', req.files.length);

        try {
            const inputPaths = req.files.map(f => f.path);
            const outputFilename = `merged-${Date.now()}.pdf`;
            const outputDir = path.join(__dirname, '../../converted');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
            const outputPath = path.join(outputDir, outputFilename);

            const result = await mergePdfs(inputPaths, outputPath);

            await ConversionHistory.create({
                userId: req.user ? req.user._id : null,
                originalFileName: req.files.map(f => f.originalname).join(', '),
                convertedFileName: outputFilename,
                conversionType: 'Merge PDFs',
                downloadUrl: `/converted/${outputFilename}`
            });

            res.status(200).json({
                success: true,
                message: 'Files merged successfully',
                data: { fileName: outputFilename, pageCount: result.pageCount }
            });
        } catch (err) {
            console.error('Merge direct error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });
};

// @desc    PPT to PDF (Direct upload)
// @route   POST /api/convert/ppt-to-pdf
// @access  Private
const pptToPdfDirect = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, error: err });
        if (!req.file) return res.status(400).json({ success: false, error: 'No file selected!' });

        try {
            const result = await convertFileService(req.file.path, 'pdf');
            
            await ConversionHistory.create({
                userId: req.user ? req.user._id : null,
                originalFileName: req.file.originalname,
                convertedFileName: result.filename,
                conversionType: 'PPT to PDF',
                downloadUrl: `/converted/${result.filename}`
            });

            res.status(200).json({
                success: true,
                message: 'Converted successfully',
                data: { fileName: result.filename, path: result.path }
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
};

// @desc    PDF to PPT (Direct upload)
// @route   POST /api/convert/pdf-to-ppt
// @access  Private
const pdfToPptDirect = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, error: err });
        if (!req.file) return res.status(400).json({ success: false, error: 'No file selected!' });

        try {
            const result = await convertFileService(req.file.path, 'pptx');
            
            const historyEntry = await ConversionHistory.create({
                userId: req.user ? req.user._id : null,
                originalFileName: req.file.originalname,
                convertedFileName: result.filename,
                conversionType: 'PDF to PPT',
                downloadUrl: `/converted/${result.filename}`,
                isPaid: false // PDF to PPT is non-free
            });

            res.status(200).json({
                success: true,
                message: 'Converted successfully. Payment required for download.',
                data: historyEntry
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
};

// @desc    Rename conversion history item
// @route   PATCH /api/history/:id
// @access  Private
const renameHistory = async (req, res) => {
    try {
        const { newName } = req.body;
        if (!newName) {
            return res.status(400).json({ success: false, error: 'New name is required' });
        }

        const history = await ConversionHistory.findById(req.params.id);
        if (!history) {
            return res.status(404).json({ success: false, error: 'History item not found' });
        }

        // Verify ownership
        if (req.user && history.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        history.originalFileName = newName;
        await history.save();

        res.status(200).json({ success: true, data: history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete conversion history item
// @route   DELETE /api/history/:id
// @access  Private
const deleteHistory = async (req, res) => {
    try {
        const history = await ConversionHistory.findById(req.params.id);
        if (!history) {
            return res.status(404).json({ success: false, error: 'History item not found' });
        }

        // Verify ownership
        if (req.user && history.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        await ConversionHistory.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'History item deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Convert multiple images into one PDF or PPTX
// @route   POST /api/files/convert-multiple
// @access  Private
const convertMultiple = async (req, res) => {
    try {
        const { fileIds, targetFormat } = req.body;
        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ success: false, error: 'Please select files' });
        }

        const filesList = await FileRecord.find({ _id: { $in: fileIds }, owner: req.user._id });
        if (filesList.length === 0) return res.status(404).json({ success: false, error: 'Files not found' });

        // Preserve original order from client request
        const filesMap = filesList.reduce((acc, f) => ({ ...acc, [f._id.toString()]: f }), {});
        const orderedFiles = fileIds.map(id => filesMap[id.toString()]).filter(f => !!f);
        
        console.log(`convertMultiple: Found ${orderedFiles.length} files out of ${fileIds.length} requested`);

        const inputPaths = orderedFiles.map(f => f.path);
        const outputDir = path.join(__dirname, '../../converted');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const outputExt = targetFormat === 'pdf' ? 'pdf' : 'pptx';
        const outputFilename = `merged-${Date.now()}.${outputExt}`;
        const outputPath = path.join(outputDir, outputFilename);

        const convService = require('../services/conversionService');

        if (targetFormat === 'pdf') {
            await convService.mergeImagesToPdf(inputPaths, outputPath);
        } else if (targetFormat === 'pptx') {
            await convService.mergeImagesToPptx(inputPaths, outputPath);
        } else {
            return res.status(400).json({ success: false, error: 'Unsupported multi-merge format' });
        }

        // Log to history
        await ConversionHistory.create({
            userId: req.user._id,
            originalFileName: orderedFiles.map(f => f.originalName).join(', '),
            convertedFileName: outputFilename,
            conversionType: `Images to ${targetFormat.toUpperCase()}`,
            downloadUrl: `/converted/${outputFilename}`
        });

        res.status(200).json({ 
            success: true, 
            message: 'Conversion successful!', 
            filename: outputFilename,
            convertedFileUrl: `/api/conversion/download/${outputFilename}`
        });
    } catch (err) {
        console.error('convertMultiple error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Rename Workspace file
// @route   PATCH /api/files/:id
// @access  Private
// @desc    Rename Workspace file
// @route   PATCH /api/files/:id
// @access  Private
const renameFileRecord = async (req, res) => {
    try {
        const { newName } = req.body;
        if (!newName) {
            return res.status(400).json({ success: false, error: 'New name is required' });
        }

        const fileRecord = await FileRecord.findById(req.params.id);
        if (!fileRecord) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        // Verify ownership
        if (req.user && fileRecord.owner && fileRecord.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        fileRecord.originalName = newName;
        await fileRecord.save();

        res.status(200).json({ success: true, data: fileRecord });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete Workspace file
// @route   DELETE /api/files/:id
// @access  Private
// @desc    Delete Workspace file
// @route   DELETE /api/files/:id
// @access  Private
const deleteFileRecord = async (req, res) => {
    console.log(`DELETE /api/files/${req.params.id} request received`);
    try {
        const fileRecord = await FileRecord.findById(req.params.id);
        if (!fileRecord) {
            console.log(`File with ID ${req.params.id} not found in DB`);
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        // Verify ownership
        if (req.user && fileRecord.owner && fileRecord.owner.toString() !== req.user._id.toString()) {
            console.log(`User ${req.user._id} not authorized to delete file ${req.params.id}`);
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        // 1. Delete original file
        if (fs.existsSync(fileRecord.path)) {
            console.log(`Deleting original file: ${fileRecord.path}`);
            fs.unlinkSync(fileRecord.path);
        }

        // 2. Delete converted files
        if (fileRecord.conversions && fileRecord.conversions.length > 0) {
            fileRecord.conversions.forEach(conv => {
                if (fs.existsSync(conv.convertedPath)) {
                    console.log(`Deleting converted file: ${conv.convertedPath}`);
                    fs.unlinkSync(conv.convertedPath);
                }
            });
        }

        // 3. Remove from DB
        await FileRecord.findByIdAndDelete(req.params.id);
        console.log(`File ${req.params.id} successfully deleted from system`);

        res.status(200).json({ success: true, message: 'File and conversions deleted' });
    } catch (err) {
        console.error('deleteFileRecord error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Mock payment for a conversion
// @route   POST /api/history/:id/pay
// @access  Private
const payHistory = async (req, res) => {
    try {
        const history = await ConversionHistory.findById(req.params.id);
        if (!history) return res.status(404).json({ success: false, error: 'History item not found' });

        // Verify ownership
        if (req.user && history.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        history.isPaid = true;
        await history.save();

        res.status(200).json({ success: true, message: 'Payment successful', data: history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { 
    uploadFile,
    getStats,
    convertFile,
    txtToPdfDirect,
    getHistory,
    downloadFile,
    mergeFiles,
    splitFile,
    splitPdfDirect,
    mergePdfDirect,
    pptToPdfDirect,
    pdfToPptDirect,
    renameHistory,
    deleteHistory,
    renameFileRecord,
    deleteFileRecord,
    convertMultiple,
    payHistory
};
