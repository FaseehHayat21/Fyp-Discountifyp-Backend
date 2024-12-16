const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const multer = require('multer');   
const path = require('path');