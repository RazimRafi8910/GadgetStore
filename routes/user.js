const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticateUser, isAuthenticated, isUserBlocked } = require('../middleware/authMiddleware');
const router = express();

//Authentication routes
router.get('/signup',isAuthenticated, authController.signupPage);
router.post('/signup', authController.userSignup);
router.get('/verification', authController.otpVerificationPage);
router.get('/verification/resend', authController.otpResent);
router.post('/verification', authController.otpVerification);
router.get('/user/login',isAuthenticated, authController.loginPage);
router.post('/user/login', authController.userPassportLogin);

//Homepage route
router.get('/',isUserBlocked, userController.userHomePage);

//products
router.get('/products',isUserBlocked, userController.userProductsPage);
router.get('/product/:product_id/view',isUserBlocked, userController.productDetails);
router.post('/product/:product_id/review', authenticateUser, userController.productReview);

//whishlist
router.get('/wishlist', isUserBlocked, authenticateUser, userController.wishlistPage);
router.put('/wishlist/:product_id/add', authenticateUser, userController.addProductToWishlist);
router.delete('/wishlist/:product_id/remove', authenticateUser, userController.wishlistRemoveItem);

//user cart
router.get('/cart',isUserBlocked, authenticateUser, userController.userCartPage);
router.get('/cart/:cart_id/checkout',isUserBlocked, authenticateUser, userController.cartCheckoutPage);
router.post('/cart/:product_id/add', authenticateUser, userController.addToCart);
router.put('/cart/:product_id/change', authenticateUser, userController.cartItemChangeQuantity);
router.delete('/cart/:product_id/delete', authenticateUser, userController.cartItemDelete);
router.post('/cart/:cart_id/coupon/add', authenticateUser, userController.couponAddToCart);

//order 
router.get('/order/:order_id', authenticateUser, userController.orderPage);
router.post('/order/:order_id/verfiy', userController.orderPaymentVerify);
router.get('/order/:order_id/success', authenticateUser, userController.orderSuccessPage);
router.post('/order/:cart_id/create', authenticateUser, userController.createOrder);
router.put('/order/:order_id/cancel', authenticateUser, userController.cancelOrder);
router.post('/order/:order_id/return', authenticateUser, userController.returnOrder);

//profile
router.get('/profile',isUserBlocked, authenticateUser, userController.userProfile);
router.get('/logout', authenticateUser, userController.userLogout);
router.get('/profile/edit', authenticateUser, userController.userProfileEditPage);
router.put('/profile/edit', authenticateUser, userController.userProfileEdit);
router.put('/profile/password/edit', authenticateUser, userController.changePassword);
router.get('/wallet', authenticateUser, userController.userWalletPage);

//user address
router.get('/address/:user_id/add',isUserBlocked, authenticateUser,userController.addAddressPage);
router.get('/address/:address_id/edit',isUserBlocked, authenticateUser,userController.editAddressPage);
router.post('/address/:user_id/add', authenticateUser,userController.addAddress);
router.post('/address/:address_id/edit', authenticateUser, userController.editAddress);
router.delete('/address/:address_id/delete', authenticateUser, userController.deleteAddress);

module.exports = router;

//router.get('/products/search', userController.productSearch);