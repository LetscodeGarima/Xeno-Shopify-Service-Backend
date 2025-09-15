import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";   // ✅ import cron

import dashboardRoutes from "./routes/dashboard.js";
import authRoutes from "./routes/authroutes.js";  

// Import the Shopify service functions
import { 
  fetchAndSaveProducts, 
  fetchAndSaveCustomers, 
  fetchAndSaveOrders 
} from "./services/shopify_service.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// MySQL Connection
// ---------------------
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database");
  }
});

// ---------------------
// Register routes
// ---------------------
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);

// ---------------------
// Root route
// ---------------------
app.get("/", (req, res) => {
  res.send("Shopify Data Ingestion Service is running 🚀");
});

// ---------------------
// Shopify ingestion routes (manual trigger)
// ---------------------
app.get("/ingest-products", async (req, res) => {
  try {
    await fetchAndSaveProducts();
    res.send("Products ingestion completed ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error ingesting products ❌");
  }
});

app.get("/ingest-customers", async (req, res) => {
  try {
    await fetchAndSaveCustomers();
    res.send("Customers ingestion completed ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error ingesting customers ❌");
  }
});

app.get("/ingest-orders", async (req, res) => {
  try {
    await fetchAndSaveOrders();
    res.send("Orders ingestion completed ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error ingesting orders ❌");
  }
});

// ---------------------
// Scheduler (Auto Sync)
// ---------------------
// This will run every hour (change cron expression as needed)
cron.schedule("0 * * * *", async () => {
  console.log("⏳ Running scheduled Shopify data sync...");

  try {
    await fetchAndSaveProducts();
    await fetchAndSaveCustomers();
    await fetchAndSaveOrders();
    console.log("✅ Shopify data sync completed!");
  } catch (err) {
    console.error("❌ Error in scheduled sync:", err);
  }
});

// ---------------------
// Start server
// ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});