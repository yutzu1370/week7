const config = require('../config/index');
const firebaseAdmin = require('firebase-admin');
const logger = require('../utils/logger')('Firebase');

let bucket;

try {
  // Firebase 初始化
  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(config.get('secret.firebase.serviceAccount')),
      storageBucket: config.get('secret.firebase.storageBucket')
    });
    logger.info('Firebase 初始化成功');
  }

  bucket = firebaseAdmin.storage().bucket();
} catch (error) {
  logger.error('Firebase 初始化失敗：', error);
  throw error;
}

module.exports = {
  bucket,
  firebaseAdmin
};