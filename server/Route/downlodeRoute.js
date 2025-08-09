// routes/order.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Order = require('../Models/Ordermodel'); // adjust path

router.get('/bill/:orderId/download', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).lean();

    if (!order) return res.status(404).send('Order not found');

    const doc = new PDFDocument();
    res.setHeader('Content-disposition', `attachment; filename=bill_${order._id}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).text('🧾 Order Bill', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);

    doc.text(`Order ID: ${order._id}`);
    doc.text(`Name: ${order.registerName}`);
    doc.text(`Email: ${order.registerEmail}`);
    doc.text(`Phone: ${order.phone}`);
    doc.text(`Address: ${order.address}`);
    doc.text(`Order Type: ${order.type}`);
    if (order.type === 'dine in') {
      doc.text(`Dine-In Date: ${order.dineInDate}`);
      doc.text(`Dine-In Time: ${order.dineInTime}`);
    }
    else if (order.type === 'take away') {
        doc.text(`Estimate Pick-Up Time: ${(new Date(order.estimatedTime)).toLocaleTimeString()}`);
    }
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Order Time: ${new Date(order.createdAt).toLocaleTimeString()}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Message: ${order.msg}`);
    doc.moveDown();

    doc.text('Items:', { underline: true });
    order.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.name} x ${item.quantity} = ₹${item.price * item.quantity} (Rate: ₹${item.price})`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: ₹${order.total}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).send('Failed to generate bill PDF');
  }
});

module.exports = router;
