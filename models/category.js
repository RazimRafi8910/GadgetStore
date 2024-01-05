const mongoose = require('mongoose');

let categoryShcema = mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },
    haveOffer: {
        type: Boolean,
        required: true,
        default: false
    }
});

let Category = mongoose.model('category', categoryShcema);

module.exports = Category;