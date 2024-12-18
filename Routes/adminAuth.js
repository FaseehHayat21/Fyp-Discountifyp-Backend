const express = require("express");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const StudentProfile = require("../models/StudentProfile");
const VendorProfile = require("../models/VendorProfile");
const Feedback = require("../models/Feedback");
const Vendor = require("../models/Vendor");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin"); // Or use the User model if you added the role there
const { body, validationResult } = require("express-validator");

const router = express.Router();
const JWT_SECRET = "discountify"; // Replace with a secure secret

const checkIfAdmin = (req) => {
    const token = req.header("auth-token");
    if (!token) return false;
  
    try {
      const data = jwt.verify(token, JWT_SECRET);
      return data.user.role === "admin";
    } catch (error) {
      return false;
    }
  };

router.post(
    "/register",
    [
      body("email").isEmail().withMessage("Please enter a valid email."),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long."),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
      const {email, password } = req.body;
  
      try {
        // Check if admin already exists
        let admin = await Admin.findOne({ email });
        if (admin) return res.status(400).json({ error: "Admin with this email already exists." });
  
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
  
        // Create new admin
        admin = new Admin({
          email,
          password: hashedPassword,
        });
  
        await admin.save();
  
        // Generate JWT token
        const payload = {
          user: {
            id: admin.id,
            role: "admin",
          },
        };
        const authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  
        res.json({ authToken, message: "Admin registered successfully" });
      } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
      }
    }
  );


// Admin login route
router.post(
    "/login",
    [
      body("email").isEmail().withMessage("Please enter a valid email."),
      body("password").exists().withMessage("Password is required."),
    ],
    async (req, res) => {
        let success = true;
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
      const { email, password } = req.body;
      console.log(req.body);
  
      try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).json({ error: "Invalid credentials." });
  
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });
  
        // Generate JWT token with admin role
        const payload = {
          user: {
            id: admin.id,
            role: "admin",
          },
        };
        const authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  
        // Return authToken and userType
        res.json({ authToken, userType: "admin", success });
      } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
      }
    }
  );
  
// Get all users (students and vendors)
router.get("/users", async (req, res) => {
    
    try {
      const students = await Student.find();
      const vendors = await Vendor.find();
      res.json({ students, vendors });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });
  
  // Delete a user (either student or vendor)
  router.delete("/user/:id", async (req, res) => {
    const { id } = req.params;
    const userType = req.query.userType; // Retrieve userType from query
  
    if (!userType) {
      return res.status(400).json({ error: "User type is required." });
    }
  
    try {
      let user;
      let user2;
      if (userType === "Student") {
        user = await Student.findByIdAndDelete(id);
        user2 = await StudentProfile.findByIdAndDelete(id);
      } else if (userType === "Vendor") {
        user = await Vendor.findByIdAndDelete(id);
        user2 = await VendorProfile.findByIdAndDelete(id);

      } else {
        return res.status(400).json({ error: "Invalid user type specified." });
      }
  
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Server error" });
    }
  });
  router.delete("/feedbacks/:id", async (req, res) => {
    const { id } = req.params;
   
  
  
    try {
      let feed;
     
      feed = await Feedback.findByIdAndDelete(id);
    
  
      if (!feed) return res.status(404).json({ error: "Feedback not found" });
      res.json({ message: "Feedback deleted successfully" });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Server error" });
    }
  });
  
  // Update a user's details (student or vendor)
//   router.put("/user/:id", async (req, res) => {
    
    
//     const { userType, ...updateData } = req.body;
//     const { id } = req.params;
  
//     try {
//       let user;
//       if (userType === "student") {
//         user = await Student.findByIdAndUpdate(id, updateData, { new: true });
//       } else if (userType === "vendor") {
//         user = await Vendor.findByIdAndUpdate(id, updateData, { new: true });
//       } else {
//         return res.status(400).json({ error: "Invalid user type specified." });
//       }
  
//       if (!user) return res.status(404).json({ error: "User not found" });
//       res.json({ message: "User updated successfully", user });
//     } catch (error) {
//       res.status(500).json({ error: "Server error" });
//     }
//   });
  
//   // Get a single user by ID
//   router.get("/user/:id", async (req, res) => {
   
  
//     const { userType } = req.query; // Specify user type (student or vendor) in the query parameter
//     const { id } = req.params;
  
//     try {
//       let user;
//       if (userType === "student") {
//         user = await Student.findById(id);
//       } else if (userType === "vendor") {
//         user = await Vendor.findById(id);
//       } else {
//         return res.status(400).json({ error: "Invalid user type specified." });
//       }
  
//       if (!user) return res.status(404).json({ error: "User not found" });
//       res.json(user);
//     } catch (error) {
//       res.status(500).json({ error: "Server error" });
//     }
//   });
module.exports = router;