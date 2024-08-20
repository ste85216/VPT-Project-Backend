import { Schema, model, ObjectId } from 'mongoose'

const cartSchema = new Schema({
  p_id: {
    type: ObjectId,
    ref: 'products',
    required: [true, '請正確填寫商品 ID']
  },
  colors: {
    type: String
    // required: [true, '請選擇商品顏色']
  },
  sizes: {
    type: String
    // required: [true, '請選擇商品尺寸']
  },
  quantity: {
    type: Number,
    required: [true, '請選擇商品數量'],
    min: [1, '商品數量最少 1 個']
  }
}, {
  timestamps: true, // 使用者帳號建立時間、更新時間
  versionKey: false // __V 欄位不顯示，改了幾次的紀錄，非必要
})

const schema = new Schema({
  user: {
    type: ObjectId,
    ref: 'users',
    required: [true, '請正確填寫用戶 ID']
  },
  cart: {
    type: [cartSchema],
    validate: {
      validator (value) {
        return value.length > 0
      },
      message: '請正確放入購物車商品'
    }
  },
  note: {
    type: String
  }
}, {
  timestamps: true,
  versionKey: false
})

export default model('orders', schema)
