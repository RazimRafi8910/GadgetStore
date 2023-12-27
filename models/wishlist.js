const mongoose = require('mongoose');

let wishlistShcema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'product'
        }
    }]
});

let Wishlist = mongoose.model('whishlist', wishlistShcema);

module.exports = Wishlist;