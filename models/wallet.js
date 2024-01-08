const mongoose = require('mongoose');

let walletSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    transactions: [{
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'order',
            required:true
        },
        method: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            required: true,
            default:Date.now
        },
        referral: {
            type: String,  
        },
    }]
});


let Wallet = mongoose.model('wallet', walletSchema);

module.exports = Wallet;