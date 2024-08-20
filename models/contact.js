import { Schema, model } from 'mongoose'

const schema = new Schema({
  name: {
    type: String,
    required: [true, '請填寫姓名']
  },
  email: {
    type: String,
    required: [true, '請填寫電子郵件']
  },
  subject: {
    type: String,
    required: [true, '請填寫主旨']
  },
  content: {
    type: String,
    required: [true, '請填寫內容']
  },
  status: {
    type: String,
    enum: ['待處理', '處理中', '已完成'],
    default: '待處理'
  }
}, { timestamps: true })

export default model('contacts', schema)
