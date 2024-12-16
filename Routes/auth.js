const express = require("express");
const Student = require("../models/Student");
const StudentProfile = require("../models/StudentProfile");
const Vendor = require("../models/Vendor");
const VendorProfile = require("../models/VendorProfile");
const Deal = require('../models/Deal'); 
const AvailedDeal = require('../models/AvailedDeal');
const Post = require('../models/Posts');
const CV = require('../models/CV'); 
const Notification = require('../models/Notification'); 
const router = express.Router();
const bcrypt = require("bcryptjs");
const fetchuser = require('../middleware/fetchuser');
var jwt = require("jsonwebtoken");
const JWT_SECRET = "discountify";
const { body, validationResult } = require("express-validator");
const multer = require('multer');
const path = require('path');
const { io } = require('../index'); // Import `io` from the server file


const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');


// Environment Variables
const EMAIL_USER = "faseehhayat999@gmail.com";
const EMAIL_PASS = "ecvu makk dzjy cxja";

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail', // or use 'SMTP' with host and port for custom services
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

// Temporary store for OTPs
let otpStore = {};

// Endpoint to Send OTP
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP temporarily (e.g., in-memory store or database in production)
    otpStore[email] = { otp, expiry: Date.now() + 300000 }; // OTP valid for 5 minutes

    // Email Options
    const mailOptions = {
        from: EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (error) {
        console.error('Error sending OTP:', error.message);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Endpoint to Verify OTP
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    // Check if OTP exists and is valid
    const otpData = otpStore[email];
    if (!otpData || otpData.expiry < Date.now()) {
        return res.status(400).json({ error: 'OTP has expired or is invalid.' });
    }

    if (otpData.otp.toString() === otp.toString()) {
        // OTP is correct
        delete otpStore[email]; // Remove OTP after successful verification
        return res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
        return res.status(400).json({ error: 'Invalid OTP.' });
    }
});



// Multer storage and file handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // Specify your upload directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "_" + uniqueSuffix + path.extname(file.originalname)); 
  }
});

// File filter for multer, allowing only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only image files are allowed!'), false); // Reject other files
  }
};

// Multer instance with storage, file filter, and file size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limit file size to 5MB
  }
});

  ///////////////////////////////////////////////////////
 //                    Student Routes                 //
