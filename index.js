import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { StatusCodes } from 'http-status-codes'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import routeUser from './routes/user.js'
import routeProduct from './routes/product.js'
import routeOrder from './routes/order.js'
import routerVenue from './routes/venue.js'
import routerSession from './routes/session.js'
import routerEnrollment from './routes/enrollment.js'
import routerContact from './routes/contact.js'
import './passport/passport.js'

const app = express()

app.use(rateLimit({ // ㄑ限制請求次數
  windowMs: 60 * 1000 * 15, // 15 minutes 1000ms = 1s
  max: 2000, // 最多100次請求
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  message: '請求次數過多，請稍後再試',
  handler (req, res, next, options) {
    res.status(options.statusCode).json({
      success: false,
      message: options.message
    })
  }
}))

app.use(cors({
  origin (origin, callback) {
    if (origin === undefined ||
      origin.includes('github.io') || origin.includes('localhost') || origin.includes('127.0.0.1')
    ) {
      callback(null, true)
    } else {
      callback(new Error('CORS'), false)
    }
  }
}))

app.use(express.json())
app.use((_, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: '資料格式錯誤'
  })
})
app.use(mongoSanitize())

app.use('/user', routeUser)
app.use('/product', routeProduct)
app.use('/order', routeOrder)
app.use('/venue', routerVenue)
app.use('/session', routerSession)
app.use('/enrollment', routerEnrollment)
app.use('/contact', routerContact)

app.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到網頁'
  })
})

app.listen(process.env.PORT || 4000, async () => {
  console.log('Server啟動')
  await mongoose.connect(process.env.DB_URL)
  mongoose.set('sanitizeFilter', true)
  console.log('資料庫連線成功')
})
