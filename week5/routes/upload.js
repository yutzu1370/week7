const express = require('express');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const uploadController = require('../controllers/upload');

const router = express.Router();

router.post('/', auth, upload, uploadController.uploadImage);

module.exports = router;