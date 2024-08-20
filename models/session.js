import { Schema, model, ObjectId } from 'mongoose'

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
  }
})

export default model('sessions', sessionSchema)
