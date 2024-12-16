const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], // Array to store image URLs
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }], // References to students who liked the post
  comments: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, 
    text: { type: String, required: true }, 
    date: { type: Date, default: Date.now }
  }], 
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
