const mongoose = require('mongoose')

let userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: true,
    },
    accountStatus: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    address_id: {
        type: Number,
    },
    usedCoupons: [{
            type: String,
            required: true
    }]
});

let User = mongoose.model('user',userSchema)

module.exports = User;