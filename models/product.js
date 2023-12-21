const mongoose = require('mongoose');

let productShcema = mongoose.Schema({
    productName: {
        type: String,
        required:true
    },
    price: {
        type: Number,
        required:true
    },
    brand: {
        type: String,
        required:true
    },
    description: {
        type: String,
        required:true
    },
    images: [{ 
        type: String,
        required: true  
    }],
    stock: {
        type: Number,
        required:true
    },
    specification: [{
        type: String,
        required:true
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required:true
    },
    isListed: {
        type: Boolean,
        default: true
    }
})

let Product = mongoose.model('product', productShcema);

module.exports = Product