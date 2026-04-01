const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const testPDF = () => {
    try {
        const doc = new PDFDocument({ margin: 50 });
        const filePath = path.join(__dirname, 'test_invoice.pdf');
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(20).text('Test Invoice', 50, 50);
        doc.end();

        stream.on('finish', () => {
            console.log('PDF generated successfully at:', filePath);
            process.exit(0);
        });
    } catch (err) {
        console.error('PDF generation failed:', err);
        process.exit(1);
    }
};

testPDF();
