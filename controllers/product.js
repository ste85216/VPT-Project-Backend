import Product from '../models/product.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    const images = req.files.map(file => file.path) // 處理多張圖片
    req.body.images = images

    const result = await Product.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    console.log('Error details:', error) // 打印錯誤詳細信息
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      console.log(error)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const getAll = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc'
    const itemsPerPage = req.query.itemsPerPage * 1 || 10
    const page = req.query.page * 1 || 1
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await Product
      .find({
        $or: [
          { name: regex },
          { description: regex },
          { category: regex }
        ]
      })
      // const text = 'a'
      // const obj = { [text]: 1 }
      // obj.a --> 1
      .sort({ [sortBy]: sortOrder })
      // 如果一頁有 10 筆
      // 第一頁 = 1 ~ 10 = 跳過 0 筆 = (第 1 頁 - 1) * 10 = 0
      // 第二頁 = 11 ~ 20 = 跳過 10 筆 = (第 2 頁 - 1) * 10 = 10
      // 第三頁 = 21 ~ 30 = 跳過 20 筆 = (第 3 頁 - 1) * 10 = 20
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
    const total = await Product.estimatedDocumentCount()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const edit = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const newImages = req.files.map(file => file.path) // 新上傳的圖片
    const existingImages = JSON.parse(req.body.existingImages || '[]') // 保留的舊圖片

    req.body.images = [...existingImages, ...newImages] // 合併舊圖片和新圖片

    await Product.findByIdAndUpdate(req.params.id, req.body, { runValidators: true, new: true }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '商品更新成功'
    })
  } catch (error) {
    console.log('錯誤詳細信息:', error) // 打印錯誤詳細信息
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '商品 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const get = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc'
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10
    const page = parseInt(req.query.page) || 1
    const category = req.query.category
    const search = req.query.search || ''

    const query = { sell: true }
    if (category && category !== '全部') {
      query.category = category
    }

    if (search) {
      const regex = new RegExp(search, 'i')
      query.$or = [
        { name: regex },
        { description: regex },
        { category: regex }
      ]
    }

    const data = await Product
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)

    const total = await Product.countDocuments(query)

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    console.error('Error in get function:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const getId = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const result = await Product.findById(req.params.id).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '商品 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const remove = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    await Product.findByIdAndDelete(req.params.id).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '商品刪除成功'
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '商品 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}