///////////////////////////////////////////////////////
  //Student Registration and login
  router.post( "/studentregister",
    [
      body("password").isLength({ min: 3 }).withMessage("Password must be at least 3 characters long."),
      body("email").isEmail().withMessage("Please enter a valid email address.")
        .custom((value) => {
          if (!value.endsWith("@students.au.edu.pk")) {
            throw new Error("Email must end with @students.au.edu.pk");
          }
          return true;
        }),
      body("semester").notEmpty().withMessage("Semester is required."),
      body("phoneNumber").isMobilePhone().withMessage("Please enter a valid phone number."),
      body("location").notEmpty().withMessage("Location is required."),
    ],
    async (req, res) => {
      let success = false;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        // Check if the user already exists
        let user = await Student.findOne({ email: req.body.email });
        if (user) {
          return res.status(400).json({ error: "Sorry, a user with this email already exists." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);

        // Create the user
        user = await Student.create({
          password: secPass,
          name: req.body.name,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          semester: req.body.semester,
          location: req.body.location,
        });
       

        // Automatically create a StudentProfile
        const profile = new StudentProfile({
          userId: user._id, // Associate this profile with the newly created user
          profilePhoto: '', // Can be updated later
          introduction: '', // Can be updated later
          name: req.body.name,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          semester: req.body.semester,
          location: req.body.location,
        });

        await profile.save();

        // Generate JWT token
        const data = {
          user: {
            id: user.id,
          },
        };
        const authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authToken });
      } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Some error occurred." });
      }
    }
  );
  //login
  router.post( "/student/login",
    [
      body("email").isEmail().withMessage("Please enter a valid email address."),
      body("password").exists().withMessage("Password is required."),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
    
      try {
        let success = true;
        let student = await Student.findOne({ email });
        if (!student) {
          success=false;
          return res.status(400).json({ error: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
          return res.status(400).json({ error: "Invalid credentials." });
        }

        const payload = {
          user: {
            id: student.id,
          },
        };

        const authToken = jwt.sign(payload, JWT_SECRET );

        res.json({ authToken,  userType: student.userType, success,userid: student.id});
      } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
      }
    }
  );
  //profile
  router.get('/studentprofile', fetchuser, async (req, res) => {
    try {
      const student = await StudentProfile.findOne({ userId: req.user.id }).populate('userId');
      // console.log(student)
      if (!student) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: 'Server Error' });
    }
  });
  // router.put('/studentprofile', fetchuser, async (req, res) => {
  //   try {
  //     // Get the user ID from the request object populated by the fetchuser middleware
  //     const userId = req.user.id;

  //     // Create an object with the fields to update
  //     const updateFields = {};
  //     if (req.body.introduction) updateFields.introduction = req.body.introduction;
  //     if (req.body.profilePhoto) updateFields.profilePhoto = req.body.profilePhoto;

  //     // Update the StudentProfile using the user ID from the token
  //     const updatedProfile = await StudentProfile.findOneAndUpdate(
  //       { userId },
  //       { $set: updateFields },
  //       { new: true }
  //     );

  //     // If no profile is found, return a 404 error
  //     if (!updatedProfile) {
  //       return res.status(404).json({ error: 'Profile not found' });
  //     }

  //     // If the student data in the Student schema needs updating as well
  //     const updatedStudent = await Student.findByIdAndUpdate(
  //       userId,
  //       { $set: req.body }, // Assuming the req.body contains fields to update in the Student schema
  //       { new: true }
  //     );

  //     // Respond with the updated profile
  //     res.json({ updatedProfile, updatedStudent });
  //   } catch (error) {
  //     console.error('Error updating profile:', error.message);
  //     res.status(500).json({ error: 'Server Error' });
  //   }
  // });
  //cv
  // router.put('/studentprofile', fetchuser, upload.single('profilePhoto'), async (req, res) => {
  //   try {
  //     const userId = req.user.id;
  //     const updateFields = {};
  
  //     // Check for uploaded profile photo
  //     console.log(req.body)
  //     if (req.file) {
  //       updateFields.profilePhoto = req.file.path; // Save file path
  //     }
  //     // Dynamically add all fields from req.body
  //       for (const key in req.body) {
  //         if (req.body[key]) {
  //           updateFields[key] = req.body[key];
  //           console.log(updateFields[key])
  //         }
  //       }
  
  //     const updatedProfile = await StudentProfile.findOneAndUpdate(
  //       { userId },
  //       { $set: updateFields },
  //       { new: true } // Return the updated document
  //     );
  
  //     if (!updatedProfile) {
  //       return res.status(404).json({ error: 'Profile not found' });
  //     }
  //     console.log(updatedProfile)
  //     res.json(updatedProfile);
  //   } catch (error) {
  //     console.error('Error updating profile:', error.message);
  //     res.status(500).json({ error: 'Server error' });
  //   }
  // });

  // router.put('/studentprofile', fetchuser, upload.single('profilePhoto'), async (req, res) => {
  //   try {
  //     const userId = req.user.id;
  //     const updateFields = {};
  //     const studentUpdateFields = {};
  
  //     // Check for uploaded profile photo
  //     console.log(req.body);
  //     if (req.file) {
  //       updateFields.profilePhoto = req.file.path; // Save file path
  //     }
  
  //     // Dynamically add all fields from req.body
  //     for (const key in req.body) {
  //       if (req.body[key]) {
  //         updateFields[key] = req.body[key];
  //         console.log(`Updating field: ${key} -> ${req.body[key]}`);
  //       }
  
  //       // Map fields that also belong to the Student schema
  //       if (['name', 'email', 'phoneNumber', 'semester', 'location'].includes(key)) {
  //         studentUpdateFields[key] = req.body[key];
  //       }
  //     }
  
  //     // Update the StudentProfile schema
  //     const updatedProfile = await StudentProfile.findOneAndUpdate(
  //       { userId },
  //       { $set: updateFields },
  //       { new: true } // Return the updated document
  //     );
  
  //     if (!updatedProfile) {
  //       return res.status(404).json({ error: 'Profile not found' });
  //     }
  
  //     // Update the Student schema
  //     const updatedStudent = await Student.findByIdAndUpdate(
  //       userId, // Assuming the userId corresponds to the Student ID
  //       { $set: studentUpdateFields },
  //       { new: true } // Return the updated document
  //     );
  
  //     if (!updatedStudent) {
  //       return res.status(404).json({ error: 'Student not found' });
  //     }
  
  //     console.log('Updated Student Profile:', updatedProfile);
  //     console.log('Updated Student:', updatedStudent);
  
  //     res.json({ profile: updatedProfile, student: updatedStudent });
  //   } catch (error) {
  //     console.error('Error updating profile and student:', error.message);
  //     res.status(500).json({ error: 'Server error' });
  //   }
  // });
  

  router.put('/studentprofile', fetchuser, upload.single('profilePhoto'), async (req, res) => {
    try {
      const userId = req.user.id;
      const updateFields = {};
      const studentUpdateFields = {};
  
      // Check for uploaded profile photo
      if (req.file) {
        updateFields.profilePhoto = req.file.path; // Save file path
      }
  
      // Dynamically add all fields from req.body
      for (const key in req.body) {
        if (req.body[key]) {
          // Add to updateFields
          if (key === 'skills') {
            // If skills, parse the JSON input or split a comma-separated string
            updateFields.skills = Array.isArray(req.body[key])
              ? req.body[key]
              : req.body[key].split(',').map((skill) => skill.trim());
          } else {
            updateFields[key] = req.body[key];
          }
          console.log(`Updating field: ${key} -> ${req.body[key]}`);
        }
  
        // Map fields that also belong to the Student schema
        if (['name', 'email', 'phoneNumber', 'semester', 'location'].includes(key)) {
          studentUpdateFields[key] = req.body[key];
        }
      }
  
      // Update the StudentProfile schema
      const updatedProfile = await StudentProfile.findOneAndUpdate(
        { userId },
        { $set: updateFields },
        { new: true } // Return the updated document
      );
  
      if (!updatedProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
  
      // Update the Student schema
      const updatedStudent = await Student.findByIdAndUpdate(
        userId, // Assuming the userId corresponds to the Student ID
        { $set: studentUpdateFields },
        { new: true } // Return the updated document
      );
  
      if (!updatedStudent) {
        return res.status(404).json({ error: 'Student not found' });
      }
  
      console.log('Updated Student Profile:', updatedProfile);
      console.log('Updated Student:', updatedStudent);
  
      res.json({ profile: updatedProfile, student: updatedStudent });
    } catch (error) {
      console.error('Error updating profile and student:', error.message);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  


  router.post('/cv',fetchuser, async (req, res) => {
  try {
    const cvData = req.body;
    // Find the student by ID
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Create and save the CV
    const cv = new CV({
      student: req.user.id,
      ...cvData,
    });
    await cv.save();

      res.status(201).json({ message: 'CV saved successfully!', cv });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Server Error' });
    }
   });

  ///////////////////////////////////////////////////////
 //                    Vendors Routes                 //
///////////////////////////////////////////////////////

// Vendor Registration And Login
  router.post( "/vendorregister",
  [
    body("name").notEmpty().withMessage("First Name is required."),
    body("email").isEmail().withMessage("Please enter a valid email address."),
    body("phoneNumber").isMobilePhone().withMessage("Please enter a valid phone number."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long."),
    body("address").notEmpty().withMessage("Address is required."),
    body("city").notEmpty().withMessage("City is required."),
    body("companyName").notEmpty().withMessage("Company Name is required."),
    body("companyAddress").notEmpty().withMessage("Company Address is required."),
    body("category").notEmpty().withMessage("Category is required.") // Validate category field
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

      try {
        // Check if the vendor already exists
        let vendor = await Vendor.findOne({ email: req.body.email });
        if (vendor) {
          return res.status(400).json({ error: "Vendor with this email already exists." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Create the vendor
      vendor = new Vendor({
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: hashedPassword,
        address: req.body.address,
        city: req.body.city,
        companyName: req.body.companyName,
        companyAddress: req.body.companyAddress,
        category: req.body.category, // Include category in vendor creation
      });

        await vendor.save();

        // Automatically create a VendorProfile
        const profile = new VendorProfile({
          vendorId: vendor._id, // Associate this profile with the newly created vendor
          profilePhoto: '', // Can be updated later
          introduction: '', // Can be updated later
        });

        await profile.save();

        // Generate JWT token
        const data = {
          vendor: {
            id: vendor.id,
          },
        };
        const authToken = jwt.sign(data, JWT_SECRET);

        res.json({ authToken });
      } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
      }
    }
  );
  router.post( "/vendor/login",
    [
      body("email").isEmail().withMessage("Please enter a valid email address."),
      body("password").exists().withMessage("Password is required."),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { email, password } = req.body;
  
      try {
        let success = true;
        let vendor = await Vendor.findOne({ email });
        if (!vendor) {
          return res.status(400).json({ error: "Invalid credentials." });
        }
  
        const isMatch = await bcrypt.compare(password, vendor.password);
        if (!isMatch) {
          return res.status(400).json({ error: "Invalid credentials." });
        }
  
        const payload = {
          user: {
            id: vendor.id,
            role: "vendor",
          },
        };
  
        const authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
        // res.json({ authToken,  userType: student.userType, success,userid: student.id});
        res.json({ authToken,userType: vendor.userType, success,userid: vendor.id });
      } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
      }
    }
  );
  router.post('/vendor/addDeal',fetchuser, upload.array('images', 5), async (req, res) => {
    try {
      const { title, description, discountPercentage, validUntil,originalPrice } = req.body;
      const vendor = await Vendor.findById(req.user.id);
      if (!vendor) {
        return res.status(404).json({ error: 'Student not found' });
    }
      // Get the image file paths
      const imagePaths = req.files.map(file => file.path); // Store paths of uploaded images
  
      // Create new deal
      const newDeal = new Deal({
        user: req.user.id, 
        title,
        description,
        discountPercentage,
        validUntil,
        originalPrice,
        images: imagePaths // Save image paths
      });
  
      const savedDeal = await newDeal.save();
      res.json(savedDeal);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
// Get Vendor By Cateogory
  router.get('/vendors', async (req, res) => {
    const category = req.query.category;
    try {
      const vendors = await Vendor.find({ category: category });
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  // Geting All categories
  router.get('/categories', async (req, res) => {
      try {
        const categories = await Category.find();
        res.json(categories);
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
  });
  // Fetching Vendor by cateogory
  router.get('/vendors/:category', async (req, res) => {
      try {
        const { category } = req.params;
        const vendors = await Vendor.find({ category: category });
        res.json(vendors);
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
  });
  // Getting Deals Provided by specific vendors
  router.get('/deals/:vendorId', async (req, res) => {
    try {
      const { vendorId } = req.params;
      console.log('Vendor ID:', vendorId);
  
      // Use the vendor field to query the deals
      const deals = await Deal.find({ user: vendorId });
  
      if (deals.length > 0) {
        console.log('Deals found:', deals);
      } else {
        console.log('No deals found for vendor:', vendorId);
      }
  
      res.json(deals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  router.get('/deals', async (req, res) => {
      try {
        const deals = await Deal.find();
        res.json(deals);
      
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
  });
  router.delete('/deals/:id', async (req, res) => {
    try {
      const deal = await Deal.findByIdAndDelete(req.params.id);
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      res.json({ message: 'Deal deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  //AVAILED DEAL
  // router.post('/avail-deal', async (req, res) => {
  //   try {
  //     const { studentId, dealId } = req.body;
  
  //     // Check if the student has already availed this deal
  //     const alreadyAvailed = await AvailedDeal.findOne({ student: studentId, deal: dealId });
  //     if (alreadyAvailed) {
  //       return res.status(400).json({ message: 'You have already availed this deal.' });
  //     }
  
  //     // Check if the deal is valid
  //     const deal = await Deal.findById(dealId);
  //     if (!deal) {
  //       return res.status(404).json({ message: 'Deal not found.' });
  //     }
  
  //     // Create a new availed deal record
  //     const availedDeal = new AvailedDeal({ student: studentId, deal: dealId });
  //     await availedDeal.save();
  
  //     return res.status(200).json({ message: 'Deal availed successfully.' });
  //   } catch (error) {
  //     return res.status(500).json({ message: 'An error occurred.', error: error.message });
  //   }
  // });
// Update a deal with optional image upload
router.post('/avail-deal', async (req, res) => {
  try {
    const { studentId, dealId } = req.body;
    console.log(studentId) 
    const alreadyAvailed = await AvailedDeal.findOne({ student: studentId, deal: dealId });
      if (alreadyAvailed) {
        return res.status(400).json({ message: 'You have already availed this deal.' });
      }
  
      // Check if the deal is valid
      const deals = await Deal.findById(dealId);
      if (!deals) {
        return res.status(404).json({ message: 'Deal not found.' });
      }
    if (!studentId || !dealId) {
      return res.status(400).json({ message: 'Missing required fields: studentId and dealId' });
    }

    const deal = await Deal.findById(dealId).populate('user');
    const student = await Student.findById(studentId);

    if (!deal || !student) {
      return res.status(404).json({ message: 'Invalid deal or student' });
    }
  
    // Emit notification to the specific vendor's room
    const vendorId = deal.user._id.toString(); // Ensure vendorId is a string
    io.to(vendorId).emit('deal-availed', {
      vendorId,
      studentName: student.name,
      dealTitle: deal.title,
    });
      // Save the notification to the database
   
      const notification = new Notification({
        vendorId,
        studentName: student.name,
        dealTitle: deal.title,
      });
      await notification.save();
        // Create a new availed deal record
      const availedDeal = new AvailedDeal({ student: studentId, deal: dealId });
      await availedDeal.save();
    res.status(200).json({ message: 'Deal availed and vendor notified' });
  } catch (error) {
    console.error('Error in avail-deal:', error.message);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});
////
router.get('/notifications/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { isRead, sort = 'createdAt', order = 'desc' } = req.query;

    const filter = { vendorId };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ [sort]: order === 'desc' ? -1 : 1 });
      
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

//////////
router.patch('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body; // Pass `isRead` in the request body

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error('Error updating notification:', error.message);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});






  ///////////////////////////////////////////////////////
 //                    POSTS Routes                   //
///////////////////////////////////////////////////////


// Route to create a new student post
  router.post('/create', fetchuser, upload.array('images', 5), async (req, res) => {
  try {
      const { title, description } = req.body;

      // Ensure that the student exists
      const student = await Student.findById(req.user.id);
      if (!student) {
          return res.status(404).json({ error: 'Student not found' });
      }

      // Process uploaded images
      let imageUrls = [];
      if (req.files) {
          imageUrls = req.files.map(file => `/uploads/${file.filename}`);
      }

      // Create a new post
      const newPost = new Post({
          user: req.user.id,  // Associate the post with the logged-in student
          title,
          description,
          images: imageUrls // Store the image URLs in the post
      });

      const savedPost = await newPost.save();
      return res.status(201).json({ post: savedPost, success: true, message: 'New post created' });
  } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
  }
  });
 router.get('/allposts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email') // Populate user details
      .populate('comments.user', 'name email'); // Populate comment user details
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

  // Like a post
  // router.put('/posts/like/:id', fetchuser, async (req, res) => {
  //   try {
  //     const post = await Post.findById(req.params.id);
  
  //     if (!post) {
  //       return res.status(404).json({ error: 'Post not found' });
  //     }
  
  //     if (!post.likes.includes(req.user.id)) {
  //       post.likes.push(req.user.id);
  //       await post.save();
  //     }
  
  //     return res.json({ success: true, likes: post.likes });
  //   } catch (error) {
  //     console.error('Error liking the post:', error.message);
  //     return res.status(500).json({ error: 'Server Error' });
  //   }
  // });
  router.put('/posts/like/:id', fetchuser, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
  
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      const userId = req.user.id;
  
      if (post.likes.includes(userId)) {
        // If user already liked, remove their like (unlike)
        post.likes = post.likes.filter((id) => id.toString() !== userId);
        await post.save();
        return res.json({ success: true, message: 'Post unliked', likes: post.likes.length });
      } else {
        // If user has not liked, add their like
        post.likes.push(userId);
        await post.save();
        return res.json({ success: true, message: 'Post liked', likes: post.likes.length });
      }
    } catch (error) {
      console.error('Error updating like/unlike:', error.message);
      return res.status(500).json({ error: 'Server Error' });
    }
  });
  
    // Comment on a post
    router.post('/post/comment/:postId', fetchuser, async (req, res) => {
      try {
        const { postId } = req.params;
        const { text } = req.body;
    
        if (!text.trim()) {
          return res.status(400).json({ error: 'Comment text cannot be empty' });
        }
    
        const post = await Post.findById(postId);
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }
    
        const comment = {
          user: req.user.id,
          text,
          date: new Date(),
        };
    
        post.comments.push(comment);
        await post.save();
    
        res.status(201).json(comment); // Return the newly added comment
      } catch (error) {
        console.error('Error adding comment:', error.message);
        res.status(500).json({ error: 'Server Error' });
      }
    });
    
  // Route to get all posts (for a specific student)
  router.get('/posts', fetchuser, async (req, res) => {
    try {
       
        const userId = req.user.id;
        
        const posts = await Post.find({ user: userId });
        
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
  });
  // Route to get all posts (for a All student)
  router.get('/posts', fetchuser, async (req, res) => {
    try {
       
        const userId = req.user.id;
        
        const posts = await Post.find({ user: userId });
        
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
  });


//get All Vendor details
router.get('/getAllVendor',   async (req, res) => {
  try {
    const user = await Vendor.find()
    res.send(user)

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})
//get All Student details
router.get('/getAllStudent',   async (req, res) => {
  try {
    const user = await Student.find()
    res.send(user)

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})
 
  module.exports = router;