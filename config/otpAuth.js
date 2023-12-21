const nodemailer = require("nodemailer");
const { otpModel } = require("../models/otp");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});
//function for generating otp and sending the otp
async function GenerateOTP(email) {
  try {
    //generating OTP code
    const OTP = Math.floor(Math.random() * 9000 + 1000);

    await transporter
      .sendMail({
        from: "gadgetstorewebsite@gmail.com",
        to: `${email}`,
        subject: "OTP Verification",
        text: "Your Verification code for email is :",
        html:
          `<h3>Your OTP Verification code for email is : </h3>` +
          `<h2 style="color:red;">${OTP}</h2>`,
      })
      .catch((error) => {
        console.log(error);
      });

    //saving the OTP to database
    await otpModel.findOneAndDelete({ email }); //check is there any OTP with this email and delete it
    await otpModel.create({
      email,
      OTP,
    });
  } catch (error) {
    console.log(error);
  }
}

//function for OTP verification
async function verifiyOTP(OTP, email) {
  try {
    let verification = {};
    let currentTime = Date.now();
    let databaseOtp = await otpModel.findOne({ email });

    if (databaseOtp.OTP == OTP) {
      let otpTime = currentTime - databaseOtp.time;

      //check OTP time ,expire time 50 seconds
      if (otpTime / 1000 < 50) {
        verification.Status = true;
        verification.message = "OTP is valid.";

        //delete OTP after verification
        await otpModel.deleteOne({ email });
      } else {
        verification.Status = false;
        verification.message = "OTP has expired.";
      }
    } else {
      verification.Status = false;
      verification.message = "Invalid OTP";
    }

    return verification; //return the status of the verification
  } catch (error) {
    console.log(error);
  }
}

module.exports = { GenerateOTP, verifiyOTP };
