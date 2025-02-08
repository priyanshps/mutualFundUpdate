import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import _ from "lodash";
import NodeCache from "node-cache";


dotenv.config();
const router = express.Router();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
const cache = new NodeCache({ stdTTL: 86400 });



// Register
router.post("/register", async (req, res) => {
  try {
    const email = _.get(req, "body.email", "").trim().toLowerCase();
    const password = _.get(req, "body.password", "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
     // Validate email format
     if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters long, with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character." });
    }

    // Check if user already exists
    const existingUser = await User.aggregate([
      { $match: { email } },
      { $limit: 1 },
      { $project: { _id: 1 } },
    ]);

    if (_.size(existingUser) > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const user = await User.create({ email, password: hashedPassword });

    return res.status(201).json({ message: "User registered", userId: user._id });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login

router.post("/login", async (req, res) => {
  try {
    const email = _.get(req, "body.email", "").trim().toLowerCase();
    const password = _.get(req, "body.password", "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.aggregate([
      { $match: { email } },
      { $limit: 1 },
      { $project: { _id: 1, password: 1 } }, 
    ]);

    if (_.size(user) === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user[0].password); 
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user[0]._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    cache.set("loggedInUserId", user[0]._id);

    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
