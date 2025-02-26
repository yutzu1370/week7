const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Coach')

const { isValidString,isValidUUID,isUndefined } = require('../utils/validUtils')

router.get('/', async (req, res, next) => {
  try {
    const { per, page } = req.query
    if(!isValidString(per) || !isValidString(page)){
        res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }

    // per & page 轉成數字
    const perPage = parseInt(per, 10)
    const currentPage = parseInt(page, 10)

    if (perPage <= 0 || currentPage <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'per 和 page 必須為正數'
      })
    }

    // 取得教練列表
    const coachRepo = dataSource.getRepository('Coach')
    const [coaches, total] = await coachRepository.findAndCount({
      skip: (currentPage - 1) * perPage,//跳過前面幾筆，確保從正確的頁碼開始
      take: perPage,//限制一次查詢回傳的資料筆數
      select:['id','name']
    })


    res.status(200).json({
        status: "success",
        data: coaches
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

router.get('/:coachId', async (req, res, next) => {
  try {
    const { coachId } = req.params
    if(!isValidString(coachId) || isUndefined(coachId) || isValidUUID(coachId)){
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    const coachRepo = dataSource.getRepository('Coach')
    const userRepo = getRepository(User);
    const coach = await coachRepo.findOne({
      where: { id: coachId },
      relations: ['user']  // 加載 user 關聯資料
    });

    if (!coach) {
      return res.status(400).json({
        status: 'failed',
        message: '找不到該教練'
      })
    }
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          name: coach.user.name,  // 從關聯的 user 資料中取得名字
          role: 'COACH',  // 根據實際情況設置角色
        },
        coach: {
          id: coach.id,
          user_id: coach.user_id,
          experience_years: coach.experience_years,
          description: coach.description,
          profile_image_url: coach.profile_image_url,
          created_at: coach.created_at,
          updated_at: coach.updated_at,
        }
      }
    })
    
  } catch (error) {
    logger.error(error)
    next(error)
  }
})
module.exports = router