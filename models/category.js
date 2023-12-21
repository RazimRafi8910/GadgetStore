const mongoose = require('mongoose');

let categoryShcema = mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    }
});

let Category = mongoose.model('category', categoryShcema);

module.exports = Category;