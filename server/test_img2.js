const { mergeImagesToPdf } = require('./src/services/conversionService');
const sharp = require('sharp');
const fs = require('fs');

async function test() {
    await sharp({ create: { width: 300, height: 200, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } }).png().toFile('t1.png');
    await sharp({ create: { width: 300, height: 200, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } } }).png().toFile('t2.png');

    await mergeImagesToPdf(['t1.png', 't2.png'], 'multi.pdf');
    
    // Check if it's a valid PDF using pdf-lib
    const { PDFDocument } = require('pdf-lib');
    try {
        const doc = await PDFDocument.load(fs.readFileSync('multi.pdf'));
        console.log('PDF loaded successfully, pages:', doc.getPageCount());
    } catch(e) {
        console.error('PDF error:', e.message);
    }
}
test();
