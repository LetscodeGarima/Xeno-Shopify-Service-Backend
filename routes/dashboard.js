// backend/routes/dashboard.js
import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { Parser } from "json2csv";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// JWT Auth Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Total customers, orders, revenue
router.get("/summary", authenticateJWT, async (req, res) => {
  try {
    const [customers] = await pool.query(
      "SELECT COUNT(*) as total_customers FROM customers"
    );
    const [orders] = await pool.query(
      "SELECT COUNT(*) as total_orders, SUM(total_price) as total_revenue FROM orders"
    );

    res.json({
      total_customers: customers[0].total_customers,
      total_orders: orders[0].total_orders,
      total_revenue: orders[0].total_revenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching summary metrics");
  }
});

// Orders by date (with optional filters)
router.get("/orders-by-date", authenticateJWT, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT DATE(created_at) as date, 
             COUNT(*) as orders_count, 
             SUM(total_price) as revenue
      FROM orders
      WHERE 1=1
    `;
    const params = [];
    if (startDate) { query += " AND DATE(created_at) >= ?"; params.push(startDate); }
    if (endDate) { query += " AND DATE(created_at) <= ?"; params.push(endDate); }
    query += " GROUP BY DATE(created_at) ORDER BY DATE(created_at)";
    const [data] = await pool.query(query, params);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching orders by date");
  }
});

// Top 5 customers by spend
router.get("/top-customers", authenticateJWT, async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT ANY_VALUE(c.first_name) AS first_name,
              ANY_VALUE(c.last_name) AS last_name,
              ANY_VALUE(c.email) AS email,
              SUM(o.total_price) AS total_spent
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       GROUP BY o.customer_id
       ORDER BY total_spent DESC
       LIMIT 5`
    );
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching top customers");
  }
});

// Export Top Customers CSV
router.get("/export-top-customers", authenticateJWT, async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT ANY_VALUE(c.first_name) AS first_name,
              ANY_VALUE(c.last_name) AS last_name,
              ANY_VALUE(c.email) AS email,
              SUM(o.total_price) AS total_spent
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       GROUP BY o.customer_id
       ORDER BY total_spent DESC`
    );

    const parser = new Parser({ fields: ["first_name", "last_name", "email", "total_spent"] });
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("top_customers.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error exporting CSV");
  }
});

// Export All Orders CSV
router.get("/export-orders", authenticateJWT, async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT o.order_id, o.customer_id, c.first_name, c.last_name, c.email, o.total_price, o.created_at
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id`
    );

    const parser = new Parser({ fields: ["order_id", "customer_id", "first_name", "last_name", "email", "total_price", "created_at"] });
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error exporting CSV");
  }
});

// Revenue Growth %
router.get("/revenue-growth", authenticateJWT, async (req, res) => {
  try {
    const [lastWeek] = await pool.query(
      `SELECT SUM(total_price) as revenue 
       FROM orders 
       WHERE created_at >= CURDATE() - INTERVAL 7 DAY`
    );
    const [prevWeek] = await pool.query(
      `SELECT SUM(total_price) as revenue 
       FROM orders 
       WHERE created_at >= CURDATE() - INTERVAL 14 DAY 
       AND created_at < CURDATE() - INTERVAL 7 DAY`
    );

    const current = lastWeek[0].revenue || 0;
    const previous = prevWeek[0].revenue || 0;
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    res.json({ current, previous, growth: growth.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching revenue growth");
  }
});

// Average Order Value (AOV)
router.get("/aov", authenticateJWT, async (req, res) => {
  try {
    const [data] = await pool.query(`SELECT AVG(total_price) as aov FROM orders`);
    res.json({ aov: data[0].aov || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching AOV");
  }
});

// Repeat Customers
router.get("/repeat-customers", authenticateJWT, async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT COUNT(DISTINCT customer_id) as repeat_customers
       FROM orders
       WHERE customer_id IN (
         SELECT customer_id
         FROM orders
         GROUP BY customer_id
         HAVING COUNT(order_id) > 1
       )`
    );
    res.json({ repeat_customers: data[0].repeat_customers || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching repeat customers");
  }
});

export default router;