const { dataSource } = require('../db/data-source')
const appError = require('../utils/appError')
const moment = require('moment')
const { isNotValidString, isNotValidInteger, isUndefined, isValidUUID } = require('../utils/validUtils')
const logger = require('../utils/logger')('AdminController')

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
  },

  async getCoachCourses(req, res, next) {
    const { id } = req.user;
    const courseRepo = dataSource.getRepository('Course');
    const courses = await courseRepo.createQueryBuilder('course')
      .select([
        'course.id',
        'course.name',
        'course.start_at',
        'course.end_at',
        'course.max_participants',
        'MAX(courseBooking.status) as status', // 使用 MAX 來獲取一個狀態
        'COUNT(courseBooking.id) AS participants'
      ])
      .leftJoin('CourseBooking', 'courseBooking', 'courseBooking.course_id = course.id')
      .where('course.user_id = :coachId', { coachId: id })
      .andWhere('courseBooking.cancelledAt IS NULL')
      .groupBy('course.id')
      .getRawMany();

      const formattedCourses = courses.map(course => ({
        id: course.course_id,           // 注意：可能需要改成 course_id
        status: course.status,      // 改成 max_status
        name: course.course_name,       // 注意：可能需要改成 course_name
        start_at: course.course_start_at, // 注意：可能需要改成 course_start_at
        end_at: course.course_end_at,     // 注意：可能需要改成 course_end_at
        max_participants: course.course_max_participants, // 注意：可能需要改成 course_max_participants
        participants: parseInt(course.participants, 10)
      }));

    res.status(200).json({
      status: 'success',
      data: formattedCourses
    })
  },

  async getCoachCourseDetail(req, res, next) {
    const { id } = req.user
    const { courseId } = req.params
    console.log(courseId, id)
    if (isUndefined(courseId) || !isValidUUID(courseId) || isUndefined(id) || !isValidUUID(id)) {
      res.status(400).json({
        status: 'failed',
        message: '欄位填寫錯誤'
      })
      return
    }
    const coachRepo = dataSource.getRepository('Coach')
    const coach = await coachRepo.findOne({
      where: { user_id: id }
    })
    if (!coach) {
      res.status(400).json({
        status: 'failed',
        message: '找不到該教練'
      })
      return
    }
    const courseRepository = dataSource.getRepository('Course')
    const course = await courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.Skill', 'skill')
      .where('course.id = :courseId', { courseId })
      .andWhere('course.user_id = :userId', { userId: id }) // 添加 user_id 條件
      .select([
        'course.id',
        'skill.name AS skill_name',
        'course.name',
        'course.description',
        'course.start_at',
        'course.end_at',
        'course.max_participants'
      ])
      .getRawOne();
        
    if (!course) {
      res.status(404).json({
        status: 'error',
        message: '找不到課程'
      })
      return
    }  
    const formattedCourse = {
      id: course.course_id,
      skill_name: course.skill_name,
      name: course.course_name,
      description: course.course_description,
      start_at: course.course_start_at,
      end_at: course.course_end_at,
      max_participants: course.course_max_participants
    };

    res.status(200).json({
      status: 'success',
      data: formattedCourse
    })
  },

 async getCoachDetail(req, res, next) {
  const { id } = req.user
  const coach = await coachRepo.findOne({
    where: { user_id: id }
  });

  if (!coach) {
    return res.status(404).json({
      status: 'error',
      message: '找不到教練'
    });
  }
  // 使用 QueryBuilder 查詢教練資料和相關技能
 // 再查詢教練的技能
 const coachWithSkills = await coachRepo
  .createQueryBuilder('coach')
  .leftJoinAndSelect('coach.User', 'user')  // 使用實體中定義的關聯
  .leftJoin('user.CoachSkills', 'coachSkills')  // 假設 User 實體中有 CoachSkills 關聯
  .leftJoin('coachSkills.Skill', 'skill')  // 假設 CoachSkills 實體中有 Skill 關聯
  .where('coach.user_id = :userId', { userId: id })
  .select([
    'coach.id',
    'coach.experience_years',
    'coach.description',
    'coach.profile_image_url',
    'skill.id AS skill_id'
  ])
  .getRawMany();
/*
// 整理技能ID列表
  const skillIds = coachWithSkills
    .map(item => item.skill_id)
    .filter(id => id != null);



  // 整理回應格式
  const formattedResponse = {
    id: coachDetail[0].coach_id,
    experience_years: coachDetail[0].coach_experience_years,
    description: coachDetail[0].coach_description,
    profile_image_url: coachDetail[0].coach_profile_image_url,
    skill_ids: skillIds
  };
*/
  res.status(200).json({
    status: 'success',
    data: coachWithSkills
  });
},

  async putCoach(req, res, next) {
    const { id } = req.user
    const {
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl = null,
      skill_ids: skillIds
    } = req.body
    if (isUndefined(experienceYears) || isNotValidInteger(experienceYears) ||
      isUndefined(description) || isNotValidString(description) ||
      isUndefined(profileImageUrl) || isNotValidString(profileImageUrl) ||
      !profileImageUrl.startsWith('https') ||
      isUndefined(skillIds) || !Array.isArray(skillIds)) {     
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    if (skillIds.length === 0 || skillIds.every(skill => isUndefined(skill) || isNotValidString(skill))) {
      logger.warn('欄位未填寫正確')
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    const coachRepo = dataSource.getRepository('Coach')
    const coach = await coachRepo.findOne({
      select: ['id'],
      where: { user_id: id }
    })
    await coachRepo.update({
      id: coach.id
    }, {
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl
    })
}
}


  

module.exports = adminController