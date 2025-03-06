const express = require('express')
const uploadController = require('../controllers/upload')
const auth = require('../middlewares/auth')
const uploadImage = require('../middlewares/uploadImage')
const handleErrorAsync = require('../utils/handleErrorAsync');

const router = express.Router()

router.post('/', auth, uploadImage, handleErrorAsync(uploadController.postUploadImage))

module.exports = router
