const express = require('express')

const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Upload')
const auth = require('../middlewares/auth')
const formidable = require('formidable')

//firebase套件使用 初始化
const firebaseAdmin = require('firebase-admin')
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(config.get('secret.firebase.serviceAccount')),
  storageBucket: config.get('secret.firebase.storageBucket')
})
const bucket = firebaseAdmin.storage().bucket()

//檔案上傳邏輯
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_FILE_TYPES = {
  'image/jpeg': true,
  'image/png': true
}

const router = express.Router()

router.post('/', auth, async  (req, res, next)=> {
    try {
      const form = formidable.formidable({
        multiple: false,//支援多檔上傳
        maxFileSize: MAX_FILE_SIZE,//檔案大小
        filter: ({ mimetype }) => {   //檔案格式
          return !!ALLOWED_FILE_TYPES[mimetype]
        }
      })
      const [fields, files] = await form.parse(req)
      logger.info('files')
      logger.info(files)
      logger.info('fields')
      logger.info(fields)
      const filePath = files.file[0].filepath
      const remoteFilePath = `images/${new Date().toISOString()}-${files.file[0].originalFilename}`
      await bucket.upload(filePath, { destination: remoteFilePath })
      const options = {
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000 //到期日
      }
      const [imageUrl] = await bucket.file(remoteFilePath).getSignedUrl(options)
      logger.info(imageUrl)
      res.status(200).json({
        status: 'success',
        data: {
          image_url: imageUrl
        }
      })
    } catch (error) {
      logger.error(error)
      next(error)
    }
  })

module.exports = router