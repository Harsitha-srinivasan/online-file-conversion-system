const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const PDFParser = require('pdf-parse');
const PDFKit = require('pdfkit');
const libre = require('libreoffice-convert');
const util = require('util');

const { Document, Packer, Paragraph, TextRun } = require('docx');

const libreConvert = util.promisify(libre.convert);

/**
 * CONVERSION FUNCTIONS
 */

const convertViaLibre = async (inputPath, outputPath, format) => {
    return new Promise((resolve, reject) => {
        const inputBuf = fs.readFileSync(inputPath);
        libre.convert(inputBuf, `.${format}`, undefined, (err, outputBuf) => {
            if (err) return reject(err);
            fs.writeFileSync(outputPath, outputBuf);
            resolve();
        });
    });
};

/**
 * Best-effort PDF to Word fallback (Text only)
 */
const convertPdfToDocxFallback = async (inputPath, outputPath) => {
    const dataBuffer = fs.readFileSync(inputPath);
    const data = await PDFParser(dataBuffer);

    const doc = new Document({
        sections: [{
            properties: {},
            children: data.text.split('\n').map(line =>
                new Paragraph({
                    children: [new TextRun(line)],
                })
            ),
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
};

const conversionMap = {
    // PDF -> TXT
    'pdf-txt': async (input, output) => {
        const dataBuffer = fs.readFileSync(input);
        const data = await PDFParser(dataBuffer);
        fs.writeFileSync(output, data.text);
    },
    // TXT -> PDF (Standard)
    'txt-pdf': async (input, output) => {
        return new Promise((resolve, reject) => {
            const doc = new PDFKit();
            const stream = fs.createWriteStream(output);
            doc.pipe(stream);
            const content = fs.readFileSync(input, 'utf8');
            doc.text(content);
            doc.end();
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
    },
    // JPG -> PNG / PNG -> JPG
    'jpg-png': (input, output) => sharp(input).toFormat('png').toFile(output),
    'png-jpg': (input, output) => sharp(input).toFormat('jpg').toFile(output),
    'jpeg-png': (input, output) => sharp(input).toFormat('png').toFile(output),

    // PDF -> PNG
    'pdf-png': async (input, output) => {
        try {
            await convertViaLibre(input, output, 'png');
        } catch (err) {
            console.error('LibreOffice PDF-PNG error fallback to instruction:', err);
            throw new Error('PDF to Image requires LibreOffice. Please install it to enable this feature.');
        }
    },
    // PDF -> JPG
    'pdf-jpg': (input, output) => convertViaLibre(input, output, 'jpg'),

    // DOCX / DOC -> PDF
    'docx-pdf': async (input, output) => {
        try {
            await convertViaLibre(input, output, 'pdf');
        } catch (err) {
            throw new Error('Word to PDF requires LibreOffice installed on the server. Please install LibreOffice to enable this conversion.');
        }
    },
    'doc-pdf': (input, output) => convertViaLibre(input, output, 'pdf'),

    // PDF -> DOCX (Word)
    'pdf-docx': async (input, output) => {
        try {
            await convertViaLibre(input, output, 'docx');
        } catch (err) {
            console.warn('LibreOffice failed for PDF-Word, using Text-only fallback.');
            await convertPdfToDocxFallback(input, output);
        }
    },
    // PDF Compression (PDF -> PDF)
    'pdf-compress': async (input, output) => {
        const existingPdfBytes = fs.readFileSync(input);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
        fs.writeFileSync(output, pdfBytes);
    },
};

/**
 * Direct Text to PDF (For PART 4)
 */
const convertDirectTextToPdf = async (text, outputFilename) => {
    const outputDir = path.join(__dirname, '../../converted');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, outputFilename);

    return new Promise((resolve, reject) => {
        const doc = new PDFKit();
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        doc.text(text);
        doc.end();
        stream.on('finish', () => resolve({ path: outputPath, filename: outputFilename }));
        stream.on('error', reject);
    });
};

const convertFileService = async (inputPath, targetFormat) => {
    const outputDir = path.join(__dirname, '../../converted');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = path.basename(inputPath, path.extname(inputPath));
    const inputExt = path.extname(inputPath).toLowerCase().replace('.', '');
    const outputFilename = `${filename}-${Date.now()}.${targetFormat}`;
    const outputPath = path.join(outputDir, outputFilename);

    const conversionKey = `${inputExt}-${targetFormat}`;
    const converter = conversionMap[conversionKey];

    if (!converter) {
        throw new Error(`Unsupported conversion: ${inputExt} to ${targetFormat}`);
    }

    try {
        await converter(inputPath, outputPath);
        return { path: outputPath, filename: outputFilename };
    } catch (err) {
        if (err.message.includes('soffice') || err.message.includes('LibreOffice')) {
            // If it's a Word to PDF request and it failed because of soffice, we should be explicit
            if (targetFormat === 'pdf' && (inputExt === 'docx' || inputExt === 'doc')) {
                throw new Error('Word to PDF conversion failed because LibreOffice is not installed. Please install LibreOffice and add it to your PATH.');
            }
            throw new Error(`System Dependency Missing: ${err.message}`);
        }
        throw err;
    }
};

module.exports = { convertFileService, convertDirectTextToPdf };
