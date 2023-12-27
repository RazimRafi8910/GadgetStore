const express = require('express');
const adminController = require('../controllers/adminController');
const { isAdmin,authenticateUser } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

const router = express();

//dashboard
router.get('/',isAdmin, adminController.adminDashboard);

//admin product management
router.get('/products', isAdmin, adminController.adminProducts);
router.get('/product/:product_id/view', adminController.adminProductDetails);
router.get('/product/add',isAdmin, adminController.addProductsPage);
router.post('/product/add', upload.array('images'), adminController.addProduct);
router.get('/product/:product_id/edit',isAdmin, adminController.editProductPage);
router.delete('/product/:product_id/delete/image/:index',isAdmin, adminController.deleteOldImage);
router.put('/product/:product_id/crop/image/:index',upload.single('image'),isAdmin, adminController.cropImage);
router.post('/product/:product_id/edit', upload.array('images'), adminController.editProduct);
router.delete('/product/:product_id/delete',isAdmin, adminController.deleteProduct);
router.get('/products/search',isAdmin, adminController.productSearch);
router.put('/product/:product_id/list',isAdmin, adminController.productList);
router.put('/product/:product_id/unlist',isAdmin, adminController.productUnlist);

// admin category mangement
router.get('/category',isAdmin, adminController.adminCategory);
router.post('/category',isAdmin, adminController.addCategory);
router.get('/category/:category_id/edit', isAdmin, adminController.editCategoryPage);
router.put('/category/:category_id/edit', isAdmin, adminController.editCategory);
router.delete('/category/:id',isAdmin, adminController.deleteCategory);

//user management
router.get('/users',isAdmin, adminController.adminUsers);
router.get('/user/:user_id/view',isAdmin, adminController.adminUserdetails);
router.put('/user/:user_id/block',isAdmin, adminController.adminUserBlock);
router.put('/user/:user_id/unblock',isAdmin, adminController.adminUserUnblock);

//order management
router.get('/orders', isAdmin, adminController.adminOrdersPage);
router.get('/orders/:order_id', isAdmin, adminController.adminOrderDetails);
router.put('/order/:order_id/status', isAdmin, adminController.adminOrderStatus);
router.put('/order/:order_id/return', isAdmin, adminController.returnOrder);

//coupon management
router.get('/coupons',isAdmin, adminController.couponsPage);
router.get('/coupon/add',isAdmin, adminController.addCouponPage);
router.post('/coupon/add',isAdmin, adminController.addCoupon);
router.delete('/coupon/:id', isAdmin, adminController.deleteCoupon);


module.exports = router;