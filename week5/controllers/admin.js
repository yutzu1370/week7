const { dataSource } = require('../db/data-source')
const appError = require('../utils/appError')
const moment = require('moment')
const { isNotValidString, isNotValidInteger, isUndefined } = require('../utils/validUtils')
//const logger = require('../utils/logger')('AdminController')

const adminController = {
  async postCourses (req, res, next)  {
    const { user_id, skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body
    
    if(isNotValidString(user_id) || isNotValidString(skill_id) || isNotValidString(name)
    || isNotValidString(description) || isNotValidString(start_at) || isNotValidString(end_at)
    || isNotValidInteger(max_participants) || isNotValidString(meeting_url) || !meeting_url.startsWith('https')) {
      res.status(400).json({
        status : "failed",
        message: "欄位未填寫正確"
      })
      return
    }
    
    // 驗證日期格式 (ISO 8601 格式: YYYY-MM-DDTHH:mm:ssZ)
    if (!moment(start_at, moment.ISO_8601, true).isValid() || !moment(end_at, moment.ISO_8601, true).isValid()) {
      return res.status(400).json({
        status: "failed",
        message: "日期格式錯誤，請使用 ISO 8601 格式 (YYYY-MM-DDTHH:mm:ssZ)"
      })
    }

    // 確保開始時間早於結束時間
    if (moment(start_at).isAfter(moment(end_at))) {
      return res.status(400).json({
        status: "failed",
        message: "開始時間不能晚於結束時間"
      })
    }

    const userRepo = dataSource.getRepository('User')
    const findUser = await userRepo.findOne({
      where: { 
        id: user_id 
      }
    });

    if (!findUser) {
      res.status(400).json({
        status: "failed",
        message: "使用者不存在"
      })
      return 
    } else if(findUser.role !== 'COACH') {
      res.status(400).json({
        status: "failed",
        message: "使用尚未成為教練"
      })
      return 
    }

    const courseRepo = dataSource.getRepository('Course')
    const newCourse = courseRepo.create({
      user_id,
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url
    })
    const result = await courseRepo.save(newCourse)


    res.status(201).json({
      status: "success",
      data: {
        course: result
    }
  })
  },

  async putCourse (req, res, next)  {
    const { courseId } = req.params
    
    const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body
    if( isNotValidString(courseId)
    ||  isNotValidString(skill_id) || isNotValidString(name)
    || isNotValidString(description) || isNotValidString(start_at) || isNotValidString(end_at)
    || isNotValidInteger(max_participants) || isNotValidString(meeting_url) || !meeting_url.startsWith('https')) {
      res.status(400).json({
        status : "failed",
        message: "欄位未填寫正確"
      })
      return
    }

     // 驗證日期格式 (ISO 8601 格式: YYYY-MM-DDTHH:mm:ssZ)
     if (!moment(start_at, moment.ISO_8601, true).isValid() || !moment(end_at, moment.ISO_8601, true).isValid()) {
      return res.status(400).json({
        status: "failed",
        message: "日期格式錯誤，請使用 ISO 8601 格式 (YYYY-MM-DDTHH:mm:ssZ)"
      })
    }

    // 確保開始時間早於結束時間
    if (moment(start_at).isAfter(moment(end_at))) {
      return res.status(400).json({
        status: "failed",
        message: "開始時間不能晚於結束時間"
      })
    }

    const courseRepo = dataSource.getRepository('Course')
    const findCourse = await courseRepo.findOne({
      where: { 
        id: courseId 
      }
    });

    if (!findCourse) {
      res.status(400).json({
        status: "failed",
        message: "課程不存在"
      })
      return
    }

    const updatedCourse = await courseRepo.update({
      id: courseId
    }, {
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url
    })
    
    if (updatedCourse.affected === 0) {
      res.status(400).json({
        status: "failed",
        message: "更新課程失敗"
      })
      return
    } 

    const courseResult = await courseRepo.findOne({
      where: {
        id: courseId
      }
    })


    res.status(201).json({
      status: "success",
      data: {
        course: courseResult
      }
    })
  },

  async postUserToCoach (req, res, next)  {
    const {userId} = req.params
    const {experience_years, description, profile_image_url} = req.body
    if (isUndefined(experience_years) || isNotValidInteger(experience_years) || isUndefined(description) || isNotValidString(description)) {
        logger.warn('欄位未填寫正確')
        res.status(400).json({
          status: 'failed',
          message: '欄位未填寫正確'
        })
        return
    }
    if ( profile_image_url && !isNotValidString(profile_image_url) && !profile_image_url.startsWith('https')) {
        logger.warn('大頭貼網址錯誤')
        res.status(400).json({
          status: 'failed',
          message: '欄位未填寫正確'
        })
        return
      }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
          select: ['id', 'name', 'role'],
          where: { id: userId }
        })
    if (!existingUser) {
          logger.warn('使用者不存在')
          res.status(400).json({
            status: 'failed',
            message: '使用者不存在'
    })
          return
    }else if (existingUser.role === 'COACH') {
          logger.warn('使用者已經是教練')
          res.status(409).json({
            status: 'failed',
            message: '使用者已經是教練'
    })
          return
    }
    const coachRepo = dataSource.getRepository('Coach')
    const newCoach = coachRepo.create({
      user_id: userId,
      experience_years,
      description,
      profile_image_url
    })
    const updatedUser = await userRepository.update({
      id: userId,
      role: 'USER'
    }, {
      role: 'COACH'
    })
    if (updatedUser.affected === 0) {
      logger.warn('更新使用者失敗')
      res.status(400).json({
        status: 'failed',
        message: '更新使用者失敗'
      })
      return
    }
    const savedCoach = await coachRepo.save(newCoach)
    const savedUser = await userRepository.findOne({
      select: ['name', 'role'],
      where: { id: userId }
    })
    

    res.status(201).json({
      status: 'success',
      data: {
        user: savedUser,
        coach: savedCoach
      }
    })
  }
}

module.exports = adminController