const express = require('express')

const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')
const { isUndefined, isNotValidString, isNotValidInteger,isValidUUID } = require('../utils/validUtils')
const auth = require('../middlewares/auth')

router.get('/', async (req, res, next) => {
    try {
        const packages = await dataSource.getRepository("CreditPackage").find({
          select: ["id", "name", "credit_amount", "price"]
        })
       res.status(200).json({
            status: "success",
            data: packages
       })
      } catch (error) {
        next(error);
      }
})

router.post('/', async (req, res, next) => {
    try {
        const {name,credit_amount,price} = req.body

        //檢查欄位是否填寫正確，填寫錯誤則回傳400錯誤訊息
        if (isUndefined(name) || isNotValidString(name) ||
                isUndefined(credit_amount) || isNotValidInteger(credit_amount) ||
                isUndefined(price) || isNotValidInteger(price)) {
          res.status(400).json({
            status: "failed",
            message: "欄位未填寫正確",
          })
          return
        }
        //檢查資料是否重複
        const creditPackageRepo = await dataSource.getRepository("CreditPackage")
        const existPackage = await creditPackageRepo.find({
          where: {
            name: name
          }
        })
        //資料重複，則回傳409錯誤訊息
        if (existPackage.length > 0) {
          res.status(409).json({
            status: "failed",
            message: "資料重複"
          })
          return
        }
        //新增資料
        const newPackage = await creditPackageRepo.create({
          name: name,
          credit_amount: credit_amount,
          price: price
        })
        //存入資料庫
        const result = await creditPackageRepo.save(newPackage)

        //成功後，回傳資料並顯示在網站上
        res.status(200).json({
          status: "success",
          data: result
        })
        
      } catch (error) {
        next(error);
      }
})

router.post('/:creditPackageId', auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const { creditPackageId } = req.params
    const creditPackageRepo = dataSource.getRepository('CreditPackage')
    const creditPackage = await creditPackageRepo.findOne({
      where: {
        id: creditPackageId
      }
    })
    if (!creditPackage) {
      res.status(400).json({
        status: 'failed',
        message: 'ID錯誤'
      })
      return
    }
    const creditPurchaseRepo = dataSource.getRepository('CreditPurchase')
    const newPurchase = await creditPurchaseRepo.create({
      user_id: id,
      credit_package_id: creditPackageId,
      purchased_credits: creditPackage.credit_amount,
      price_paid: creditPackage.price,
      purchaseAt: new Date().toISOString()
    })
    await creditPurchaseRepo.save(newPurchase)
    res.status(200).json({
      status: 'success',
      data: null
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

router.delete('/:creditPackageId', async (req, res, next) => {
  try {
    //取得url特定ID
    const {creditPackageId} = req.params
    //檢查ID是否填寫正確，填寫錯誤則回傳400錯誤訊息
    if (isUndefined(creditPackageId) || isNotValidString(creditPackageId) || !isValidUUID(creditPackageId)) {
      res.status(400).json({
        status: "failed",
        message: "ID錯誤",
      })
      return
    }
    //刪除資料
    const result = await dataSource.getRepository("CreditPackage").delete(creditPackageId)
    //是否成功刪除，若無則回傳400錯誤訊息
    if (result.affected === 0) {
      res.status(400).json({
        status: "failed",
        message: "ID錯誤",
      })
      return
    }
    res.status(200).json({
      status: "success"
    })
  } catch (error) {
    next(error);
  }
})

module.exports = router
