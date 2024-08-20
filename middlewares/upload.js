import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { StatusCodes } from 'http-status-codes'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'products',
    format: async (req, file) => 'png', // 支援格式
    public_id: (req, file) => file.originalname.split('.')[0]
  }
})

const upload = multer({
  storage,
  fileFilter (req, file, callback) {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      callback(null, true)
    } else {
      callback(new Error('FORMAT'), false)
    }
  },
  limits: {
    fileSize: 1024 * 1024 // 限制檔案大小為 1MB
  }
})

export default (req, res, next) => {
  upload.array('newImages', 10)(req, res, error => {
    console.log('Files:', req.files) // 調試訊息，顯示上傳的文件
    if (error instanceof multer.MulterError) {
      let message = '上傳錯誤'
      console.log('MulterError:', error) // 調試訊息，顯示Multer錯誤
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = '檔案太大'
      } else if (error.code === 'LIMIT_FILE_COUNT') {
        message = '超過最大檔案數量'
      }
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error) {
      console.log('OtherError:', error) // 調試訊息，顯示其他錯誤
      if (error.message === 'FORMAT') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '檔案格式錯誤'
        })
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
      }
    } else {
      next()
    }
  })
}
