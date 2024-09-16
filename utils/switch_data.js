const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const switchDetails = [
    {
        title: 'Switch - M/H',
        id: 'switch_1',
        description: `Tactile with subtle bump `,
        price:549,
        image: 'https://snipboard.io/p35B8a.jpg',
    },
    {
        title: 'Switch - U/B',
        id: 'switch_2',
        description: `smoother keystrokes and increased durability.`,
        price:459,
        image: 'b-16',
    },
    {
        title: 'Switch - B/H',
        id: 'switch_3',
        description: ` ultimate typing and gaming performance.`,
        price:477,
        image: 'b-16',
    },
    {
        title: 'Switch - O/V',
        id: 'switch_4',
        description: `typing and gaming performance.`,
        price:495,
        image: 'b-16',
    },
    {
        title: 'Switch - 25 Amp',
        id: 'switch_5',
        description: ` typing and gaming performance.`,
        price:1215,
        image: 'b-16',
    },
    {
        title: 'Switch - 32 Amp',
        id: 'switch_6',
        description: ` typing and gaming performance.`,
        price:1215,
        image: 'b-16',
    },
];

const fetchSelectedSwitch = async (selected_switch) => {
    const switchDetail = switchDetails.find((switchDetail) => switchDetail.id === selected_switch);
    return switchDetail;
};
const generatePDFInvoice = async ({ order_details, file_path, recipientName, finalBill }) => {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(`./invoice_${recipientName}.pdf`));

    // Add header image
    const switchImage = await fs.promises.readFile(path.join(__dirname, 'switch_image.png'));
    doc.image(switchImage, 100, 50, { width: 200 });

    // Add header text below the image
    doc.fontSize(24).text('Brown Switches Invoice', 100, 250);

    // Add customer details
    doc.fontSize(18).text(`Customer Name: ${recipientName}`, 100, 280);
    doc.text(`Order Date: ${new Date().toLocaleDateString()}`, 100, 310);

    // Add items table
    doc.fontSize(14).text(order_details, 100, 340);

    // Add GST breakdown
    doc.fontSize(12).text("Breakdown:", 100, 490);
    doc.text(`Subtotal: ₹${finalBill.finalBill.total.toFixed(2)}`, 100, 520);
    doc.text(`GST (18%): ₹${finalBill.gstAmount.toFixed(2)}`, 100, 550);
    doc.text(`Total: ₹${finalBill.totalWithGst.toFixed(2)}`, 100, 580);

    // Add footer
    doc.fontSize(12).text('Thank you for shopping with Hansabhen Switches!', 100, 610);

    doc.end();
};
module.exports.generatePDFInvoice = generatePDFInvoice;
module.exports.fetchSelectedSwitch = fetchSelectedSwitch;
module.exports.switchDetails = switchDetails;
