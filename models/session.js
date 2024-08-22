import { Schema, model, ObjectId } from 'mongoose'
import Enrollment from './enrollment.js'

const sessionSchema = new Schema({
  v_id: {
    type: ObjectId,
    ref: 'venues',
    required: [true, '請正確填寫球場ID']
  },
  userId: {
    type: ObjectId,
    ref: 'users',
    required: true
  },
  date: {
    type: Date,
    required: [true, '請選擇日期']
  },
  time: {
    type: String,
    required: [true, '請填寫時段']
  },
  netheight: {
    type: String,
    required: [true, '請選擇網高']
  },
  level: {
    type: String,
    required: [true, '請選擇需求程度']
  },
  male: {
    type: Number,
    default: 0,
    required: [true, '請填寫需求男生人數']
  },
  female: {
    type: Number,
    default: 0,
    required: [true, '請填寫需求女生人數']
  },
  nopreference: {
    type: Number,
    default: 0,
    required: [true, '請填寫不限性別人數']
  },
  participantMale: {
    type: Number,
    default: 0
  },
  participantFemale: {
    type: Number,
    default: 0
  },
  participantNoPreference: {
    type: Number,
    default: 0
  },
  fee: {
    type: Number,
    required: [true, '請填寫費用']
  },
  note: {
    type: String
  },
  expiresAt: {
    type: Date,
    default: function () {
      const expirationDate = new Date(this.date)
      expirationDate.setUTCDate(expirationDate.getUTCDate() + 1) // 加一天
      expirationDate.setUTCHours(0, 0, 0, 0) // 設置為UTC的午夜
      return expirationDate
    },
    index: { expires: '0s' }
  }
})

sessionSchema.pre('save', async function (next) {
  if (this.isModified('date')) {
    const expirationDate = new Date(this.date)
    expirationDate.setUTCDate(expirationDate.getUTCDate() + 1)
    expirationDate.setUTCHours(0, 0, 0, 0)
    this.expiresAt = expirationDate

    // 更新相關的 Enrollments
    try {
      await Enrollment.updateMany(
        { s_id: this._id },
        { expiresAt: this.expiresAt }
      )
    } catch (error) {
      console.error('更新 Enrollments 失敗:', error)
    }
  }
  next()
})

// 使用 pre('deleteOne') 代替 pre('remove')
sessionSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await Enrollment.deleteMany({ s_id: this._id })
})

// 創建 TTL 索引
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default model('sessions', sessionSchema)
