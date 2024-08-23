import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { StatusCodes } from 'http-status-codes'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'

// 導入路由
import routeUser from './routes/user.js'
import routeProduct from './routes/product.js'
import routeOrder from './routes/order.js'
import routerVenue from './routes/venue.js'
import routerSession from './routes/session.js'
import routerEnrollment from './routes/enrollment.js'
import routerContact from './routes/contact.js'

// 導入 Passport 配置
import './passport/passport.js'

// MVC(Model-View-Controller) 架構

// 創建 Express 應用
const app = express()

// 設置 trust proxy
app.set('trust proxy', true)

// 設置速率限制中間件
app.use(rateLimit({
  windowMs: 60 * 1000 * 15, // 15 分鐘
  max: 2000, // 最多 2000 次請求
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

// 設置 CORS 中間件 跨域資源共享
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

// 解析 JSON 請求體
app.use(express.json())

// 處理無效的 JSON 格式
app.use((_, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: '資料格式錯誤'
  })
})

// 使用 MongoDB 資料淨化中間件
app.use(mongoSanitize())

// 設置路由
app.use('/user', routeUser)
app.use('/product', routeProduct)
app.use('/order', routeOrder)
app.use('/venue', routerVenue)
app.use('/session', routerSession)
app.use('/enrollment', routerEnrollment)
app.use('/contact', routerContact)

// 處理 404 錯誤
app.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到網頁'
  })
})

// 啟動服務器並連接數據庫
app.listen(process.env.PORT || 4000, async () => {
  console.log('Server啟動')
  await mongoose.connect(process.env.DB_URL)
  mongoose.set('sanitizeFilter', true)
  console.log('資料庫連線成功')
})
