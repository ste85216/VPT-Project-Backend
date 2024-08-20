import { Schema, model, ObjectId, Error } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import UserRole from '../enums/UserRole.js'

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
  account: {
    type: String,
    required: [true, '請設置帳號'],
    minlength: [8, '帳號最少 8 個字'],
    maxlength: [20, '帳號最多 20 個字'],
    unique: true,
    validate: {
      validator: validator.isAlphanumeric,
      message: '帳號只能是英數字'
    }
  },
  password: {
    type: String,
    required: [true, '請設置密碼'],
    minlength: [8, '密碼最少 8 個字']
  },
  email: {
    type: String,
    required: [true, '請正確填寫電子信箱'],
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '電子信箱格式錯誤'
    }
  },
  phone: {
    type: String,
    required: [true, '請正確填寫手機號碼'],
    unique: true,
    validate: {
      validator: validator.isMobilePhone,
      message: '手機號碼格式錯誤'
    }
  },
  name: {
    type: String,
    minlength: [2, '姓名最少 2 個字'],
    maxlength: [10, '姓名最多 10 個字']
  },
  nickname: {
    type: String,
    minlength: [2, '暱稱最少 2 個字'],
    maxlength: [10, '暱稱最多 10 個字']
  },
  avatar: {
    type: String,
    default: 'https://api.multiavatar.com/admin002.png'
  },
  birthday: {
    type: Date
  },
  address: {
    type: String
  },
  tokens: {
    type: [String]
  },
  cart: {
    type: [cartSchema]
  },
  role: {
    type: Number,
    default: UserRole.USER
  },
  userId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true, // 使用者帳號建立時間、更新時間
  versionKey: false // __V 欄位不顯示，改了幾次的紀錄，非必要
})

schema.pre('save', function (next) {
  const user = this // this 指向 User model
  if (user.isModified('password')) {
    if (user.password.length < 8) {
      const error = new Error.ValidationError()
      error.addError('password', new Error.ValidatorError({ message: '密碼長度不符' }))
      next(error)
      return
    } else {
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }
  next()
})

schema.virtual('cartQuantity').get(function () {
  const user = this
  return user.cart.reduce((total, current) => {
    return total + current.quantity
  }, 0) // 初始值為 0
})

export default model('users', schema)
