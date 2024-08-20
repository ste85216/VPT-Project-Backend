import { Schema, model } from 'mongoose'

const schema = new Schema({
  name: {
    type: String,
    required: [true, '球場名稱必填']
  },
  time: {
    type: String,
    required: [true, '球場營業時間必填']
  },
  images: {
    type: [String],
    required: [true, '球場圖片必填'],
    validate: {
      validator: function (v) {
        return v.length > 0
      },
      message: '需要一張球場圖片'
    }
  },
  address: {
    type: String,
    required: [true, '球場地址必填']
  },
  phone: {
    type: String,
    required: [true, '球場電話必填']
  },
  mapLink: {
    type: String,
    required: [true, '球場連結必填']
  }
}, {
  timestamps: true,
  versionKey: false
})

export default model('venues', schema)
