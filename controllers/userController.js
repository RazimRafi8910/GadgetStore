const User = require('../models/user');
const Product = require('../models/product');
const Category = require('../models/category');
const Address = require('../models/address');
const Cart = require('../models/cart');
const productReview = require('../models/productReview');
const Order = require('../models/order');
const bcrypt = require("bcrypt");
const Wallet = require("../models/wallet");
const isValidInput = require('../config/inputValidation');
const { GenerateOTP } = require("../config/OTPauth");
const OrderReturn = require('../models/orderReturn');
const Coupon = require('../models/coupon');
const razorPayOrderGenerate = require('../config/razorPay');

module.exports = {
  
  userHomePage: async (req, res, next) => {
    try {
      let user = req.user;
      let newProducts = await Product.find({ isListed: true }).limit(4).lean();
      let products = await Product.find({ isListed: true }).populate('category').lean();
      
      res.render('shop/home', {
        tittle: 'GadgetStore | Home',
        newProducts,
        products,
        user,
      });

    } catch (error) {
      next(error);
    };
  },

  userProductsPage: async (req, res, next) => {
    try {
      
      let productName = req.query.productName || "";
      let filterPrice = req.query.priceFilter || 1000000
      let filterCategory = req.query.category || 'All'
      const regex = new RegExp(productName, "i");

      let filterCondition = [
        { productName: regex },
        { price: { $lte: filterPrice } },
        { isListed: true }
      ]

      if (filterCategory != 'All') {
        filterCondition.push({ 'category': filterCategory });
      }

      //pagination
      let page = req.query.page || 1;
      let limit = 9;
      let skip = (page - 1) * limit;
      let endIndex = page * limit;
      let products = await Product.find({ $and: filterCondition })
        .skip(skip).limit(endIndex).populate('category');
      
      
      let categorys = await Category.find().lean();
      let user = req.user;

      res.render('shop/product-list', {
        tittle: 'GadgetStore | Products',
        message:req.flash(),
        products,
        filterCategory,
        filterPrice,
        categorys,
        productName,
        user
      });

    } catch (error) {
      next(error);
    }
  },

//products details page
  productDetails: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let product = await Product.findById(productId).populate('category');
      let productReviews = await productReview.findOne({ product_id: product._id });
      let user = req.user;

      res.render('shop/product-details', {
        tittle: 'GadgetStore | Product Details',
        product,
        productReviews,
        user
      });
    } catch (error) {
      next(error);
    }
  },

  productReview: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let username = req.user.username;
      let reviewText = req.body.review;
      let reviewDate = new Date()
      let user = req.user;

      let newReview = {
        username,
        reviewDate,
        review:reviewText
      }

      let review = await productReview.findOne({ product_id: productId });

      if (!review) {
        await productReview.create({
          product_id: productId,
          productReview: [newReview]
        })
      } else {
        await productReview.updateOne({ _id: review._id }, { $push: { productReview: newReview } });
      }
      
      res.redirect(`/product/${productId}/view`);
      

    } catch (error) {
      next(error)
    }
  },

