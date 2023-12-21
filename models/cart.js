const mongoose = require('mongoose');

let cartShcema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'coupon'
    },
    discount: {
        type: Number,
        required: true,
        default:0
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
    }]
});

let Cart = mongoose.model('cart', cartShcema);

module.exports = Cart;