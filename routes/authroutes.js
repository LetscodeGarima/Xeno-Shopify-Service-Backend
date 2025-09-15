import express from "express"; 
import pool from "../db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt"; 
dotenv.config();

const router = express.Router();

// ----------------------
// Register route
// ----------------------
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) 
    return res.status(400).json({ message: "Name, email and password are required" });

  try {
    // Check if user exists
    const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    await pool.query(
      "INSERT INTO users (tenant_id, name, email, password) VALUES (?, ?, ?, ?)",
      [process.env.TENANT_ID, name, email, hashedPassword]
    );

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// Login route
// ----------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) 
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) 
      return res.status(401).json({ message: "User not found" });

    const userRecord = users[0];

    // Compare password with bcrypt
    const isValid = await bcrypt.compare(password, userRecord.password);
    if (!isValid) 
      return res.status(401).json({ message: "Invalid credentials" });

    const user = { email: userRecord.email, id: userRecord.id };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;