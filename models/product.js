import { Schema, model } from 'mongoose'

const schema = new Schema({
  name: {
    type: String,
    required: [true, '商品名稱必填']
  },
  price: {
    type: Number,
    required: [true, '商品價格必填'],
    min: [0, '商品價格不能小於 0']
  },
  images: {
    type: [String],
    required: [true, '商品圖片必填'],
    validate: {
      validator: function (v) {
        return v.length > 0
      },
      message: '至少需要一張商品圖片'
    }
  },
  colors: {
    type: [String]
  },
  sizes: {
    type: [String]
  },
  description: {
    type: String,
    required: [true, '商品說明必填']
  },
  category: {
    type: String,
    required: [true, '商品分類必填'],
    enum: {
      values: ['球衣', '球褲', '球襪', '球鞋', '排球', '護具', '其他'],
      message: '商品分類錯誤'
    }
  },
  // tags: {
  //   type: [String],
  //   enum: ['新品', '特價', '熱銷']
  // },
  sell: {
    type: Boolean,
    required: [true, '商品上架狀態必填']
  }
  // stock: {
  //   type: Number,
  //   // required: [true, '商品庫存必填'],
  //   min: [0, '商品庫存不能小於 0']
  // },
  // sold: {
  //   type: Number,
  //   default: 0
  // }
}, {
  timestamps: true,
  versionKey: false
})

export default model('products', schema)
