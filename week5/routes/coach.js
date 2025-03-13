const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Coach')
const handleErrorAsync = require('../utils/handleErrorAsync');
const coachController = require('../controllers/coach')

router.get('/', handleErrorAsync(coachController.getCoaches))

router.get('/:coachId', handleErrorAsync(coachController.getCoachDetail))

router.get('/:coachId/courses', handleErrorAsync(coachController.getCoachCourses))

module.exports = router