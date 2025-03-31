const stripe = require('stripe')("idr apni private ki dalna");
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    
    // Check if already enrolled
    const alreadyEnrolled = await Enrollment.findOne({ student: userId, course: courseId });
    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, error: 'Already enrolled in this course' });
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(course.price * 100), // Convert to cents and ensure integer
      currency: 'usd',
      metadata: {
        courseId: courseId,
        userId: userId
      }
    });
    
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, courseId } = req.body;
    const userId = req.user.id;
    
    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, error: 'Payment unsuccessful' });
    }
    
    // Get course price for record
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({ 
      student: userId, 
      course: courseId,
      paymentId: paymentIntentId,
      paymentStatus: 'completed',
      paymentAmount: course.price,
      paymentDate: new Date()
    });
    
    await enrollment.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Enrollment successful' 
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm payment' });
  }
};