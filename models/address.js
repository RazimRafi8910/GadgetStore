const mongoose = require('mongoose');

let addressShcema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    houseName: {
        type: String,
        required: true
    },
    town: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    addressType: {
        type: String,
        required: true
    }
});

let Address = mongoose.model('address', addressShcema);

module.exports = Address;