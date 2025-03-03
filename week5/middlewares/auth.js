const { dataSource } = require('../db/data-source')
const appError = require('../utils/appError')
const { verifyJWT } = require('../utils/generateJWT')
const logger = require('../utils/logger')('Auth')

const auth = async (req, res, next) => {
  try {
    // Authorization: Bearer xxxxxxx.yyyyyyy.zzzzzzz
    // 確認 token 是否存在並取出 token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      // 401: 你尚未登入！
      next(appError(401, '你尚未登入！'))      
      return 
    }

    const token = authHeader.split(' ')[1]

    // 驗證 token=xxxxxxx.yyyyyyy.zzzzzzz
    const decoded = await verifyJWT(token)
    /* decode = {
      {
        id: existingUser.id,
        role: existingUser.role
      }
    */
    // 在資料庫尋找對應 id 的使用者
    // 401: '無效的 token'
    const currentUser = await dataSource.getRepository('User').findOne({
      where: { id: decoded.id }
    })
    if(!currentUser) {
      next(appError(401, '無效的 token'))
      return
    }
    // 在 req 物件加入 user 欄位
    req.user = currentUser
    next();
  } catch (error) {
    logger.error(error.message)
    next(error)
  }
};

module.exports = auth