import Venue from '../models/venue.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    console.log('Received body:', req.body)
    console.log('Received files:', req.files)

    const images = req.files.map(file => file.path)
    req.body.images = images

    const result = await Venue.create(req.body)
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

export const getAll = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc'
    const itemsPerPage = req.query.itemsPerPage * 1 || 10
    const page = req.query.page * 1 || 1
    const search = req.query.search || ''
    const city = req.query.city || ''

    const searchRegex = new RegExp(search, 'i')
    const cityRegex = new RegExp(city, 'i')

    const query = {
      $and: [
        {
          $or: [
            { name: searchRegex },
            { address: searchRegex },
            { phone: searchRegex }
          ]
        },
        { address: cityRegex }
      ]
    }

    const data = await Venue.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)

    const total = await Venue.countDocuments(query)

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
export const edit = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const newImages = req.files.map(file => file.path)
    const existingImages = JSON.parse(req.body.existingImages || '[]')

    req.body.images = [...existingImages, ...newImages]

    await Venue.findByIdAndUpdate(req.params.id, req.body, { runValidators: true, new: true }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '球場資訊更新成功'
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '球場資訊 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無球場資訊'
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
    const itemsPerPage = req.query.itemsPerPage * 1 || 10
    const page = req.query.page * 1 || 1
    const search = req.query.search || ''
    const city = req.query.city || ''

    const searchRegex = new RegExp(search, 'i')
    const cityRegex = new RegExp(city, 'i')

    const query = {
      $and: [
        {
          $or: [
            { name: searchRegex },
            { address: searchRegex },
            { phone: searchRegex }
          ]
        },
        { address: cityRegex }
      ]
    }

    const data = await Venue.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)

    const total = await Venue.countDocuments(query)

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

export const getId = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const result = await Venue.findById(req.params.id).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '球場資訊 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無球場資訊'
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

    await Venue.findByIdAndDelete(req.params.id).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '球場資訊刪除成功'
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '球場資訊 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無球場資訊'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}
