const express = require('express')
const router = express.Router()
const logger = require('../utils/logger')('Admin')
const auth = require('../middlewares/auth')
const isCoach = require('../middlewares/isCoach')
const handleErrorAsync = require('../utils/handleErrorAsync');
const adminController = require('../controllers/admin')

//須注意前後順序，後者userId會被視為字串
router.post('/coaches/courses', auth, isCoach, handleErrorAsync(adminController.postCourses))

router.put('/coaches/courses/:courseId', auth, isCoach, handleErrorAsync(adminController.putCourse))

router.post('/coaches/:userId', handleErrorAsync(adminController.postUserToCoach))

router.get('/coaches/courses', auth, isCoach, handleErrorAsync(adminController.getCoachCourses))

router.get('/coaches/courses/:courseId', auth, isCoach, handleErrorAsync(adminController.getCoachCourseDetail))

router.get('/coaches', auth, isCoach, handleErrorAsync(adminController.getCoach))

module.exports = router