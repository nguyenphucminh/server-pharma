import express from 'express'
import asyncHandler from 'express-async-handler'
import Product from '../Models/ProductModel.js'
import HistoryNotification from "./../Models/HistoryNotification.js";
import moment from 'moment';
import { protect, admin } from "../Middleware/AuthMiddleware.js";
import multer from "multer"
import cors from "cors"
import Category from '../Models/CategoryModel.js';
import { ConfigNotify } from '../Services/push-notification.service.js';
const productRoute = express.Router();
const day = moment(Date.now());

productRoute.use(cors())
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});

//GET ALL PRODUCT
productRoute.get("/",
  asyncHandler(async (req, res) => {
    const pageSize = 9;
    const currentPage = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword && req.query.keyword !== ' ' ? {
      name: {
        $regex: req.query.keyword,
        $options: "i"
      },

    } : {}
    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (currentPage - 1))

    const totalPage = [];
    for (let i = 1; i <= Math.ceil(count / pageSize); i++) {
      totalPage.push(i)
    }
    res.json({ products, currentPage, totalPage });

    console.log(`✏️  ${day.format('MMMM Do YYYY, h:mm:ss a')} getMultiProduct 👉 Get: 200`)
  })
)
// SEARCH PRODUCT FOR APP
productRoute.get("/search",
  asyncHandler(async (req, res) => {


    const keyword = req.query.keyword && req.query.keyword !== ' ' ? {
      name: {
        $regex: req.query.keyword,
        $options: "i"
      },

    } : {}
    const products = await Product.find({ ...keyword }).populate('category', '_id').populate('categoryDrug', '_id')
    res.json(products);
  })
)
// ANALYTICS QUANTITY IN STOCK PRODUCT
productRoute.get("/analytics", async (req, res) => {
  try {
    const categories = await Category.find();
    let earnings = {

    }

    for (let i = 0; i < categories.length; i++) {
      let valueEarnings = await fetchCategoryWiseProduct(categories[i]._id);
      let nameCat = categories[i].name
      earnings[nameCat] = valueEarnings
    }
    res.json(earnings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function fetchCategoryWiseProduct(id) {
  const products = await Product.find({});
  let earnings = 0;
  for (let i = 0; i < products.length; i++) {
    if (products[i].category.toHexString() === id.toHexString()) {
      earnings += products[i].countInStock
    }
  }
  return earnings;
}
// ADMIN GET ALL PRODUCT WITHOUT SEARCH AND PAGINATION
productRoute.get(
  "/allproduct",
  protect,
  async (req, res) => {
    const products = await Product.find().populate('category', '_id name').populate('categoryDrug', '_id name').sort({ _id: -1 });
    res.json(products);
  });

productRoute.get("/all",
  protect,
  asyncHandler(async (req, res) => {
    const pageSize = 10;
    const currentPage = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword && req.query.keyword !== ' ' ? {
      name: {
        $regex: req.query.keyword,
        $options: "i"
      },
    } : {}
    const handleSortPrice = (() => {
      switch (req.query.sort) {
        case "cheap":
          return {
            price: { $lte: 100 }
          }
        case "expensive":
          return {
            price: { $gte: 100 }
          }
        default: return {}
      }
    })
    const sortValue = req.query.sort ? handleSortPrice() : {}
    const count = await Product.countDocuments({ ...keyword, ...sortValue });
    const products = await Product.find({ ...keyword, ...sortValue }).populate('category', '_id name').populate('categoryDrug', '_id name')
      .limit(pageSize)
      .skip(pageSize * (currentPage - 1))
      .sort({ _id: -1 });
    const totalPage = [];
    for (let i = 1; i <= Math.ceil(count / pageSize); i++) {
      totalPage.push(i)
    }
    console.log(sortValue)
    res.json({ products, currentPage, totalPage });

    console.log(`✏️  ${day.format('MMMM Do YYYY, h:mm:ss a')} getMultiProduct 👉 Get: 200`)
  })
)

// GET FOR WEB AND APP
productRoute.get("/:id/categories",
  asyncHandler(async (req, res) => {
    const product = await Product.find().populate('category', '_id name').populate('categoryDrug', '_id name')
    const productCategories = product.filter(item => item?.category?._id.toHexString() === req.params.id)
    res.json(productCategories)
  })
)

productRoute.get("/:id/categories-drug",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.find().populate('categoryDrug', '_id name')
    const productCategoriesDrug = product.filter(item => item?.categoryDrug?._id.toHexString() === req.params.id)
    res.json(productCategoriesDrug)
  })
)

//GET SINGLE PRODUCT
productRoute.get("/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', '_id name').populate('categoryDrug', '_id name');
    if (product) {
      res.json(product);
      console.log(`✏️  ${day.format('MMMM Do YYYY, h:mm:ss a')} getDetailProduct 👉 Get: 200`)
    }
    else {
      console.error(`⛔  ${day.format('MMMM Do YYYY, h:mm:ss a')} Product not found`)
      res.status(404)
      throw new Error(`⛔ Product not found`)
    }
  })
)

// PRODUCT REVIEW
productRoute.post(
  "/:id/review",
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      if (alreadyReviewed) {
        res.status(400);
        throw new Error("Product already reviewed");
      }
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numberReviews = product.reviews.length;
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

      await product.save();
      res.status(201).json({ message: "Reviewed Added" });
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);


// DELETE PRODUCT
productRoute.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.remove();
      res.json({ message: "Product deleted" });
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

// CREATE PRODUCT
productRoute.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, price, description, image, countInStock, category, categoryDrug, unit, regisId, expDrug, statusDrug, capacity } = req.body;
    const productExist = await Product.findOne({ name, unit });
    if (productExist) {
      res.status(400);
      throw new Error("Product name already exist");
    } else {
      const product = new Product({
        name,
        price,
        description,
        image: `/upload/${image}`,
        countInStock,
        category,
        categoryDrug,
        unit,
        capacity,
        regisId,
        expDrug,
        statusDrug,
        user: req.body._id
      });
      if (product) {
        const message = {
          headings: "Phòng Khám đa khoa Mỹ Thạnh",
          contents: `Thuốc ${product.name} đã được thêm mới vào kho`,
          bigPicture: '192.168.4.109:5000' + product.image
        }
        console.log(message)
        ConfigNotify(message)
        await HistoryNotification.saveNotification(message)
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
      } else {
        res.status(400);
        throw new Error("Invalid product data");
      }
    }
  })
);
// UPDATE PRODUCT
productRoute.put(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, price, description, image, countInStock, category, categoryDrug, unit, regisId, expDrug, statusDrug, capacity } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.image = product.image === image ? product.image : `/upload/${image}`
      product.countInStock = countInStock || product.countInStock;
      product.category = category || product.category
      product.categoryDrug = categoryDrug || product.categoryDrug,
        product.unit = unit || product.unit,
        product.capacity = capacity || product.capacity,
        product.regisId = regisId || product.regisId,
        product.expDrug = expDrug,
        product.statusDrug = statusDrug
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  })
);

// Single File Route Handler
productRoute.post("/single", upload.single("image"), (req, res) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
  res.json(file)
});

// Multiple Files Route Handler
productRoute.post("/multiple", upload.array("images", 3), (req, res) => {
  return res.status(200).send(req.file)
});
export default productRoute