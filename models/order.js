const mongoose = require('mongoose');

let orderShcema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    invoiceId: {
        type: String,
        required: true
    },
    orderAddress: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'address'
    },
    orderStatus: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'product'
        },
        quantity: {
            type: Number,
            required: true
        },
    }],
    orderDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    deleveredDate: {
        type: Date
    }
});


let Order = mongoose.model('order', orderShcema);

module.exports = Order;

