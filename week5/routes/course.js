const express = require('express')
const { IsNull } = require('typeorm')

const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Course')
const auth = require('../middlewares/auth')
const handleErrorAsync = require('../utils/handleErrorAsync');
const courseController = require('../controllers/course')

router.get('/',handleErrorAsync(courseController.getCourses))

router.post('/:courseId', auth, handleErrorAsync(courseController.postCourse))

router.delete('/:courseId', auth, handleErrorAsync(courseController.deleteCourse))
module.exports = router
