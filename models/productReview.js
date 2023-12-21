const mongoose = require('mongoose');

let productReviewShcema = mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    productReview: [{
        username: {
            type: String,
            required:true
        },
        reviewDate: {
            type: Date,
            required:true
        },
        review: {
            type: String,
            required:true
        }
    }]
})

let productReview = mongoose.model('productReview', productReviewShcema);

module.exports = productReview;