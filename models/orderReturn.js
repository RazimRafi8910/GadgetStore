const mongoose = require('mongoose');

let orderReturnSchema = mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required:true
    }
});

let OrderReturn = mongoose.model('orderReturn', orderReturnSchema);

module.exports = OrderReturn;