const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const CourseMaterial = require('../models/CourseMaterial');
const Enrollment = require('../models/Enrollment')
const fetchuser = require('../middleware/fetchuser');
const upload = require('../middleware/upload');

// Create course with materials
router.post('/create', fetchuser, upload.array('materials', 10), async (req, res) => {
  try {
    const { title, description, category, duration, price } = req.body;
    const instructorId = req.user.id;

    // Validation
    if (!title || !description || !category || !duration) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    // Create course
    const course = new Course({
      title,
      description,
      instructor: instructorId,
      category,
      duration,
      price: price || 0
    });

    // Process materials if uploaded
    if (req.files && req.files.length > 0) {
      const materials = [];
      for (const file of req.files) {
        const material = new CourseMaterial({
          title: file.originalname,
          type: file.mimetype,
          fileUrl: `/uploads/${file.filename}`,
          category: req.body.materialCategories?.[file.fieldname] || 'Other',
          course: course._id
        });
        await material.save();
        materials.push(material._id);
      }
      course.materials = materials;
    }

    await course.save();
    
    return res.status(201).json({ 
      success: true, 
      course,
      message: 'Course created successfully'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error during course creation' 
    });
  }
});

// Add materials to existing course
router.post('/:courseId/materials', fetchuser, upload.array('materials', 10), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Verify instructor owns the course
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const newMaterials = [];
    for (const file of req.files) {
      const material = new CourseMaterial({
        title: file.originalname,
        type: file.mimetype,
        fileUrl: `/uploads/${file.filename}`,
        category: req.body.materialCategories?.[file.fieldname] || 'Other',
        course: course._id
      });
      await material.save();
      newMaterials.push(material._id);
    }

    course.materials.push(...newMaterials);
    await course.save();

    return res.status(201).json({ 
      success: true, 
      materials: newMaterials,
      message: 'Materials added successfully'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error while adding materials' 
    });
  }
});

router.get('/getAllCourse',  async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch courses' });
  }
});


router.get('/getAllCourse/instructor', fetchuser, async (req, res) => {
    try {
      const courses = await Course.find({ instructor: req.user.id })
        .populate('materials')
        .sort({ createdAt: -1 });
        
      res.status(200).json({ success: true, courses });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to fetch courses' });
    }
  });
router.get('/getCourse/:courseId', fetchuser, async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId)
        .populate('materials')
        .populate('instructor', 'name email');
        
      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }
      
      res.status(200).json({ success: true, course });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to fetch course' });
    }
  });
// Update course details
router.put('/editCourse/:courseId', fetchuser, async (req, res) => {
    try {
      const { title, description, category, duration, price } = req.body;
  
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }
  
      // Check if the instructor is the course owner
      if (course.instructor.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }
  
      // Update fields
      course.title = title || course.title;
      course.description = description || course.description;
      course.category = category || course.category;
      course.duration = duration || course.duration;
      course.price = price !== undefined ? price : course.price;
  
      await course.save();
  
      res.status(200).json({ success: true, course, message: 'Course updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Server error while updating course' });
    }
  });
  // Delete course and related materials
router.delete('/deleteCourse/:courseId', fetchuser, async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }
  
      // Check if the instructor is the course owner
      if (course.instructor.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }
  
      // Delete related materials
      await CourseMaterial.deleteMany({ course: course._id });
  
      // Delete course
      await course.deleteOne();
  
      res.status(200).json({ success: true, message: 'Course and its materials deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Server error while deleting course' });
    }
  });
  
  router.delete('/material/:materialId', fetchuser, async (req, res) => {
    try {
      const materialId = req.params.materialId;
  
      // Find material
      const material = await CourseMaterial.findById(materialId);
      if (!material) {
        return res.status(404).json({ success: false, error: 'Material not found' });
      }
  
      // Find course and ensure user owns it
      const course = await Course.findById(material.course);
      if (!course || course.instructor.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized or Course not found' });
      }
  
      // Remove material from course.materials array
      course.materials = course.materials.filter(id => id.toString() !== materialId);
      await course.save();
  
      // Delete material document
      await CourseMaterial.findByIdAndDelete(materialId);
  
      return res.status(200).json({ success: true, message: 'Material deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: 'Server error while deleting material' });
    }
  });
  



// POST /api/enroll/:courseId
// POST /api/enroll/:courseId
router.post('/enroll/:courseId', fetchuser, async (req, res) => {
  const studentId = req.user.id;
  const courseId = req.params.courseId;
  
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    
    const alreadyEnrolled = await Enrollment.findOne({ student: studentId, course: courseId });
    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, error: 'Already enrolled in this course' });
    }
    
    // For free courses, enroll directly
    if (course.price === 0) {
      const enrollment = new Enrollment({ student: studentId, course: courseId });
      await enrollment.save();
      return res.status(201).json({ success: true, message: 'Enrollment successful' });
    }
    
    // For paid courses, redirect to payment
    return res.status(200).json({ 
      success: true, 
      requiresPayment: true,
      courseId: courseId,
      price: course.price
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ success: false, error: 'Enrollment failed' });
  }
});



module.exports = router;