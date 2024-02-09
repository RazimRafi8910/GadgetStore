const  User  = require("../models/user"); //user model
const { GenerateOTP, verifiyOTP } = require("../config/otpAuth");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const passport = require("passport");
dotenv.config();

module.exports = {
  //User signup page
  signupPage: (req, res) => {
    let ref = req.query.ref;
    res.render("user/signup", {
      tittle: 'GadgetStore | Signup',
      message: req.flash(),
      ref
    });
  },
  //User signup 
  userSignup: async (req, res, next) => {
    try {
      const { username, email, ref, number, password } = req.body;
      
      //checks if user exsits
      let existUser = await User.findOne({ email });
      if (existUser) {
        req.flash('error', 'Email is already registered. Please use a different email');
        return res.redirect('/signup');
      };

      //checks numbers is valid
      if (number.length !== 10) {
        req.flash('error', 'Your number is not valid');
        return res.redirect('/signup');
      }
        
      //checks password length
      if (password.length < 6) {
        req.flash('error', 'Your password must be at least 6 characters');
        return res.redirect('/signup');
      }
          
      //register user in database
      let hashPassword = await bcrypt.hash(password, 6);
      let userDetails = {
        username,
        email,
        number,
        password: hashPassword,
        accountStatus: "unverified",
        role: "user"
      };

      //referre id
      if (ref) {
        userDetails.referralId = ref;
      };

      let user = await User.create(userDetails);

      //generate the OTP and send to the user
      GenerateOTP(email);

      //passport local statergy login
      req.login(user, function (err) {
        if (err) return next(err);
        res.redirect("/verification");
      });

    } catch (error) {
      next(error);
    }
  },
//OTP verification page
  otpVerificationPage: (req, res) => {
    res.render("user/OTPverification", {
      tittle:'GadgetStore | verification',
      message: req.flash()
    });
  },

  otpResent: async(req, res, next) => {
    let email = req.user.email;
    try {
      //generate new OTP 
      GenerateOTP(email);
      res.redirect("/verification");
    } catch (error) {
      next(error)
    }
  },
  otpVerification: async(req, res, next) => {
    try {
      let email = req.user.email;
      let OTP = req.body.OTP;
      //verifing the OTP and return verification status
      let verification = await verifiyOTP(OTP, email);

      if (verification.Status) {
        const verifiedStatus = "verified";

        //updating user details in database
        await User.updateOne({ email }, { accountStatus: verifiedStatus });

        req.flash('message', 'registration was successful');
        res.redirect('/');
      } else {
        req.flash('error', verification.message);
        res.redirect('/verification');
      };
    } catch (error) {
      next(error);
    }
  },
//login page
  loginPage: (req, res) => {
    res.render("user/login", {
      tittle:'GadgetStore | login',
      message: req.flash()
    });
  },
  //passport local statergy login
  userPassportLogin:  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/user/login',
    failureFlash:true
  }),
};

