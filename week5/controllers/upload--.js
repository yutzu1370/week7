const appError = require('../utils/appError');
const firebaseAdmin = require('firebase-admin')
const config = require('../config/index')
const firebaseAdmin = require('firebase-admin')
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(config.get('secret.firebase.serviceAccount')),
  storageBucket: config.get('secret.firebase.storageBucket')
})
const bucket = firebaseAdmin.storage().bucket()


const uploadController = {
    async postUploadImage(req, res, next) {
      console.log('收到請求！');
      if(!req.files) {
        return next(appError(400, "欄位未填寫正確"));
      }

      // 圖片上傳至 firebase
      // 取得上傳的檔案資訊列表裡面的第一個檔案
      const file = req.files[0]

      // 可使用 uuid 或 日期 產生檔案名稱唯一值，避免重複的檔案名稱（記得需加上副檔名）
      const fileName = `${new Date().toISOString()}.${file.originalname.split('.').pop()}`

      // 將檔案上傳至特定的資料夾：
      // bucket.file('images/...')，這樣就會將圖片存放到 imagesTest 資料夾下
      // 資料夾不存在會自動幫你建立資料夾
      const blob = bucket.file(`imagesTest/${fileName}`)

      const blobStream = blob.createWriteStream();

      blobStream.on('finish', () => {
        const config = {
          action: 'read', // 必填, 讀取權限
          expires: Date.now() + 1000 * 60 * 60 * 24 // 必填, 網址的有效期限, 24 小時有效
        };
        
        // 取得檔案網址
        blob.getSignedUrl(config, (err, fileUrl) => {
          res.status(200).json({
            status: 'success',
            data: {
              image_url: fileUrl
            }
          })
        });
      });

      blobStream.on('error', (error) => {
        logger.error("上傳錯誤:", error)
        next(error)
      });

      blobStream.end(file.buffer)

      
    }
}

module.exports = uploadController