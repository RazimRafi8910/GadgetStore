const Product = require("../models/product");
const Category = require("../models/category");
const User = require("../models/user");
const fs = require("fs");
const Order = require("../models/order");
const { productInputValidation } = require("../config/inputValidation");
const OrderReturn = require("../models/orderReturn");
const Wallet = require("../models/wallet");
const Coupon = require("../models/coupon");
const uuidv4 = require("../config/uuidGenerator");

module.exports = {

  //Admin Dashboard
  adminDashboard: async (req, res, next) => {
    try {
      let orders = await Order.find().populate('items.product').sort({ orderDate: -1 });;
      let users = await User.find();
      let products = await Product.find();
      let categorys = await Category.find();

      let confirmedOrder = 0;
      let deliveredOrder = 0;
      let shippingOrder = 0;
      let itemsSold = 0;
      let totalIncome = 0
      orders.forEach(order => {
        totalIncome += order.totalPrice;
        if (order.orderStatus === 'Confrimed') {
          confirmedOrder++;
        }
        if (order.orderStatus === 'Delivered') {
          deliveredOrder++;
        }
        if (order.orderStatus === 'Shipping') {
          shippingOrder++;
        }
        order.items.forEach(item => {
          itemsSold += item.quantity;
        })
      });


      let totalStock = 0;
      products.forEach(product => {
        totalStock += product.stock;
      });

    res.render("admin/dashboard", {
      tittle: "GadgetStore | Dashboard",
      orders,
      users,
      products,
      categorys,
      totalStock,
      confirmedOrder,
      deliveredOrder,
      shippingOrder,
      itemsSold,
      totalIncome
    });
    } catch (error) {
      next(error);
    }
  },

  //Admin products
  adminProducts: async (req, res, next) => {
    try {

      //pagination
      let page = req.query.page || 1;
      let limit = 9;
      let skip = (page - 1) * limit;
      let endIndex = page * limit;

      //product search
      let productName = req.query.productName || "";
      let filterCategory = req.query.category || 'All'
      const regex = new RegExp(productName, "i");

      let filterCondition = [{ productName: regex }]

      if (filterCategory !== 'All') {
        filterCondition.push({ 'category': filterCategory });
      }

      let products = await Product.find({ $and: filterCondition }).skip(skip).limit(endIndex).populate('category').lean();
      let categorys = await Category.find().lean();

      res.render("admin/products", {
        tittle: "GadgetStore | Admin products",
        message: req.flash(),
        products,
        categorys,
        filterCategory,
        productName
      });
    } catch (error) {
      next(error);
    }
  },

  adminProductDetails: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let product = await Product.findById(productId).populate("category");

      res.render("admin/product-details", {
        tittle: "GadgetStore | Product Details",
        product,
      });
    } catch (error) {
      next(error);
    }
  },

  productList: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let isListed = true;
      await Product.findOneAndUpdate({ _id: productId }, { isListed });
      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  productUnlist: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let isListed = false;
      await Product.findOneAndUpdate({ _id: productId }, { isListed });
      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  addProductsPage: async (req, res, next) => {
    try {
      let categorys = await Category.find().lean();
      res.render("admin/add-products", {
        tittle: "GadgetStore | Admin Add product",
        categorys: categorys,
        message:req.flash()
      });
    } catch (error) {
      next(error);
    }
  },

  addProduct: async (req, res, next) => {
    try {
        let { productName, price, brand, category, specification, description, stock } = req.body;
      
      //input validation
      let result = productInputValidation(productName, price, brand, description, stock);
      if (!result.validation) {
        req.flash(`${result.input}`, `Invalid ${result.input}`);
        return res.redirect('/admin/product/add');
      };
      
      //product images
      let images = req.files;
      let imagesPaths = [];
      let basePath = `/uploads/`;
      if (!images) {
        throw new Error("no image in the request");
      }
      
      //push the images paths to array
      images.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });

      let product = await Product.create({
        productName,
        price,
        category,
        brand,
        description,
        images: imagesPaths,
        stock,
        specification
      });

      if (!product) {
        req.flash("error", "The product cannot be created");
      } else {
        req.flash("message", "product add was successful");
      }

      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  editProductPage: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let product = await Product.findOne({ _id: productId }).populate(
        "category"
      );
      let categorys = await Category.find().lean();
      res.render("admin/edit-product", {
        tittle: "GadgetStore | Admin edit Product",
        message: req.flash(),
        product,
        categorys,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteOldImage: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let imageIndex = req.params.index;
      let product = await Product.findOne({ _id: productId });
      let image = product.images[imageIndex];
      // delete the image in the upload folder
      fs.unlinkSync(`public${image}`);

      //delete the image in db
      await Product.findOneAndUpdate(
        { _id: productId },
        { $pull: { images: image } }
      );
      res.json("done");
    } catch (error) {
      next(error);
    }
  },

  cropImage: async (req, res, next) => {
    try {
      let image = req.file;
      let imageIndex = req.params.index;
      let productId = req.params.product_id
      let product = await Product.findOne({ _id: productId });
      let productImage = product.images[imageIndex];

      //update image in db
      let updateQuery = {
        $set: {
          [`images.${imageIndex}`]: `/uploads/${image.filename }`
        }
      };
      
      await Product.findOneAndUpdate({ _id: productId }, updateQuery);

      //delete the old image from server
      fs.unlink(`public${productImage}`, (err, data) => {
        if (err) {
          console.log(err);
        }
      });
      req.flash('message', 'image cropped');
      res.json("sucsses");
    } catch (error) {
      next(error)
    }
  },

  editProduct: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let {
        productName,
        price,
        brand,
        category,
        description,
        stock,
        specification,
      } = req.body;

      //input validation
      let result = productInputValidation(productName, price, brand, description, stock);
      if (!result.validation) {
        req.flash(`${result.input}`, `Invalid ${result.input}`);
        return res.redirect(`/admin/product/${productId}/edit`);
      };

      //product images
      let newImages = req.files;
      let imagesPaths = [];
      let basePath = `/uploads/`;

      let updateFields = {
        productName,
        price,
        brand,
        category,
        description,
        stock,
        specification,
      };

      // Process new images
      if (newImages) {
        newImages.map((file) => {
          imagesPaths.push(`${basePath}${file.filename}`);
        });
        updateFields.$push = { images: { $each: imagesPaths } };
      }

      let product = await Product.findOneAndUpdate(
        { _id: productId },
        updateFields,
        { new: true }
      );
      if (!product) {
        req.flash("error", "Failed to update product. Please try again.");
      } else {
        req.flash("message", "Product updated successfully.");
      }

      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  deleteProduct: async (req, res, next) => {
    try {
      let productId = req.params.product_id;
      let product = await Product.findOneAndDelete({ _id: productId });
      let images = product.images;

      //delete the product images
      images.forEach((image) => {
        fs.unlinkSync(`public${image}`);
      });

      res.redirect("/admin/products");
    } catch (error) {
      next(error);
    }
  },

  productSearch: async (req, res, next) => {
    try {
      let productName = req.query.productName;

      const regex = new RegExp(productName, "i");

      let products = await Product.find({
        productName: regex,
      }).lean();

      let categorys = await Category.find().lean();

      if (!products) {
        req.flash("message", "No products found");
      }

      res.render("admin/products", {
        tittle: "GadgetStore | Admin products",
        message: req.flash(),
        products,
        categorys,
      });
    } catch (error) {
      next(error);
    }
  },

  //admin users
  adminUsers: async (req, res, next) => {
    try {
      let allUsers = await User.find().lean();
      res.render("admin/users", {
        tittle: "GadgetStore | Admin Users",
        users: allUsers,
      });
    } catch (error) {
      next(error);
    }
  },

  adminUserdetails: async (req, res) => {
    try {
      let userId = req.params.user_id;
      let user = await User.findOne({ _id: userId });
      res.render("admin/user-details", {
        tittle: "GadgetStore | Admin User",
        user,
      });
    } catch (error) {}
  },

  adminUserBlock: async (req, res, next) => {
    try {
      let userId = req.params.user_id;
      let status = "blocked";
      await User.updateOne({ _id: userId }, { accountStatus: status });
      res.redirect(`/admin/user/${userId}/view`);
    } catch (error) {
      next(error);
    }
  },

  adminUserUnblock: async (req, res, next) => {
    try {
      let userId = req.params.user_id;
      let status = "verified";
      await User.updateOne({ _id: userId }, { accountStatus: status });
      res.redirect(`/admin/user/${userId}/view`);
    } catch (error) {
      next(error);
    }
  },

  adminCategory: async (req, res, next) => {
    try {
      let categorys = await Category.find();
      res.render("admin/category", {
        tittle: "GadgetStore | Admin Category",
        categorys,
        message:req.flash()
      });
    } catch (error) {
      next(error);
    }
  },

  addCategory: async (req, res, next) => {
    try {
      let categoryName = req.body.categoryName;

      if (/^[A-Za-z]+$/.test(categoryName)) {

        let iscategory = await Category.findOne({ categoryName: new RegExp("^" + categoryName + "$", 'i') });

        //check if category already exists
        if (iscategory) {
          req.flash('error', 'Category already exists');
          return res.redirect('/admin/category');
        };

        await Category.create({ categoryName });
        req.flash('message', 'Category Created');
        res.redirect('/admin/category');
        
      } else {
        req.flash('error', 'Invalid Input');
        res.redirect('/admin/category');
      }
    } catch (error) {
      next(error);
    }
  },

  editCategoryPage: async (req, res, next) => {
    try {
      let categoryId = req.params.category_id;
      let category = await Category.findOne({ _id: categoryId });
      res.render('admin/edit-category', {
        tittle: 'GadgetStore | Edit Category',
        category,
        message: req.flash()
      })
    } catch (error) {
      next(error);
    }
  },

  editCategory: async(req, res, next)=>{
    try {
      let categoryId = req.params.category_id;
      let { categoryName } = req.body;
      let result = isValidInput(categoryName);
      if (!result) {
        req.flash('error', 'Invalid Input');
        return res.status(200);
      };
      let category = await Category.findOneAndUpdate({ _id: categoryId }, { $set: { categoryName } });
      if (!category) {
        req.flash('error', 'not updated');
        return res.status(200);
      }
      
      req.flash('message', 'Category edited');
      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      let categoryId = req.params.id;
      await Category.deleteOne({ _id: categoryId });
      res.redirect("/admin");
    } catch (error) {
      next(error);
    }
  },

  adminOrdersPage: async (req, res, next) => {
    try {
      let orders = await Order.find().populate('user_id').sort({orderDate:-1});
      res.render('admin/orders', {
        tittle: 'GadgetStore | Admin Orders',
        orders
      });
    } catch (error) {
      next(error);
    }
  },

  adminOrderDetails: async (req, res, next) => {
    try {
      let orderId = req.params.order_id;
      let order = await Order.findOne({ _id: orderId })
        .populate('user_id')
        .populate('orderAddress')
        .populate('items.product')
      
      let returnDetails  = await OrderReturn.findOne({ order_id: order._id });
      
      res.render('admin/order-details', {
        tittle: 'GadgetStore | Order Details',
        order,
        returnDetails
      })
    } catch (error) {
      next(error);
    }
  },

  adminOrderStatus: async (req, res, next) => {
    try {
      let orderId = req.params.order_id;
      let status = req.body;
      let order = await Order.findOneAndUpdate({ _id: orderId }, { $set: { orderStatus: status.orderStatus } });
      
      res.status(200).json('done');
    } catch (error) {
      next(error);
    }
  },

  returnOrder: async (req, res, next) => {
    try {
      let orderId = req.params.order_id;
      console.log(orderId)
      let returnDetails = await OrderReturn.findOne({ order_id: orderId });

      if (returnDetails) {
        let order = await Order.findOneAndUpdate({ _id: orderId }, { $set: { orderStatus: 'Return Accepted' } });
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

        //updateing stocks of non damage products
        if (returnDetails.reason !== 'Damaged') {
          order.items.forEach(async (item) => {
            let product = await Product.findOne({ _id: item.product });
            let currentStock = product.stock + item.quantity;
            await Product.updateOne({ _id: item.product }, { $set: { stock: currentStock } });
          });
        };
      } else {
        res.status(500).json({ success: false });
      }
     
      res.status(200).json({ success: true });

    } catch (error) {
      next(error);
    }
  },

  couponsPage: async (req, res, next) => {
    try {
      let coupons = await Coupon.find();
      res.render('admin/coupons', {
        tittle: 'GadgetStore | Coupons',
        message: req.flash(),
        coupons
      })
    } catch (error) {
      next(error);
    }
  },

  addCouponPage: async (req, res, next) => {
    try {
      res.render('admin/add-coupon', {
        tittle:'GadgetStore | Coupons'
      })
    } catch (error) {
      next(error);
    }
  },

  addCoupon: async (req, res, next) => {
    try {
      let { couponName, description, discount, expriyDate } = req.body;
      let code = uuidv4()
      let newCoupon = await Coupon.create({
        couponName,
        description,
        discount,
        code,
        expriyDate,
      });
      if (!newCoupon) {
        req.flash('error', 'coupon not created');
      }

      req.flash('message', 'Coupon Created');
      res.redirect('/admin/coupons');
    } catch (error) {
      next(error);
    }
  },

  deleteCoupon: async (req, res, next) => {
    try {
      let couponId = req.params.id;
      let coupon = await Coupon.findOneAndDelete({ _id: couponId });
      if (coupon) {
        res.status(200).json({ success: true });
      }
    } catch (error) {
      next(error);
    }
  }

};
