const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger')('UploadMiddleware');

// 檔案驗證設定
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = {
  'image/jpeg': true,
  'image/png': true
};

// 確保上傳目錄存在
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info('建立上傳目錄：', uploadDir);
}

const upload = async (req, res, next) => {
  try {
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      multiples: false,
      uploadDir: uploadDir,
      filter: function({ name, originalFilename, mimetype }) {
        const isValidType = mimetype && ALLOWED_FILE_TYPES[mimetype];
        if (!isValidType) {
          logger.warn(`不支援的檔案類型: ${mimetype}`);
        }
        return isValidType;
      }
    });

    // 使用 Promise 包裝 form.parse
    const formParse = () => {
      return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            logger.error('解析表單錯誤：', err);
            return reject(err);
          }
          resolve([fields, files]);
        });
      });
    };

    const [fields, files] = await formParse();
    logger.info('接收到的檔案：', JSON.stringify(files, null, 2));

    // 檢查檔案是否存在
    const fileField = files.file || files.files;
    if (!fileField || !fileField[0]) {
      logger.warn('未接收到檔案');
      return res.status(400).json({
        status: 'failed',
        message: '請選擇要上傳的檔案'
      });
    }

    // 將檔案信息添加到 request 物件
    req.uploadedFile = fileField[0];
    req.formFields = fields;

    next();
  } catch (error) {
    logger.error('檔案處理失敗：', error);
    if (error.message.includes('maxFileSize')) {
      return res.status(400).json({
        status: 'failed',
        message: '檔案大小超過限制（最大 2MB）'
      });
    }
    return res.status(400).json({
      status: 'failed',
      message: '檔案處理失敗，請確認檔案格式正確'
    });
  }
};

module.exports = upload; 