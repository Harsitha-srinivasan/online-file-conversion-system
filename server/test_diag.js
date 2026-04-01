const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const libre = require('libreoffice-convert');

async function testSharp() {
    try {
        console.log('Testing sharp...');
        // Create a dummy 1x1 buffer
        const buffer = await sharp({
            create: {
                width: 1,
                height: 1,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 0.5 }
            }
        }).png().toBuffer();
        console.log('Sharp OK, buffer size:', buffer.length);
    } catch (err) {
        console.error('Sharp FAILED:', err.message);
    }
}

async function testPdfLib() {
    try {
        console.log('Testing pdf-lib...');
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        page.drawText('Test');
        const pdfBytes = await pdfDoc.save();
        console.log('Pdf-lib OK, bytes size:', pdfBytes.length);
    } catch (err) {
        console.error('Pdf-lib FAILED:', err.message);
    }
}

async function testLibre() {
    try {
        console.log('Testing libreoffice-convert...');
        // This will likely fail if soffice is missing
        const input = Buffer.from('test');
        libre.convert(input, '.pdf', undefined, (err, done) => {
            if (err) {
                console.error('LibreOffice FAILED:', err.message);
            } else {
                console.log('LibreOffice OK');
            }
        });
    } catch (err) {
        console.error('LibreOffice FAILED (Sync catch):', err.message);
    }
}

async function run() {
    await testSharp();
    await testPdfLib();
    await testLibre();
}

run();
