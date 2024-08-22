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
  expiresAt: {
    type: Date,
    index: { expires: '0s' }
  }
}, {
  timestamps: true
})

// 添加一个验证器，确保至少有一个字段大于0
schema.pre('save', function (next) {
  if (this.male + this.female + this.nopreference === 0) {
    next(new Error('至少需要報名一人'))
  } else {
    next()
  }
})

// 動態設置 expiresAt
schema.pre('save', async function (next) {
  if (this.isNew || this.isModified('s_id')) {
    try {
      const session = await this.model('sessions').findById(this.s_id)
      if (session) {
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

// 創建 TTL 索引
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default model('enrollments', schema)
