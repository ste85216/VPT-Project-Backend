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
  // 過期時間，用於自動刪除過期的 session
  expiresAt: {
    type: Date,
    default: function () {
      const expirationDate = new Date(this.date)
      expirationDate.setUTCDate(expirationDate.getUTCDate() + 1) // 加一天
      expirationDate.setUTCHours(0, 0, 0, 0) // 設置為UTC的午夜
      return expirationDate
    },
    index: { expires: '0s' } // 設置 TTL 索引
  }
})

// 保存前的中間件，用於更新 expiresAt 和相關的 Enrollments
sessionSchema.pre('save', async function (next) {
  if (this.isModified('date')) {
    // 如果日期被修改，重新計算 expiresAt
    const expirationDate = new Date(this.date)
    expirationDate.setUTCDate(expirationDate.getUTCDate() + 1)
    expirationDate.setUTCHours(0, 0, 0, 0)
    this.expiresAt = expirationDate

    // 更新相關的 Enrollments 的 expiresAt
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

// 刪除 session 前的中間件，用於刪除相關的 Enrollments
sessionSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await Enrollment.deleteMany({ s_id: this._id })
})

// 創建 TTL 索引，用於自動刪除過期的 documents
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// 導出 Session 模型
export default model('sessions', sessionSchema)
