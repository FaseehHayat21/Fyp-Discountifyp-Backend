// const express = require('express')
// const mongoose = require('mongoose')
// const cors = require('cors')
// const path = require('path')
// const app = express()

// const bodyParser = require('body-parser');
// app.use(cors())
// app.use(express.json())
// app.use(bodyParser.json());

// app.use('/uploads', express.static('uploads'))
// mongoose.connect('mongodb://localhost:27017').then(
//     app.listen(1000, ()=>{
//         console.log("Discountify is Running")
//     })
// ).catch(()=>{
//     console.log("Datavase Error")
// })
// app.use('/api/auth', require('./Routes/auth'))
// app.use('/api/vendor', require('./Routes/vendor'))
// app.use("/api/admin",  require('./Routes/adminAuth') );




const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const paymentRoutes = require('./Routes/payment');

const app = express();
const server = http.createServer(app); // Create HTTP server for Express and Socket.IO

// Initialize Socket.IO
const io = socketIo(server, {
    cors: {
      origin: ['http://localhost:5174', 'http://localhost:5173'], // Allow both origins
      methods: ['GET', 'POST'], // Allow specific HTTP methods
    },
  });
  

// Socket.IO connection handling
io.on('connection', (socket) => {
    const { vendorId } = socket.handshake.query; // Pass vendorId during connection
    if (vendorId) {
      socket.join(vendorId); // Vendor joins a room named after their ID
      console.log(`Vendor ${vendorId} connected and joined room`);
    }
  
    socket.on('disconnect', () => {
      console.log(`Vendor ${vendorId} disconnected`);
    });
  });
  
// Middleware and Static Files
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));


// MongoDB Connection and Server Start
mongoose.connect('mongodb://localhost:27017')
  .then(() => {
    console.log('Connected to MongoDB');

    // Start the server on port 1000
    server.listen(1000, () => {
      console.log('Discountify server is running on port 1000');
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
  });

  module.exports.io = io;
// Routes
app.use('/api/auth', require('./Routes/auth'));
app.use('/api/vendor', require('./Routes/vendor'));
app.use('/api/admin', require('./Routes/adminAuth'));
app.use('/api/course', require('./Routes/course'));
app.use('/api/payment', paymentRoutes);
