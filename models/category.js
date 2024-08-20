import { Schema, model, ObjectId } from 'mongoose'

const schema = new Schema({
  name: {
    type: String,
    required: [true, '請輸入分類名稱']
  },
  parent: {
    type: ObjectId,
    ref: 'categories',
    default: null
  }
})

export default model('categories', schema)
