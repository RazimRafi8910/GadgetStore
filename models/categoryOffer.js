const mongoose = require('mongoose');


let categoryOfferSchema = mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'category'
    },
    discount: {
        type: Number,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true
    },
    createDate: {
        type: Date,
        required: true,
        default: Date.now
    }
});

let CategoryOffer = mongoose.model('categoryOffer', categoryOfferSchema);

module.exports = CategoryOffer;