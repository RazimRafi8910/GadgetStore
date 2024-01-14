const User = require('../models/user');
const Product = require('../models/product');
const Category = require('../models/category');
const Address = require('../models/address');
const Cart = require('../models/cart');
const productReview = require('../models/productReview');
const Order = require('../models/order');
const bcrypt = require("bcrypt");
const Wallet = require("../models/wallet");
const { isValidInput, addressValidation } = require('../config/inputValidation');
const { GenerateOTP } = require("../config/OTPauth");
const OrderReturn = require('../models/orderReturn');
const Coupon = require('../models/coupon');
const razorPayOrderGenerate = require('../config/razorPay');
const Wishlist = require('../models/wishlist');
const PaymentRecipt = require('../models/paymentRecipt');
const ProductOffer = require('../models/productOffer');
const CategoryOffer = require('../models/categoryOffer');
const { uuidv4, invoiceIdGenrator } = require('../config/uuidGenerator');

module.exports = {
  
  userHomePage: async (req, res, next) => {
    try {
      let user = req.user;
      let newProducts = await Product.find({ isListed: true }).limit(4).populate('category').lean();
      let products = await Product.find({ isListed: true }).populate('category').lean();
      let productOffer = await ProductOffer.find().lean();
      let categoryOffers = await CategoryOffer.find().lean();
      
      res.render('shop/home', {
        tittle: 'GadgetStore | Home',
        newProducts,
        products,
        user,
        productOffer,
        categoryOffers,
      });

    } catch (error) {
      next(error);
    };
  },

  userProductsPage: async (req, res, next) => {
    try {
      let user = req.user;  
      let productOffer = await ProductOffer.find().lean();
      let categoryOffers = await CategoryOffer.find().lean();
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
      

      res.render('shop/product-list', {
        tittle: 'GadgetStore | Products',
        message:req.flash(),
        products,
        filterCategory,
        filterPrice,
        categorys,
        productName,
        categoryOffers,
        productOffer,
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
      let productOffer = await ProductOffer.findOne({ product_id: productId }).lean();
      let categoryOffer = await CategoryOffer.findOne({ category_id: product.category._id });
      let user = req.user;

      res.render('shop/product-details', {
        tittle: 'GadgetStore | Product Details',
        product,
        productReviews,
        user,
        categoryOffer,
        productOffer,
        message:req.flash()
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
      let userDetails = await User.findOne({ _id: user._id })
      let userAddress = await Address.find({ user_id: user._id });
      let userWallet = await Wallet.findOne({ user_id: user._id });
      let coupons = await Coupon.find().lean();
      let userOrders
      let filterStatus = req.query.orderStatus || 'All';
      let page = req.query.page || 1;
      let limit = 6;
      let skip = (page - 1) * limit;
      let endIndex = page * limit;
      
      if (filterStatus !== 'All') {
        userOrders = await Order.find({ $and: [{ user_id: user._id }, { orderStatus: filterStatus }] }).sort({ orderDate: -1 }).skip(skip).limit(endIndex);
      } else {
        userOrders = await Order.find({ user_id: user._id }).skip(skip).limit(endIndex).sort({ orderDate: -1 });
      }

      res.render('user/profile', {
        tittle: 'GadgetStore | Profile',
        user,
        coupons,
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

  userReferrals: async (req, res, next) => {
    try {
      let user = req.user;
      let link
      if (user.referralLink == 'null') {
        let id = uuidv4();
        link = id + user.username;
        await User.updateOne({ _id: user._id }, { $set: { referralLink: link } });
      } else {
        link = user.referralLink;
      }

      res.render('user/referal', {
        tittle: 'GadgetStore | Referals',
        user,
        link
      })
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

      let result = addressValidation(houseName, town, address, city, state, pincode);

      if (!result.validation) {
        req.flash(`${result.input}`, `Invalid ${result.input}`);
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
        message:req.flash(),
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

      let result = addressValidation(houseName, town, address, city, state, pincode);

      if (!result.validation) {
        req.flash(`${result.input}`, `Invalid ${result.input}`);
        return res.redirect(`/address/${addressId}/edit`)
      };

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
      let userCart = await Cart.findOne({ user_id: user._id }).populate('coupon').populate({
        path: 'items.product',
        model: 'product',
        populate: {
          path: 'category',
          model:'category'
        }
      })
      let coupons = await Coupon.find().lean();
      let productOffer = await ProductOffer.find().lean();
      let categoryOffer = await CategoryOffer.find().lean();
      let totalPrice = 0;
      let discountPrice = 0;
      
      // checking product offer and adding to total price
      if (userCart) {
        for (const item of userCart.items) {
          if (item.product.haveOffer) {
            productOffer.forEach((offer) => {
              if (item.product._id.toString() == offer.product_id) {
                totalPrice += offer.offerPrice * item.quantity;
              }
            });

          } else if (item.product.category.haveOffer) {
            categoryOffer.forEach((offer) => {
              if (item.product.category._id.toString() == offer.category_id) {
                let discountPrice = (item.product.price / 100) * offer.discount;
                totalPrice += (item.product.price - discountPrice) * item.quantity;
              }
            });
          } else {
            totalPrice += item.product.price * item.quantity;
          }

        };

        if (userCart.discount > 0) {
          discountPrice = (totalPrice / 100) * userCart.discount;
          discountPrice = discountPrice;
          totalPrice = totalPrice - discountPrice;
        }
      };

      
      res.render('user/user-cart', {
        tittle: 'GadgetStore | Cart',
        message: req.flash(),
        user,
        userCart,
        totalPrice,
        coupons,
        productOffer,
        categoryOffer,
        discountPrice
      });
    } catch (error) {
      next(error);
    }
  },

  wishlistPage: async (req, res, next) => {
    try {
      let user = req.user;
      let userWishlist = await Wishlist.findOne({ user_id: user._id }).populate('items.product_id');
      res.render('user/wishlist', {
        tittle: 'GagetStore | Wishlist',
        user,
        userWishlist,
      });
    } catch (error) {
      next(error);
    }
  },

  addProductToWishlist: async (req, res, next) => {
    try {
      let user = req.user;
      let productId = req.params.product_id;
      let product = await Product.findOne({ _id: productId });
      let userWishlist = await Wishlist.findOne({ user_id: user._id })
      let items = [{
        product_id: product._id
      }];

      let itemExist
      if (userWishlist) {
        userWishlist.items.forEach(item => {
          if (item.product_id.toString() == productId) {
            itemExist = true
          }
        });

        if (itemExist) {
          return res.status(200).json({ itemfound: true });
        } else {
          let result = await Wishlist.findOneAndUpdate({ _id: userWishlist._id }, { $push: { items } });
        }
      } else {
        await Wishlist.create({
          user_id: user._id,
          items
        });
      };

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  wishlistRemoveItem: async (req, res, next) => {
    try {
      let user = req.user;
      let productId = req.params.product_id;
      let product = await Wishlist.findOneAndUpdate({ user_id: user._id }, { $pull: { items: { product_id: productId } } });
      if (product) {
        res.status(200).json({ success: true });
      }
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
        return res.redirect(`/product/${productId}/view`);
      }
      let userCart = await Cart.findOne({ user_id: user._id }).populate('items.product');

      //create user cart if not exist
      if (!userCart) {
        await Cart.create({
          user_id:user._id,
          items
        });
        req.flash('message', 'product added to Cart');
        returnres.redirect(`/product/${productId}/view`);
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
      req.flash('message', 'product added to Cart');
      res.redirect(`/product/${productId}/view`);

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
      let cart = await Cart.findOne({ _id: cartId }).populate('items.product');
      let coupon = await Coupon.findOne({ code: couponCode });
      let totalPrice = 0;

      if (!coupon) {
        req.flash('couponError', 'No Coupon found');
        return res.redirect('/cart');
      }
      
      //check user alreay used coupon
      if (user.usedCoupons) {
        let couponUsed 
        user.usedCoupons.forEach((userCoupon) => { 
          if (userCoupon==coupon.code) {
          couponUsed = true
        }
      });

      if (couponUsed) {
        req.flash('couponError', 'Coupon Code already used');
        return res.redirect('/cart');
        };
      };
      
      
      //total price of the cart
      if (cart) {
        cart.items.forEach(item => {
          totalPrice += item.product.price * item.quantity;
        });
      };

      if (coupon.limit > totalPrice) {
        req.flash('couponError', `The minimum amount must be above Rs${coupon.limit} for this coupon`);
        return res.redirect('/cart');
      };
        //add coupon to cart 
        let updateFields = {
          coupon: coupon._id,
          discount: coupon.discount
        }
        let result = await Cart.findOneAndUpdate({ _id: cartId }, updateFields, { new: true });
        req.flash('coupon', 'Coupon Added');
        res.redirect('/cart');

    } catch (error) {
      next(error)
    }
  },

  deleteCartCoupon: async (req, res, next) => {
    try {
      let cartId = req.params.cart_id;
      let userCart = await Cart.findOne({ _id: cartId });
      let result = await Cart.findOneAndUpdate({ _id: cartId }, { $set: { discount: 0 } ,  $unset: { coupon: userCart.coupon } });
      if (result) {
        res.status(200).json({ success: true });
      }
    } catch (error) {
      next(error);
    }
  },

  cartCheckoutPage: async (req, res, next) => {
    try {
      let cartId = req.params.cart_id;
      let user = req.user;
      let userCart = await Cart.findOne({ _id: cartId }).populate('coupon').populate({
        path: 'items.product',
        model: 'product',
        populate: {
          path: 'category',
          model: 'category'
        }
      });
      let userAddress = await Address.find({ user_id: user._id });
      let userWallet = await Wallet.findOne({ user_id: user._id });
      let productOffers = await ProductOffer.find();
      let categoryOffers = await CategoryOffer.find();
      let totalPrice = 0;
      let offerDiscount = 0;
      let quantityCheck = false;
      let leftStock = false;  //for to check the stock of the product

      if (!userCart) {
        return res.redirect('/cart');
      };
      
      // check the stock,quantity and add product offer to total price
      for (const item of userCart.items) {
        if (item.quantity < 1) {
          quantityCheck = true;
        }

        if (item.product.stock <= 0) {
          leftStock = true;
        }
        // total price with product offer
        if (item.product.haveOffer) {
          let productOffer = await ProductOffer.findOne({ product_id: item.product._id });
          totalPrice += productOffer.offerPrice * item.quantity;
          offerDiscount += item.product.price - productOffer.offerPrice;

        } else if (item.product.category.haveOffer) {
          // total price with category offer
          let categoryOffer = await CategoryOffer.findOne({ category_id: item.product.category._id });
          let discountPrice = (item.product.price / 100) * categoryOffer.discount;
          totalPrice += (item.product.price - discountPrice) * item.quantity;
          offerDiscount += discountPrice;
        } else {
          totalPrice += item.product.price * item.quantity;
        }
        
      }

      //coupon discount to total price
      let discountPrice = 0;
      if (userCart.discount > 0) {

        if (userCart.coupon.limit > totalPrice) {
          await Cart.updateOne({ _id: cartId }, { $set: { discount: 0 }, $unset: { coupon: userCart.coupon } });
          req.flash('couponError', `The minimum amount must be above Rs${userCart.coupon.limit} for this coupon`);
          return res.redirect('/cart');
        }
        discountPrice = (totalPrice / 100) * userCart.discount;
        discountPrice = discountPrice
        totalPrice = totalPrice - discountPrice;
      }

      if (leftStock) {
        req.flash('error', 'Product OUT OF STOCK');
        return res.redirect('/cart');
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
        categoryOffers,
        productOffers,
        userWallet,
        discountPrice,
        offerDiscount,        
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
      let recipt 
      let userOrder = await Order.findOne({ _id: orderId }).populate('items.product').populate('orderAddress');
      if (userOrder.paymentMethod === 'onlinePayment') {
        recipt = await PaymentRecipt.findOne({ order_id: userOrder._id });
      };
      res.render('user/order', {
        tittle: 'GadgetStore | Order',
        user,
        userOrder,
        recipt,
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
    let userCart = await Cart.findOne({ _id: userCartId }).populate('items.product').populate({
      path: 'items.product',
      model: 'product',
      populate: {
        path: 'category',
        model: 'category'
      }
    });
    let userWallet = await Wallet.findOne({ user_id: user._id });
    let coupon = await Coupon.findOne({ _id: userCart.coupon });
    let orderItems = userCart.items;
    let orderStatus = 'Processing';
    let totalPrice = 0
    let discountPrice = 0;

    //calculating total price and removing the stock from the product data
    // userCart.items.forEach(async (item) => {
    //   let leftStock = item.product.stock - item.quantity;
    //   totalPrice += item.product.price * item.quantity;
    //   await Product.updateOne({ _id: item.product._id }, { $set: { stock: leftStock } });
    // });

    if (!addressId) {
      req.flash('error', 'Address not selected');
      return res.status(200).json({ success: false, payment: false});
    }

    //calculating total price of the product with offer discount
    for (const item of userCart.items) {
      if (item.product.haveOffer) {
        let productOffer = await ProductOffer.findOne({ product_id: item.product._id });
        totalPrice += productOffer.offerPrice * item.quantity;

      } else if (item.product.category.haveOffer) {
        //calculating total price product category offer
        let categoryOffer = await CategoryOffer.findOne({ category_id: item.product.category._id });
        let discountPrice = (item.product.price / 100) * categoryOffer.discount;
        totalPrice += (item.product.price - discountPrice) * item.quantity;

      } else {
        totalPrice += item.product.price * item.quantity;
      }

      let leftStock = item.product.stock - item.quantity;
      await Product.updateOne({ _id: item.product._id }, { $set: { stock: leftStock } });
    }


    //coupon discount to total price
    if (userCart.discount > 0) {
      discountPrice = (totalPrice / 100) * userCart.discount;
      totalPrice = totalPrice - discountPrice;

      //updating user coupon is used
      let userCoupon = coupon.code;
      if (user.usedCoupons) {
        await User.updateOne({ _id: user._id }, { $push: { usedCoupons: userCoupon } });
      } else {
        await User.updateOne({ _id: user._id }, { $set: { usedCoupons: userCoupon } });
      }
    };
    //checks the wallet balance and input amount
    if ( walletAmount ) {
      if ( walletAmount > userWallet.balance || walletAmount > totalPrice ){
        req.flash('error', 'The wallet balance exceeds the expected amount');
        return res.status(200).json({ success: false });
        
      } else {
        if ( totalPrice == walletAmount ) {
          paymentMethod = 'PaidOnWallet';
        } else {
          totalPrice = totalPrice - walletAmount;
        }
      };
    };

    //order creating
    let invoiceId = invoiceIdGenrator();
    let order = await Order.create({
      user_id: user._id,
      invoiceId,
      orderAddress: addressId,
      items: orderItems,
      paymentMethod,
      orderStatus,
      totalPrice
    });

    if (!order) {
      req.flash('error', 'order not created');
      return res.status(200).json({ success: false, payment: false});
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
    };

    //check the user referral and updating referred user 
    if (user.referralId !== 'null' ) {
      let referredUser = await User.findOne({ referralLink: user.referralId });
      let transactions = [{
        order_id: order._id,
        referral: user.username,
        method: 'referral',
        amount: 100
      }];

      let referredUserWallet = await Wallet.findOne({ user_id: referredUser._id });

      if (!referredUserWallet) {
         referredUserWallet = await Wallet.create({
          user_id: order.user_id,
          balance: 100,
          transactions
        });

      } else {
        let remainingBalance = referredUserWallet.balance + 100;
        let result = await Wallet.findOneAndUpdate({ user_id: referredUser._id }, { $set: { balance: remainingBalance }, $push: { transactions } });
      };

      await User.updateOne({ _id: user._id }, { $set: { referralId: 'null' } });
    }


      //razorpay online paymanet
    if (totalPrice !== walletAmount && paymentMethod === 'onlinePayment') {  
      let razorPayOrder = await razorPayOrderGenerate(order._id, totalPrice);
      await Order.updateOne({ _id: order._id }, { $set: { orderStatus: 'Not paid' } });
      return res.status(200).json({ success: true, payment: true, orderId: order._id, razorPayOrder, user });
    }

    await Cart.deleteOne({ _id: userCart._id });
    req.flash('message', 'your order has been successfully created');
    res.status(200).json({ success: true, payment: false, orderId: order._id });
  } catch (error) {
    next(error)
  }
  },

  orderPaymentVerify: async (req, res, next) => {
    try {
      let user = req.user;
      let orderId = req.params.order_id;
      let { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      await Order.updateOne({ _id: orderId }, { $set: { orderStatus: 'Processing' } });
      if (razorpay_payment_id) {
        await PaymentRecipt.create({
          order_id: orderId,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        });
        req.flash('message', 'Payment success');
        await Cart.deleteOne({ user_id: user._id });
      }
      res.redirect(`/order/${orderId}/success`);
      // res.redirect(`/order/${orderId}`);
    } catch (error) {
      next(error);
    }
  },

  orderSuccessPage: async (req, res, next) => {
    try {
      let user = req.user;
      let orderId = req.params.order_id;
      let order = await Order.findOne({ _id: orderId });
      res.render('user/payment-success',{
        tittle: 'GagetStore | Order',
        user,
        order
      })

    } catch (error) {
      next(error)  
    }
  },

  returnOrder: async (req, res, next) => {
    try {
      let user = req.user;
      let orderId = req.params.order_id;
      let { reason } = req.body;

      let userOrder = Order.findOne({ _id: orderId });

      let orderDate = userOrder.deleveredDate;
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

      // refund for online payment
      if (order.paymentMethod === 'onlinePayment' || order.paymentMethod === 'PaidOnWallet') {
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
        req.flash('message', 'Refund added to Wallet');
      }

      res.redirect('/')
    } catch (error) {
      next(error);
    }
  },

  orderInvoice: async (req, res, next) => {
    try {
      let user = req.user;
      let orderId = req.params.order_id;
      let userOrder = await Order.findOne({ _id: orderId }).populate('orderAddress').populate('items.product');
      
      res.status(200).json({user, userOrder});
      
    } catch (error) {
      next(error);
    }
  }
}
