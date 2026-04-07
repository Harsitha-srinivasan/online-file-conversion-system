const { convertFileService } = require('./src/services/conversionService');
const path = require('path');
const fs = require('fs');

async function test() {
    try {
        const inputPath = path.join(__dirname, 'test_invoice.pdf');
        console.log('Converting', inputPath);
        const res = await convertFileService(inputPath, 'pptx');
        console.log('Success:', res);
    } catch (e) {
        fs.writeFileSync('error_log.txt', e.stack, 'utf8');
        console.error('Error written to error_log.txt');
    }
}
test();
