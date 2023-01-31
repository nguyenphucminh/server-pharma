import express from "express";
import dotenv from "dotenv"
import connectDatabase from "./config/MongoDB.js"
import ImportData from "./ImportData.js"
import productRoute from "./Routes/ProductRoutes.js";
import userRouter from "./Routes/UserRoutes.js";
import { errorHandler, notFound } from "./Middleware/Errors.js";
import categoryRouter from "./Routes/CategoryRoutes.js"
import categoryDrugRouter from "./Routes/CategoryDrugRoutes.js"
import providerRoutes from "./Routes/ProviderRoutes.js";
import importStockRoutes from "./Routes/ImportStockRoutes.js"
import exportStockRoutes from './Routes/ExportStockRoutes.js';
// CONFIG
dotenv.config() 
connectDatabase()

const app = express();
app.use(express.json());
//API 
app.use("/api/import", ImportData)
app.use("/api/products", productRoute)
app.use("/api/users", userRouter);
app.use("/api/category", categoryRouter)
app.use("/api/category-drug", categoryDrugRouter)
app.use("/api/provider", providerRoutes)
app.use("/api/import-stock", importStockRoutes)
app.use("/api/export-stock", exportStockRoutes)
app.get("/api/config/paypal", (req, res) => {
    res.send(process.env.PAYPAL_CLIENT_ID);
  });
  app.use('/upload', express.static('uploads'));
//HOME
app.get("/", (req, res)=>{
    res.send("🚀  API is running....")
    console.log("🚀 API is running....")
})

// Page Error
app.get("*", (req, res) => {
    res.send("Nhập Sai Đường Dẫn! Vui Lòng Nhập Lại >.<")
});

const PORT = process.env.PORT
app.listen(PORT,console.log(`✨ Server run in port ${PORT}`));