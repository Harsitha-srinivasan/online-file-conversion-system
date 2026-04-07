const { mergeImagesToPdf, imageToPdf } = require('./src/services/conversionService');
const path = require('path');
const fs = require('fs');

async function test() {
    const inputFiles = [
        path.join(__dirname, 't1.png'),
        path.join(__dirname, 't2.png')
    ];
    const outputFile = path.join(__dirname, 'test_output_images.pdf');

    console.log('Testing mergeImagesToPdf...');
    try {
        await mergeImagesToPdf(inputFiles, outputFile);
        console.log('Successfully created test_output_images.pdf');
    } catch (err) {
        console.error('Error in mergeImagesToPdf:', err.stack || err);
    }

    console.log('Testing imageToPdf...');
    const singleOutputFile = path.join(__dirname, 'test_single_output.pdf');
    try {
        await imageToPdf(inputFiles[0], singleOutputFile);
        console.log('Successfully created test_single_output.pdf');
    } catch (err) {
        console.error('Error in imageToPdf:', err.stack || err);
    }
}

test();