//user Profile
  userProfile: async (req, res, next) => {
    try {
      let user = req.user;
      let userDetails = await User.findOne({ _id: user._id }).populate('coupons.coupon_id');
      let userAddress = await Address.find({ user_id: user._id });
      let userOrders = await Order.find({ user_id: user._id }).sort({ orderDate: -1 });
      let userWallet = await Wallet.findOne({ user_id: user._id });
      res.render('user/profile', {
        tittle: 'GadgetStore | Profile',
        user,
        userAddress,
        userOrders,
        userWallet,
        userDetails,
        message: req.flash(),
      });
    } catch (error) {
      next(error)
    }
  },

  userProfileEditPage: async (req, res, next) => {
    try {
      let user = req.user;
      res.render('user/edit-profile', {
        tittle: 'GadgetStore | Profile',
        user,
        message:req.flash(),
      });
    } catch (error) {
      next(error)
    }
  },

    userProfileEdit: async (req, res, next) => {
    try {
      let user = req.user;
      let { username, number, email } = req.body;

      //input validation
      if (number.length !== 10) {
        req.flash('error', 'Invalid Phone number');
        return res.status(200).json({ inputValidation: false });
      }
      let result = isValidInput(username);
      if (result === false) {
        req.flash('error', 'Invalid username ');
        return res.status(200).json({ inputValidation: false });
      }

      let updateFields = {
        username,
        number:Number(number),
        email
      }
      
      let updatedUser = await User.findOneAndUpdate({ _id: user._id }, updateFields, { new: true });

      if (!updatedUser) {
        req.flash('error', 'Not updated');
        return res.status(500).json('error')
      }
      //new email verifcation
      if (email !== user.email) {
        GenerateOTP(email);
        return res.status(200).json({ newEmail: true });
      }

      req.flash('update', 'Profile Updated');
      res.status(200).json({ newEmail:false});
    } catch (error) {
      next(error);
    }
  },
    
  changePassword: async (req, res, next) => {
    try {
      let user = req.user;
      let { password, newPassword, confirmPassword } = req.body;
      let passwordMatch = await bcrypt.compare(password, user.password);
      
      if (passwordMatch === false) {
        req.flash('password', 'Incorrect Old Password');
        return res.status(200).json({ passwordStatus: false });
      }

      if (newPassword !== confirmPassword) {
        req.flash('password', 'Confirm Correct Password');
        return res.status(200).json({ passwordStatus: false });
      }

      if (newPassword.length < 6) {
        req.flash('password', 'Your password must be at least 6 characters');
        return res.status(200).json({ passwordStatus: false });
      }

      let hashPassword = await bcrypt.hash(newPassword, 6);
      await User.updateOne({ _id: user._id }, { $set: { password: hashPassword } });

      req.flash('update', 'Password Changed');
      res.status(200).json({ passwordStatus: true });

    } catch (error) {
      next(error);
    }
  },

  userLogout: (req, res, next) => {
    //passport logout
    req.logout((err) => {
      if (err) { return next(err); }
      res.redirect('/');
    });
  },

  userWalletPage: async (req, res, next) => {
    try {
      let user = req.user;
      let userWallet = await Wallet.findOne({ user_id: user._id }); 
      res.render('user/wallet', {
        tittle: 'GadgetStore | Wallet',
        userWallet,
        user
      });
    } catch (error) {
      next(error);
    }
  },

  addAddressPage: (req, res) => {
    let user = req.user;
    res.render('user/new-address', {
      tittle: 'GagetStore | New Address',
      message:req.flash(),
      user
    })
  },

  addAddress: async (req, res, next) => {
    try {
      let userId = req.params.user_id;
      let { houseName, town, address, city, state, pincode, addressType } = req.body;

      //validate the inputs
      let validationResult = isValidInput([houseName, town, city, state, addressType]);

      if (pincode.length !== 6) {
         req.flash('error', 'Invalid pincode');
        return res.redirect(`/address/${userId}/add`);
      }

      if (!validationResult) {
        req.flash('error', 'Invalid Inputs');
        return res.redirect(`/address/${userId}/add`);
      }

      let newAddress = await Address.create({
        user_id:userId,
        houseName,
        town,
        address,
        city,
        state,
        pincode,
        addressType
      });

      if (!newAddress) {
        req.flash('error', 'something wrong, Address not created');
        return res.redirect('/profile');
      }

      req.flash('message', 'New Address created');
      res.redirect('/profile');

    } catch (error) {
      next(error);
    }
  },

  editAddressPage: async (req, res,next) => {
    try {
      let user = req.user;
      let addressId = req.params.address_id;
      let address = await Address.findOne({ _id: addressId });
      res.render('user/edit-address.ejs', {
        tittle: 'GagetStore | Edit Address',
        user,
        address
      })
    } catch (error) {
      next(error);
    }
  },

  editAddress: async (req, res, next) => {
    try {
      let addressId = req.params.address_id;
      let { houseName, town, address, city, state, pincode, addressType } = req.body;
      let updateFields = {
        houseName,
        town,
        address,
        city,
        state,
        pincode,
        addressType
      };

      let newAddress = await Address.findOneAndUpdate({ _id: addressId }, updateFields, { new: true });
      if (!newAddress) {
        req.flash('error', 'something wrong, Address not updated');
        return res.redirect('/profile');
      }
      req.flash('message', 'New Address updated');
      res.redirect('/profile');

    } catch (error) {
      next(error);
    }
  },
  
  deleteAddress: async (req, res, next) => {
    try {
      let user = req.user;
      let addressId = req.params.address_id;
      
      let response = await Address.deleteOne({ _id: addressId });
      if (response) {
        req.flash('message','Address deleted')
        return res.redirect('/profile');
      }
      req.flash('error', 'Address not deleted');
      res.redirect('/profile');
    } catch (error) {
      next(error);
    }
  },

  userCartPage: async (req, res, next) => {
    try {
      let user = req.user;
      let userCart = await Cart.findOne({ user_id: user._id }).populate('items.product');
      let coupon = await Coupon.find({ couponName: 'Buymore' });
      let totalPrice = 0;
      let discountPrice = 0;
      if (userCart) {
        userCart.items.forEach(item => {
          totalPrice += item.product.price * item.quantity;
        });

        if (userCart.discount > 0) {
          discountPrice = (totalPrice / 100) * userCart.discount;
          totalPrice = totalPrice - discountPrice;
        }
      };

      
      res.render('user/user-cart', {
        tittle: 'GadgetStore | Cart',
        message: req.flash(),
        user,
        userCart,
        totalPrice,
        coupon,
        discountPrice
      });
    } catch (error) {
      next(error);
    }
  },

  addToCart: async (req, res, next) => {
    try {
      let user = req.user;    
      let productId = req.params.product_id;
      let itemQuantity = req.body.quantity || 1;
      let productQuantity = Number(itemQuantity);
      let product = await Product.findOne({ _id: productId });

      let items = {
        product: productId,
        quantity:productQuantity
      };

      //checking the stock of the product
      if (product.stock <= 0 || productQuantity > product.stock) {
        req.flash('error', 'out of stock')
        return res.redirect('/');
      }
      let userCart = await Cart.findOne({ user_id: user._id }).populate('items.product');

      //create user cart if not exist
      if (!userCart) {
        await Cart.create({
          user_id:user._id,
          items
        });
        req.flash('message', 'product added to Cart');
        return res.redirect('/cart');
      }

      
     //checks if item already exist in cart
      let existItem;
      userCart.items.forEach((item) => {
        if (item.product._id.toString() === productId) {
          existItem = item;
        }
      });

      if (!existItem) {
        await Cart.updateOne({ _id: userCart._id }, { $push: { items } });
      } else {
        let quantity = productQuantity + existItem.quantity;  
        await Cart.updateOne({ _id: userCart._id, "items.product": productId }, { $set: { "items.$.quantity":quantity } });
      }

      res.redirect('/');

    } catch (error) {
      next(error);
    }
  },

  cartItemChangeQuantity: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let user = req.user;
      let cartQuantity = req.body; // cartQuantity.change - change of the items (+1/-1)
      let product = await Product.findOne({ _id: productId });
      let userCart = await Cart.findOne({ user_id: user._id });
      let currentQuantity 
      let productStock = product.stock;

      userCart.items.forEach(item => {
        if (productId === item.product.toString()) {
          currentQuantity = item.quantity
        }
      });

      if (cartQuantity.change === 1) {
        if (productStock === 0) {
          return req.flash('error', 'Out of Stock');
        }
        currentQuantity++;
        productStock--;
      }

      if (cartQuantity.change === -1 && currentQuantity >= 1) {
        currentQuantity--;
        productStock++;
      }
      await Cart.updateOne({ _id: userCart._id, "items.product": productId }, { $set: { "items.$.quantity": currentQuantity } });
      await Product.updateOne({ _id: productId }, { $set: { stock: productStock } });
      res.json('success');

    } catch (error) {
      next(error);
    }
  },

  cartItemDelete: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let user = req.user;
      let userCart = await Cart.findOne({ user_id: user._id }).populate('items.product');
      let product = await Product.findOne({ _id: productId });
      let productQuantity = 0

      //checking the product quantity
      userCart.items.forEach((item) => {
        if (item.product._id.toString() === productId) {
          productQuantity = item.quantity;
        }
      });
      
      //updating stock of removed product
      let currentStock = productQuantity + product.stock;
      
      await Cart.updateOne({ user_id: user._id }, { $pull: { items: { product: productId } } });
      await Product.updateOne({ _id: productId, }, { $set: { stock: currentStock } });
      
      res.json('success');
    } catch (error) {
      next(error);
    }
  },

  couponAddToCart: async (req, res, next) => {
    try {
      let cartId = req.params.cart_id;
      let user = req.user;
      let { couponCode } = req.body;
      let userDetails = await User.findOne({ _id: user._id });
      let coupon = await Coupon.findOne({ code: couponCode });

      if (!coupon) {
        req.flash('couponError', 'No Coupon found');
        return res.redirect('/cart');
      }
      
      //check user alreay used coupon
      let couponUsed 
      userDetails.coupons.forEach((userCoupon) => { 
        if (userCoupon.coupon_id.toString()==coupon._id) {
          couponUsed = userCoupon.isUsed
        }
      });

      if (couponUsed) {
        req.flash('couponError', 'Coupon Code already used');
        return res.redirect('/cart');
      }
      
      //add coupon to cart 
      let updateFields = {
        coupon: coupon._id,
        discount:coupon.discount
      }
      let result = await Cart.findOneAndUpdate({ _id: cartId }, updateFields, { new: true });
      req.flash('coupon', 'Coupon Added');
      res.redirect('/cart');

    } catch (error) {
      next(error)
    }
  },

  cartCheckoutPage: async (req, res, next) => {
    try {
      let cartId = req.params.cart_id;
      let user = req.user;
      let userCart = await Cart.findOne({ _id: cartId }).populate('items.product');
      let userAddress = await Address.find({ user_id: user._id });
      let userWallet = await Wallet.findOne({ user_id: user._id });
      let totalPrice = 0;
      let quantityCheck = false;

      //calculating total price of the product
      userCart.items.forEach(item => {
        if (item.quantity < 1) {
          quantityCheck = true;
        }
        totalPrice += item.product.price * item.quantity;
      });

      //coupon discount to total price
      let discountPrice = 0;
      if (userCart.discount > 0) {
        discountPrice = (totalPrice / 100) * userCart.discount;
        totalPrice = totalPrice - discountPrice;
      }

      if (quantityCheck) {
        req.flash('error', 'zero quantity on product, increase the quantity or remove product');
        return res.redirect('/cart');
      }

      res.render('user/checkout', {
        tittle: 'GadgetStore | Checkout',
        userAddress,
        userCart,
        user,
        totalPrice,
        userWallet,
        discountPrice,
        message:req.flash(),
      })
    } catch (error) {
      next(error);
    }
  },

  orderPage: async (req, res, next) => {
    try {
      let user = req.user;
      let orderId = req.params.order_id;
      let userOrder = await Order.findOne({ _id: orderId }).populate('items.product').populate('orderAddress');
      res.render('user/order', {
        tittle: 'GadgetStore | Order',
        user,
        userOrder,
        message:req.flash(),
      })
    } catch (error) {
      next(error);
    }
  },

  createOrder: async (req, res, next) => {
  try {
    let user = req.user;
    let userCartId = req.params.cart_id;
    let { addressId, paymentMethod, walletAmount } = req.body;
    let userCart = await Cart.findOne({ _id: userCartId }).populate('items.product');
    let userWallet = await Wallet.findOne({ user_id: user._id });
    let orderItems = userCart.items;
    let orderStatus = 'Processing';
    let totalPrice = 0
    let discountPrice = 0;

    //calculating total price and removing the stock from the product data
    userCart.items.forEach(async (item) => {
      let leftStock = item.product.stock - item.quantity;
      totalPrice += item.product.price * item.quantity;
      await Product.updateOne({ _id: item.product._id }, { $set: { stock: leftStock } });
    });

    //coupon discount to total price
    if (userCart.discount > 0) {
      discountPrice = (totalPrice / 100) * userCart.discount;
      totalPrice = totalPrice - discountPrice;
      //updating user coupon is used
      await User.updateOne({ _id: user._id, "coupons.coupon_id": userCart.coupon }, { $set: { "coupons.$.isUsed": true } }, { new: true });
    };

    //checks the wallet balance and input amount
    if (walletAmount) {

      if (walletAmount > userWallet.balance || walletAmount > totalPrice){
        req.flash('error', 'The wallet balance exceeds the expected amount');
        return res.status(200).json({ success: false });
        
      } else {
        if (totalPrice == walletAmount) {
          paymentMethod = 'PaidOnWallet';
        } else {
          totalPrice = totalPrice - walletAmount;
        }
      };
    };

    //order creating
    let order = await Order.create({
      user_id: user._id,
      orderAddress: addressId,
      items: orderItems,
      paymentMethod,
      orderStatus,
      totalPrice
    });

    if (!order) {
      req.flash('error', 'order not created');
      return res.status(200).json({ success: false });
    }

    if (walletAmount) {
      let transactions = [{
        order_id: order._id,
        method: 'Debit',
        amount: walletAmount
      }]  
      //updating user wallet balance
    let remainingBalance = userWallet.balance - walletAmount;
    await Wallet.updateOne({ _id: userWallet._id }, { $set: { balance: remainingBalance }, $push: { transactions } }, { new: true });
    } 

    //coupon
    if (order.totalPrice > 10000) {
      let coupon = await Coupon.findOne({ couponName: 'Buymore' });
      let userCoupon = [{
        coupon_id: coupon._id,
        isUsed: false,
        discount: coupon.discount
      }];

      //check user coupons exist if not create
      let userResult;
      if (!user.coupon) {
        userResult = await User.updateOne({ _id: user._id }, { $set: { coupons: userCoupon } });
      } else {

        let isCouponHave
        user.coupons.forEach((coupon) => {
          if (coupon.coupon_id == coupon._id) {
            isCouponHave = true;
          }
        });

        if (!isCouponHave) {
          userResult = await User.updateOne({ _id: user._id }, { $push: { coupons: userCoupon } });
        }
        
      };
      req.flash('newCoupon', 'You got new %20 off Coupon');
    };

    await Cart.deleteOne({ _id: userCart._id });

    if (totalPrice !== walletAmount && paymentMethod === 'onlinePayment') {
      let razorPayOrder = await razorPayOrderGenerate(order._id, order.totalPrice);
      return res.status(200).json({ success: true, payment: true, orderId: order._id, razorPayOrder,user });
    }
    
    req.flash('message', 'your order has been successfully created');
    res.status(200).json({ success: true, payment: false, orderId: order._id });
    
  } catch (error) {
    next(error)
  }
  },

  orderPaymentVerify: async (req, res, next) => {
    try {
      let orderId = req.params.order_id;
      let { razorpay_payment_id } = req.body;
      if (razorpay_payment_id) {
        req.flash('message', 'Payment success');
      }
      res.redirect(`/order/${orderId}`);
    } catch (error) {
      next(error);
    }
  },

  returnOrder: async (req, res, next) => {
    try {
      let user = req.user;
      let orderId = req.params.order_id;
      let { reason } = req.body;

      let userOrder = Order.findOne({ _id: orderId });

      let orderDate = userOrder.orderDate;
      let currentDate = Date.now();
      let daysAgo = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24)); // Calculate days difference

      if (daysAgo > 7) {
        req.flash('error', 'Order can only return with 7 Days')
        return res.redirect('/profile');
      }

      let orderReturn = {
        order_id: orderId,
        reason,
        status:'Pending'
      }
      let returnDetails = await OrderReturn.create(orderReturn);

      if (returnDetails) {
        await Order.updateOne({ _id: orderId }, { $set: { orderStatus: 'Return Pending' } });
        return res.redirect(`/order/${orderId}`);
      }
      
      req.flash('error', 'Error occured');
      res.redirect('/profile');

    } catch (error) {
      next(error);
    }
  },

  cancelOrder: async (req, res, next) => {
    try {
      let user = req.user;
      let orderId = req.params.order_id;
      let order = await Order.findOneAndUpdate({ _id: orderId },{$set:{orderStatus:'Cancelled'}});

      // adding the cancelled items stock to product db
      order.items.forEach(async (item) => {
        let product = await Product.findOne({ _id: item.product });
        let currentStock = product.stock + item.quantity;
        await Product.updateOne({ _id: item.product }, { $set: { stock: currentStock } });
      })

      if (order.paymentMethod === 'onlinePayment') {
        let userWallet = await Wallet.findOne({ user_id: order.user_id });
        let transactions = [{
          order_id: order._id,
          method: 'Credit',
          amount: order.totalPrice
        }]

        if (!userWallet) {
          userWallet = await Wallet.create({
            user_id: order.user_id,
            balance: order.totalPrice,
            transactions
          })
        } else {
          //updating user wallet
          let balance = userWallet.balance + order.totalPrice;
          await Wallet.updateOne({ _id: userWallet._id }, {
            $push: { transactions: transactions },
            $set: { balance: balance }
          });
        }
      }

      res.redirect('/')
    } catch (error) {
      next(error);
    }
  }
}
