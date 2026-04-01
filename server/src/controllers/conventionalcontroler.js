const conversionService = require('../services/conversionService');
const FileRecord = require('../models/FileRecord');
const path = require('path');
const fs = require('fs');

// @desc    Merge PDF files
// @route   POST /api/conversion/merge-pdf
// @access  Private
const mergePDFs = async (req, res) => {
    try {
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({ 
                error: 'Please upload at least 2 PDF files' 
            });
        }

        const files = req.files;
        const result = await conversionService.mergePDFs(files);

        // Save to history
        await FileRecord.create({
            user: req.user.id,
            originalName: 'merged.pdf',
            convertedName: result.fileName,
            fileSize: fs.statSync(result.outputPath).size,
            conversionType: 'merge-pdf',
            outputPath: result.outputPath,
            metadata: {
                pageCount: result.pageCount,
                sourceFiles: files.map(f => f.originalname)
            }
        });

        res.json({
            success: true,
            message: 'PDFs merged successfully',
            data: result
        });
    } catch (error) {
        console.error('Merge PDF error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Split PDF file
// @route   POST /api/conversion/split-pdf
// @access  Private
const splitPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file' });
        }

        const { splitPoints, ranges } = req.body;
        const file = req.file;

        const result = await conversionService.splitPDF(
            file.path,
            splitPoints ? JSON.parse(splitPoints) : [],
            ranges ? JSON.parse(ranges) : []
        );

        // Save to history
        await FileRecord.create({
            user: req.user.id,
            originalName: file.originalname,
            convertedName: 'split_result.zip', // In production, you'd zip multiple files
            fileSize: fs.statSync(file.path).size,
            conversionType: 'split-pdf',
            outputPath: file.path,
            metadata: {
                totalPages: result.totalPages,
                splitCount: result.results.length
            }
        });

        res.json({
            success: true,
            message: 'PDF split successfully',
            data: result
        });
    } catch (error) {
        console.error('Split PDF error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Convert PPT to PDF
// @route   POST /api/conversion/ppt-to-pdf
// @access  Private
const pptToPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PPT/PPTX file' });
        }

        const file = req.file;
        const result = await conversionService.pptToPdf(file.path);

        // Save to history
        await FileRecord.create({
            user: req.user.id,
            originalName: file.originalname,
            convertedName: result.fileName,
            fileSize: result.fileSize,
            conversionType: 'ppt-to-pdf',
            outputPath: result.outputPath
        });

        res.json({
            success: true,
            message: 'PPT converted to PDF successfully',
            data: result
        });
    } catch (error) {
        console.error('PPT to PDF error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Convert PDF to PPT
// @route   POST /api/conversion/pdf-to-ppt
// @access  Private
const pdfToPpt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file' });
        }

        const file = req.file;
        const result = await conversionService.pdfToPpt(file.path);

        // Save to history
        await FileRecord.create({
            user: req.user.id,
            originalName: file.originalname,
            convertedName: result.fileName,
            fileSize: result.fileSize,
            conversionType: 'pdf-to-ppt',
            outputPath: result.outputPath,
            metadata: {
                pageCount: result.pageCount
            }
        });

        res.json({
            success: true,
            message: 'PDF converted to PPT successfully',
            data: result
        });
    } catch (error) {
        console.error('PDF to PPT error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Download converted file
// @route   GET /api/conversion/download/:filename
// @access  Private
const downloadFile = async (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, '../../converted', filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.download(filepath);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
};

module.exports = {
    mergePDFs,
    splitPDF,
    pptToPdf,
    pdfToPpt,
    downloadFile
};