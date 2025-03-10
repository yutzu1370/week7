const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('CoachController');
const { isNotValidString, isValidUUID, isUndefined } = require('../utils/validUtils');

const coachController = {
  async getCoaches(req, res, next) {
    const { per, page } = req.query;
    if (isNotValidString(per) || isNotValidString(page)) {
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      });
      return;
    }

    const perPage = parseInt(per, 10);
    const currentPage = parseInt(page, 10);

    if (perPage <= 0 || currentPage <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'per 和 page 必須為正數'
      });
    }

    
      // 使用 QueryBuilder 來處理關聯查詢
      const coachRepo = dataSource.getRepository('Coach');
      const queryBuilder = coachRepo.createQueryBuilder('coach')
        .leftJoinAndSelect('coach.User', 'user') // 根據 Entity 定義的關聯名稱
        .select([
          'coach.id',
          'coach.experience_years',
          'coach.description',
          'coach.profile_image_url',
          'user.name'
        ])
        .skip((currentPage - 1) * perPage)
        .take(perPage);

      const [coaches, total] = await queryBuilder.getManyAndCount();

      // 格式化回應資料
      const formattedCoaches = coaches.map(coach => ({
        id: coach.id,
        name: coach.User?.name || '',
        experience_years: coach.experience_years,
        description: coach.description,
        profile_image_url: coach.profile_image_url
      }));

      res.status(200).json({
        status: 'success',
        data: formattedCoaches,
        pagination: {
          total,
          current_page: currentPage,
          per_page: perPage,
          total_pages: Math.ceil(total / perPage)
        }
      });
    
  },

 async getCoachDetail(req, res, next) {
    const { coachId } = req.params;
    if (isNotValidString(coachId) || isUndefined(coachId) || !isValidUUID(coachId)) {
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      });
      return;
    }
      const coachRepo = dataSource.getRepository('Coach');
      const coach = await coachRepo.createQueryBuilder('coach')
        .leftJoinAndSelect('coach.User', 'user')
        .where('coach.id = :id', { id: coachId })
        .getOne();

      if (!coach) {
        return res.status(400).json({
          status: 'failed',
          message: '找不到該教練'
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            name: coach.User.name,
            role: coach.User.role
          },
          coach: {
            id: coach.id,
            user_id: coach.user_id,
            experience_years: coach.experience_years,
            description: coach.description,
            profile_image_url: coach.profile_image_url,
            created_at: coach.created_at,
            updated_at: coach.updated_at
          }
        }
      });
   
    }
  };

module.exports = coachController;