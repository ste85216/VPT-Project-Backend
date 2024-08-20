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

export default model('enrollments', schema)
