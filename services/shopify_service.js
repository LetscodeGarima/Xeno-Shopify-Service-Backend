import axios from "axios";
import pool from "../db.js"; // MySQL connection pool
import dotenv from "dotenv";
dotenv.config();

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const TENANT_ID = process.env.TENANT_ID;

// Function to fetch products from Shopify and save to DB
export const fetchAndSaveProducts = async () => {
  try {
    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-07/products.json`;
    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const products = response.data.products;

    for (let product of products) {
      const { id: product_id, title, variants } = product;
      const price = variants[0]?.price || 0;

      await pool.query(
        "INSERT INTO products (tenant_id, product_id, title, price) VALUES (?, ?, ?, ?)",
        [TENANT_ID, product_id, title, price]
      );
    }

    console.log(`${products.length} products saved to DB`);
  } catch (err) {
    console.error("Error fetching products:", err.message);
  }
};

// Function to fetch customers from Shopify and save to DB
export const fetchAndSaveCustomers = async () => {
  try {
    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-07/customers.json`;
    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const customers = response.data.customers;

    for (let customer of customers) {
      const { id: customer_id, first_name, last_name, email } = customer;

      await pool.query(
        "INSERT INTO customers (tenant_id, customer_id, first_name, last_name, email) VALUES (?, ?, ?, ?, ?)",
        [TENANT_ID, customer_id, first_name, last_name, email]
      );
    }

    console.log(`${customers.length} customers saved to DB`);
  } catch (err) {
    console.error("Error fetching customers:", err.message);
  }
};

// Function to fetch orders from Shopify and save to DB
export const fetchAndSaveOrders = async () => {
  try {
    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-07/orders.json`;
    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    const orders = response.data.orders;

    for (let order of orders) {
      const { id: order_id, customer, total_price } = order;
      const customer_id = customer ? customer.id : null;

      await pool.query(
        "INSERT INTO orders (tenant_id, order_id, customer_id, total_price) VALUES (?, ?, ?, ?)",
        [TENANT_ID, order_id, customer_id, total_price]
      );
    }

    console.log(`${orders.length} orders saved to DB`);
  } catch (err) {
    console.error("Error fetching orders:", err.message);
  }
};
