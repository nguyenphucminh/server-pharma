import express from "express";
import dotenv from "dotenv"
import connectDatabase from "./config/MongoDB.js"
import productRoute from "./Routes/ProductRoutes.js";
// CONFIG
dotenv.config() 
connectDatabase()

const app = express();
app.use(express.json());
//API 
app.use("/api/products", productRoute)

// Page Home
app.get("/", (req, res)=>{
    res.send("🚀  API is running....")
    console.log("🚀 API is running....")
})


// ZingMp3Router


// Page Error
app.get("*", (req, res) => {
    res.send("Nhập Sai Đường Dẫn! Vui Lòng Nhập Lại >.<")
});

const PORT = process.env.PORT
app.listen(PORT,console.log(`✨ Server run in port ${PORT}`));