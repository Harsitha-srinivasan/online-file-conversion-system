const PDFDocument = require('pdfkit');

// @desc    Generate Invoice PDF
// @route   POST /api/invoices/generate
// @access  Private
exports.generateInvoice = async (req, res) => {
    try {
        const { vendor, client, items, tax, discount, invoiceNumber, date, currency } = req.body;
        const symbol = currency?.symbol || '$';

        if (!vendor || !client || !items) {
            return res.status(400).json({ success: false, error: 'Missing required invoice data' });
        }

        const doc = new PDFDocument({ margin: 50 });

        // Build the PDF
        const filename = `invoice_${invoiceNumber || Date.now()}.pdf`;
        const isView = req.body.format === 'view';

        // Setting response headers
        res.setHeader('Content-disposition', `${isView ? 'inline' : 'attachment'}; filename=${filename}`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Header
        doc.fillColor('#444444')
            .fontSize(20)
            .text(vendor.name || 'INVOICE', 50, 57)
            .fontSize(10)
            .text(vendor.address || '', 50, 80)
            .text(vendor.email || '', 50, 95)
            .text(vendor.phone || '', 50, 110)
            .moveDown();

        // Invoice Info
        doc.fillColor('#444444')
            .fontSize(20)
            .text('Invoice', 50, 160);

        generateHr(doc, 185);

        const customerInformationTop = 200;

        doc.fontSize(10)
            .text('Invoice Number:', 50, customerInformationTop)
            .font('Helvetica-Bold').text(invoiceNumber || 'INV-001', 150, customerInformationTop)
            .font('Helvetica').text('Invoice Date:', 50, customerInformationTop + 15)
            .text(date || new Date().toLocaleDateString(), 150, customerInformationTop + 15)
            .text('Balance Due:', 50, customerInformationTop + 30)
            .font('Helvetica-Bold').text(formatCurrency(calculateTotal(items, tax, discount), symbol), 150, customerInformationTop + 30)

            .font('Helvetica-Bold').text(client.name || 'Customer Name', 300, customerInformationTop)
            .font('Helvetica').text(client.address || '', 300, customerInformationTop + 15)
            .moveDown();

        generateHr(doc, 252);

        // Table Header
        const invoiceTableTop = 330;
        doc.font('Helvetica-Bold');
        generateTableRow(doc, invoiceTableTop, 'Item', 'Quantity', 'Unit Cost', 'Total');
        generateHr(doc, invoiceTableTop + 20);
        doc.font('Helvetica');

        // Table Rows
        let i;
        let position = 0;
        for (i = 0; i < items.length; i++) {
            const item = items[i];
            position = invoiceTableTop + (i + 1) * 30;
            generateTableRow(
                doc,
                position,
                item.description,
                item.quantity,
                formatCurrency(item.unitPrice, symbol),
                formatCurrency(item.quantity * item.unitPrice, symbol)
            );
            generateHr(doc, position + 20);
        }

        const subtotalPosition = position + 30;
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        generateTableRow(doc, subtotalPosition, '', '', 'Subtotal', formatCurrency(subtotal, symbol));

        const taxPosition = subtotalPosition + 20;
        const taxAmount = (subtotal * (tax || 0)) / 100;
        generateTableRow(doc, taxPosition, '', '', `Tax (${tax || 0}%)`, formatCurrency(taxAmount, symbol));

        const discountPosition = taxPosition + 20;
        const discountAmount = discount || 0;
        generateTableRow(doc, discountPosition, '', '', 'Discount', formatCurrency(discountAmount, symbol));

        const totalPosition = discountPosition + 25;
        doc.font('Helvetica-Bold');
        generateTableRow(doc, totalPosition, '', '', 'Total', formatCurrency(subtotal + taxAmount - discountAmount, symbol));
        doc.font('Helvetica');

        // Footer
        doc.fontSize(10)
            .text('Payment is due within 15 days. Thank you for your business.', 50, 700, { align: 'center', width: 500 });

        doc.end();

    } catch (err) {
        console.error('Invoice generation error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function generateTableRow(doc, y, item, quantity, unitCost, total) {
    doc.fontSize(10)
        .text(item, 50, y)
        .text(quantity, 280, y, { width: 90, align: 'right' })
        .text(unitCost, 370, y, { width: 90, align: 'right' })
        .text(total, 0, y, { align: 'right' });
}

function formatCurrency(amount, symbol = '$') {
    return symbol + parseFloat(amount).toFixed(2);
}

function calculateTotal(items, tax, discount) {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (subtotal * (tax || 0)) / 100;
    return subtotal + taxAmount - (discount || 0);
}
