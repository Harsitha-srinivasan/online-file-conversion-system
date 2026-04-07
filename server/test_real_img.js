const { convertFileService } = require('./src/services/conversionService');
const path = require('path');
const fs = require('fs');

async function test() {
    try {
        const inputPath = 'uploads/file-1771213751410.jpg';
        console.log('Testing conversion of', inputPath);
        
        if (!fs.existsSync(inputPath)) {
            console.error('File does NOT exist at', inputPath);
            return;
        }

        const result = await convertFileService(inputPath, 'pdf');
        console.log('Success:', result);
    } catch (err) {
        console.error('FAILED:', err);
    }
}

test();
