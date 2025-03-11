const { dataSource } = require('../db/data-source')
const config = require('../config/index')
const bcrypt = require('bcrypt')
const validator = require('validator');
const { isUndefined, isNotValidString, isValidPassword } = require('../utils/validUtils')
const {generateJWT} = require('../utils/generateJWT')
const appError = require('../utils/appError')
const logger = require('../utils/logger')('UserController')


const userController = {
  async postSignUp (req, res, next)  {
    const { name, email, password } = req.body
    // 驗證必填欄位
    if (isUndefined(name) || isNotValidString(name) || isUndefined(email) || isNotValidString(email) || isUndefined(password) || isNotValidString(password)) {
      logger.warn('欄位未填寫正確')
      next(appError(400, '欄位未填寫正確'))
      return
    }
    if (!isValidPassword(password)) {
      logger.warn('建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
      next(appError(400,'密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'))
      return
    }
// 暱稱 name 長度需至少 2 個字元以上
  if(!validator.isLength(name,{ min: 3 })){
    return next(appError(400, '暱稱 name 長度需至少 2 個字元以上', next));
  }
// 信箱 email 格式正確
  if (!validator.isEmail(email)) {
    next(appError(400, "Email 格式錯誤"))
    return
  }


    const userRepository = dataSource.getRepository('User')
    // 檢查 email 是否已存在
    const existingUser = await userRepository.findOne({
      where: { email }
    })

    if (existingUser) {
      logger.warn('建立使用者錯誤: Email 已被使用')
      next(appError(409, 'Email 已被使用'))
      return
    }
    
    //saltRounds：指定「鹽（salt）」的計算輪數，用來增加哈希運算的強度，提高破解難度
    const saltRounds = 10
    // 建立新使用者
    const hashPassword = await bcrypt.hash(password, saltRounds)
    const newUser = userRepository.create({
      name,
      email,
      role: 'USER',
      password: hashPassword
    })

    const savedUser = await userRepository.save(newUser)
    console.log(savedUser)
    logger.info('新建立的使用者ID:', savedUser.id)

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: savedUser.id,
          name: savedUser.name
        }
      }
    })  
  },

  async postLogin (req, res, next)  {
    const { email, password } = req.body
    if (isUndefined(email) || isNotValidString(email) || isUndefined(password) || isNotValidString(password)) {
      logger.warn('欄位未填寫正確')
      next(appError(400, '欄位未填寫正確'))
      return
    }
    if (!isValidPassword(password)) {
      logger.warn('密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
      next(appError(400,'密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'))

      return
    }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
      select: ['id', 'name', 'role','password'],
      where: { email }
    })

    if (!existingUser) {
      next(appError(400,'使用者不存在或密碼輸入錯誤'))
      return
    }
    logger.info(`使用者資料: ${JSON.stringify(existingUser)}`)
    
    const isMatch = await bcrypt.compare(password, existingUser.password)
    if (!isMatch) {
      next(appError(400,'使用者不存在或密碼輸入錯誤'))
      return
    }
    const token = await generateJWT({
      id: existingUser.id,
      role: existingUser.role
    },config.get('secret.jwtSecret'), {
      expiresIn: `${config.get('secret.jwtExpiresDay')}`
    })

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          name: existingUser.name
        }
      }
    })
    
  },

  async getProfile (req, res, next)  {
    const { id } = req.user
    console.log(id);
    
    if(isNotValidString(id)){
      return next(appError(400, '欄位未填寫正確'));
    }
    const userRepository = dataSource.getRepository('User')
    const user = await userRepository.findOne({
      select: ['name', 'email'],
      where: { id }
    })

    res.status(200).json({
      status: 'success',
      data: {
        email: user.email,
        name: user.name
      }
    })
  },

  async putProfile (req, res, next)  {
    const { id } = req.user
    const { name } = req.body
    if (isUndefined(name) || isNotValidString(name)) {
      logger.warn('欄位未填寫正確')
      next(appError(400, '欄位未填寫正確'))
      return
    }

    const userRepository = dataSource.getRepository('User')
 //檢查使用者名稱為變更
    const user = await userRepository.findOne({
      select: ['name'],
      where: {
        id
      }
    })
    if (user.name === name) {
      next(appError(400, '使用者名稱未變更'))
      return
    }


    const updateUser = await userRepository.update({
      id
    }, {
      name
    })

    if (updateUser.affected === 0) {
      logger.warn('更新使用者資料失敗')
      next(appError(400, '更新使用者資料失敗'))
      return
    }

    res.status(200).json({
      status: 'success'
    })
  },

  async putPassword(req, res, next) {
    const { id } = req.user
		const { password, new_password, confirm_new_password } = req.body
		if (isNotValidString(password) || isNotValidString(new_password) || isNotValidString(confirm_new_password)) {
			return next(appError(400, '欄位未填寫正確'))
		}
		if (isValidPassword(password) || isValidPassword(new_password) || isValidPassword(confirm_new_password)) {
			return next(appError(400, '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'))
		}
		if (new_password === password) {
			return next(appError(400, '新密碼不能與舊密碼相同'))
		}
		if (new_password !== confirm_new_password ) {
			return next(appError(400, '新密碼與驗證新密碼不一致'))
		}
		const userRepo = dataSource.getRepository('User')
    const findUser = await userRepo.findOne({
      select: ['password'],
      where: { id }
    })

    if (!findUser) {
      return next(appError(400, '使用者不存在'))
    }

    const isMatch = await bcrypt.compare(password, findUser.password)
    
    if (!isMatch) {
      return next(appError(400, '密碼輸入錯誤'))
    }
    
    //const hashPassword = await bcrypt.hash(new_password, 10)

    // return next(appError(400, '密碼輸入錯誤'))
		
    // 密碼加密並更新資料
		//const hashPassword = 
		// return next(appError(400, '更新密碼失敗'))

		res.status(200).json({
			status: 'success',
			data: null,
		})
  }
}

module.exports = userController