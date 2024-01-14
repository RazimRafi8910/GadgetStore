const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config();

const URI = process.env.URI_ALTAS;

module.exports = function (){
    mongoose.connect(URI).then(() => {
        console.log("database connected")
    }).catch((err) => {
        console.log(err)
    })
}
