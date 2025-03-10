const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const handleErrorAsync = require('../utils/handleErrorAsync');
const creditPackageController = require('../controllers/creditPackage')

router.get('/', handleErrorAsync(creditPackageController.getCreditPackage))

router.post('/', handleErrorAsync(creditPackageController.postCreditPackage))

router.post('/:creditPackageId', auth,handleErrorAsync(creditPackageController.postCreditPackageID))

router.delete('/:creditPackageId', auth, handleErrorAsync(creditPackageController.deleteCreditPackageID))

module.exports = router
