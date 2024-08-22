import { Schema, model, ObjectId } from 'mongoose'

const schema = new Schema({
  s_id: {
    type: ObjectId,
    ref: 'sessions',
    required: [true, '請正確填寫場次 ID']
  },
  userId: {
    type: ObjectId,
    ref: 'users',
    required: true
  },
  male: {
    type: Number,
    default: 0,
    min: [0, '男生人數不能為負數']
  },
  female: {
    type: Number,
    default: 0,
    min: [0, '女生人數不能為負數']
  },
  nopreference: {
    type: Number,
    default: 0,
    min: [0, '不限性別人數不能為負數']
  },
  // 過期時間，用於自動刪除過期的報名記錄
  expiresAt: {
    type: Date,
    index: { expires: '0s' } // 設置 TTL 索引
  }
}, {
  // 添加 createdAt 和 updatedAt 時間戳
  timestamps: true
})

// 驗證邏輯：確保至少報名一人
schema.pre('save', function (next) {
  if (this.male + this.female + this.nopreference === 0) {
    next(new Error('至少需要報名一人'))
  } else {
    next()
  }
})

// 動態設置 expiresAt：根據關聯的 session 日期設置過期時間
schema.pre('save', async function (next) {
  if (this.isNew || this.isModified('s_id')) {
    try {
      // 查找關聯的 session
      const session = await this.model('sessions').findById(this.s_id)
      if (session) {
        // 設置過期時間為 session 日期的下一天凌晨
        const expirationDate = new Date(session.date)
        expirationDate.setUTCDate(expirationDate.getUTCDate() + 1)
        expirationDate.setUTCHours(0, 0, 0, 0)
        this.expiresAt = expirationDate
      }
    } catch (error) {
      return next(error)
    }
  }
  next()
})

// 創建 TTL 索引，用於自動刪除過期的報名記錄
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// 導出 Enrollment 模型
export default model('enrollments', schema)
