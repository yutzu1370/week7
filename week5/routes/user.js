const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const handleErrorAsync = require('../utils/handleErrorAsync');
const userController = require('../controllers/user')

router.post('/signup', handleErrorAsync(userController.postSignUp));

router.post('/login', handleErrorAsync(userController.postLogin));

router.get('/profile', auth, handleErrorAsync(userController.getProfile));
router.put('/profile', auth, handleErrorAsync(userController.putProfile));
router.put('/password', auth, handleErrorAsync(userController.putPassword));
router.get('/credit-package', auth, handleErrorAsync(userController.getCreditPackage));
router.get('/courses', auth, handleErrorAsync(userController.getCourse));
module.exports = router