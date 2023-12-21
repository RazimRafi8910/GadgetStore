const mongoose = require("mongoose");

let otpShcema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  OTP: {
    type: Number,
    required: true,
  },
  time: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

let otpModel = mongoose.model("otpCode", otpShcema);

module.exports = { otpModel };
