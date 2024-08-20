import Contact from '../models/contact.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    const result = await Contact.create(req.body)
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '感謝您的聯繫，我們會盡快回覆您。',
      result
    })
  } catch (error) {
    console.log(error)
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

export const getAll = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc'
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10
    const page = parseInt(req.query.page) || 1
    const search = req.query.search || ''

    const query = {}

    if (search) {
      const regex = new RegExp(search, 'i')
      query.$or = [
        { name: regex },
        { email: regex },
        { subject: regex },
        { content: regex },
        { status: regex }
      ]
    }

    const data = await Contact
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)

    const total = await Contact.countDocuments(query)

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data,
        total
      }
    })
  } catch (error) {
    console.error('Error in getAll function:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!validator.isMongoId(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '聯絡表單 ID 格式錯誤'
      })
    }

    const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })

    if (!contact) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到該聯絡表單'
      })
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '狀態更新成功',
      result: contact
    })
  } catch (error) {
    console.log(error)
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

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params

    if (!validator.isMongoId(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '聯絡表單 ID 格式錯誤'
      })
    }

    const deletedContact = await Contact.findByIdAndDelete(id)

    if (!deletedContact) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到該聯絡表單'
      })
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '聯絡表單已成功刪除'
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
