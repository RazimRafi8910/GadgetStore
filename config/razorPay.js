const Razorpay = require('razorpay');
const dotenv = require('dotenv')
dotenv.config();

let instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_SECRET_KEY });

async function razorPayOrderGenerate(orderId, amount) {

    let result
    let price = Math.floor(amount);
    price = price * 100;

    let option = {
        amount: price,
        currency: "INR",
        receipt: orderId,
    }
    try {
        result = await instance.orders.create(option);
        return result
    } catch (error) {
        console.log(error);
    }
}


module.exports = razorPayOrderGenerate;