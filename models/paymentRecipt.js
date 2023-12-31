const mongoose = require('mongoose');

let reciptSchema = mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'order'
    },
    razorpay_payment_id: {
        type: String,
        required: true
    },
    razorpay_order_id: {
        type: String,
        required: true
    },
    razorpay_signature: {
        type: String,
        required: true
    }
});

let PaymentRecipt = mongoose.model('paymentRecipt', reciptSchema);

module.exports = PaymentRecipt;