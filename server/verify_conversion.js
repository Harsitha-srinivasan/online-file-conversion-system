const { convertFileService } = require('./src/services/conversionService');
const fs = require('fs');
const path = require('path');

async function verify() {
    const testPdf = path.join(__dirname, 'test_invoice.pdf');
    if (!fs.existsSync(testPdf)) {
        console.error('Test PDF not found at', testPdf);
        process.exit(1);
    }

    console.log('Testing PDF to TXT conversion...');
    try {
        const result = await convertFileService(testPdf, 'txt');
        console.log('SUCCESS: PDF to TXT converted.', result);
        const content = fs.readFileSync(result.path, 'utf8');
        console.log('Content preview:', content.substring(0, 50));
    } catch (err) {
        console.error('FAILURE: PDF to TXT failed:', err);
    }

    console.log('\nTesting PDF to DOCX (Fallback) conversion...');
    try {
        const result = await convertFileService(testPdf, 'docx');
        console.log('SUCCESS: PDF to DOCX converted.', result);
    } catch (err) {
        console.error('FAILURE: PDF to DOCX failed:', err);
    }
}

verify();
