const localStrategy = require('passport-local').Strategy;
const  User  = require('../models/user');
const bcrypt = require('bcrypt');

function initializePassport(passport) {
    passport.use(new localStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) return done(null, false, { message: "Email address not registered. Please sign up" });

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch === false) return done(null, false, { message: "Incorrect password" });

            return done(null, user);
        } catch (error) {
            done(error);
        }
    }))
    

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (_id, done) => {
        try {
            let user = await User.findById({ _id });
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};

    module.exports = initializePassport

