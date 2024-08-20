import Session from '../models/session.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

const handleError = (res, error, message) => {
  console.error(`Error: ${message}`, error)
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message
  })
}

const checkSessionOwnership = (session, userId) => {
  if (session.userId.toString() !== userId.toString()) {
    throw new Error('FORBIDDEN')
  }
}

export const createSession = async (req, res) => {
  try {
    const session = await Session.create({ ...req.body, userId: req.user._id })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '場次創建成功',
      result: session
    })
  } catch (error) {
    handleError(res, error, '創建場次時發生錯誤')
  }
}

export const editSession = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('INVALID_ID')

    const session = await Session.findById(req.params.id)
    if (!session) throw new Error('NOT_FOUND')

    checkSessionOwnership(session, req.user._id)

    const updatedSession = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '場次更新成功',
      result: updatedSession
    })
  } catch (error) {
    if (error.message === 'INVALID_ID') {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'ID格式錯誤' })
    } else if (error.message === 'NOT_FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: '未找到場次' })
    } else if (error.message === 'FORBIDDEN') {
      res.status(StatusCodes.FORBIDDEN).json({ success: false, message: '您無權編輯此場次' })
    } else {
      handleError(res, error, '更新場次時發生錯誤')
    }
  }
}

export const deleteSession = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('INVALID_ID')

    const session = await Session.findById(req.params.id)
    if (!session) throw new Error('NOT_FOUND')

    checkSessionOwnership(session, req.user._id)

    await Session.findByIdAndDelete(req.params.id)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '場次刪除成功'
    })
  } catch (error) {
    if (error.message === 'INVALID_ID') {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'ID格式錯誤' })
    } else if (error.message === 'NOT_FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: '未找到場次' })
    } else if (error.message === 'FORBIDDEN') {
      res.status(StatusCodes.FORBIDDEN).json({ success: false, message: '您無權刪除此場次' })
    } else {
      handleError(res, error, '刪除場次時發生錯誤')
    }
  }
}

export const getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).populate('v_id').populate('userId')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: sessions
    })
  } catch (error) {
    handleError(res, error, '抓取用戶場次時發生錯誤')
  }
}

export const getAllSessions = async (req, res) => {
  try {
    const { date } = req.query
    console.log('Received date query:', date)

    const filter = date
      ? {
          $expr: {
            $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$date' } }, date]
          }
        }
      : {}

    console.log('Applying filter:', JSON.stringify(filter))

    const sessions = await Session.find(filter).populate('v_id').populate('userId')
    console.log('Found sessions:', sessions.length)

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: sessions
    })
  } catch (error) {
    handleError(res, error, '獲取所有場次信息失敗')
  }
}

export const getSessionById = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID格式錯誤'
      })
    }

    const session = await Session.findById(req.params.id).populate('v_id').populate('userId')

    if (!session) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '未找到該場次'
      })
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: session
    })
  } catch (error) {
    handleError(res, error, '獲取場次資訊失敗')
  }
}
