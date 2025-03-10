const logger = require('../utils/logger')('Upload');
const { bucket } = require('../services/firebase');
const fs = require('fs');

const uploadController = {
  async uploadImage(req, res) {
    try {
      const file = req.uploadedFile;
      const filePath = file.filepath;
      const remoteFilePath = `images/${Date.now()}-${file.originalFilename}`;

      try {
        // 上傳到 Firebase
        await bucket.upload(filePath, {
          destination: remoteFilePath,
          metadata: {
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalFilename
            }
          }
        });

        // 上傳完成後刪除暫存檔案
        fs.unlinkSync(filePath);
        logger.info('暫存檔案已刪除：', filePath);

        // 取得檔案 URL
        const options = {
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000
        };

        const [imageUrl] = await bucket.file(remoteFilePath).getSignedUrl(options);
        logger.info('上傳成功，圖片 URL：', imageUrl);

        res.status(200).json({
          status: 'success',
          data: {
            image_url: imageUrl
          }
        });
      } catch (uploadError) {
        // 如果上傳失敗，也要刪除暫存檔案
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info('清理暫存檔案：', filePath);
        }
        throw uploadError;
      }
    } catch (error) {
      logger.error('上傳圖片失敗：', error);
      res.status(500).json({
        status: 'failed',
        message: error.message || '圖片上傳失敗'
      });
    }
  }
};

module.exports = uploadController;