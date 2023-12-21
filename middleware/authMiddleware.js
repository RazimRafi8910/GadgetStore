
//Function to check if the user is authenticated
function authenticateUser(req,res,next) {
    if (req.user)
        return next();

    res.redirect('/user/login');
}

// Function to check if the user is already authenticated and redirect to home
function isAuthenticated(req,res,next) {
    if (req.user)
        return res.redirect('/');

    next();
}

//function to check if the user is an admin
function isAdmin(req, res, next) {
    if (req.user) {
        if (req.user.role === 'admin') {
            return next();
        } else {
        res.redirect('/');
        }
    } else {
        res.redirect('/user/login');
    }
}

// to check user is blocked
function isUserBlocked(req,res,next) {
    if (req.user) {
        if (req.user.accountStatus === 'blocked') {
            res.render('blockUserpage');
        } else {
            return next();
        }
    } else {
        return next()
    }
    
}

module.exports = { authenticateUser, isAuthenticated, isAdmin, isUserBlocked };