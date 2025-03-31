const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');

// Create payment intent
router.post('/create-payment-intent', fetchuser, createPaymentIntent);

// Confirm payment
router.post('/confirm-payment', fetchuser, confirmPayment);

module.exports = router;