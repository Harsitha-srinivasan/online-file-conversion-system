const { imageToPdf } = require('./src/services/conversionService');
const sharp = require('sharp');
const fs = require('fs');

async function test() {
    // create a fake image first
    await sharp({
        create: {
            width: 300,
            height: 200,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
    }).png().toFile('test.png');

    console.log('Created test.png');
    // try to convert
    // well wait, imageToPdf is not exported. Let's use convertFileService.
    const { convertFileService } = require('./src/services/conversionService');
    const res = await convertFileService('test.png', 'pdf');
    console.log('Result:', res);
    
    // Check if it's a valid PDF using pdf-lib
    const { PDFDocument } = require('pdf-lib');
    try {
        const doc = await PDFDocument.load(fs.readFileSync(res.path));
        console.log('PDF loaded successfully, pages:', doc.getPageCount());
    } catch(e) {
        console.error('PDF error:', e.message);
    }
}
test();
