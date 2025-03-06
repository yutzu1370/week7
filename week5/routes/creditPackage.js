const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')

router.get('/', )

router.post('/', )

router.post('/:creditPackageId', auth, )

router.delete('/:creditPackageId', auth, )

module.exports = router
