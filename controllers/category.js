import Category from '../models/category.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

// 新增分類
export const create = async (req, res) => {
  try {
    const result = await Category.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
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

// 取得所有分類
export const getAll = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc'
    const itemsPerPage = req.query.itemsPerPage * 1 || 10
    const page = req.query.page * 1 || 1
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await Category
      .find({
        $or: [
          { name: regex }
        ]
      })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)

    const total = await Category.estimatedDocumentCount()
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

// 編輯分類
export const edit = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    await Category.findByIdAndUpdate(req.params.id, req.body, { runValidators: true }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '分類 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無分類'
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

// 取得單一分類
export const getId = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const result = await Category.findById(req.params.id).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '分類 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無分類'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

// 刪除分類
export const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id)
    if (!deletedCategory) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '分類未找到'
      })
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: '分類已刪除'
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
