const mongoose = require('mongoose');

let couponShcema = mongoose.Schema({
    couponName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    expriyDate: {
        type: Date,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default:Date.now
    }
});

let Coupon = mongoose.model('coupon', couponShcema);

module.exports = Coupon;