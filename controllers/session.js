import Session from '../models/session.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'
import mongoose from 'mongoose'

// 錯誤處理函數，用於統一處理錯誤響應
const handleError = (res, error, message) => {
  console.error(`Error: ${message}`, error)
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message
  })
}

// 檢查用戶是否擁有操作特定場次的權限
const checkSessionOwnership = (session, userId) => {
  if (session.userId.toString() !== userId.toString()) {
    throw new Error('FORBIDDEN')
  }
}

// 創建新場次
export const createSession = async (req, res) => {
  try {
    // 使用請求體數據和當前用戶ID創建新場次
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

// 編輯現有場次
export const editSession = async (req, res) => {
  try {
    // 驗證場次ID是否為有效的MongoDB ID
    if (!validator.isMongoId(req.params.id)) throw new Error('INVALID_ID')

    // 查找指定ID的場次
    const session = await Session.findById(req.params.id)
    if (!session) throw new Error('NOT_FOUND')

    // 檢查用戶是否有權編輯該場次
    checkSessionOwnership(session, req.user._id)

    // 更新場次信息
    const updatedSession = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '場次更新成功',
      result: updatedSession
    })
  } catch (error) {
    // 根據錯誤類型返回適當的錯誤響應
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

// 刪除場次
export const deleteSession = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('INVALID_ID')

    const sessionDoc = await Session.findById(req.params.id).session(session)
    if (!sessionDoc) throw new Error('NOT_FOUND')

    checkSessionOwnership(sessionDoc, req.user._id)

    // 使用 deleteOne() 方法
    await sessionDoc.deleteOne({ session })

    await session.commitTransaction()
    session.endSession()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '場次刪除成功'
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()

    if (error.message === 'INVALID_ID') {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'ID格式錯誤' })
    } else if (error.message === 'NOT_FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: '未找到場次' })
    } else if (error.message === 'FORBIDDEN') {
      res.status(StatusCodes.FORBIDDEN).json({ success: false, message: '您無權刪除此場次' })
    } else {
      console.error('Delete session error:', error)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: '刪除場次時發生錯誤' })
    }
  }
}

// 獲取當前用戶的所有場次
export const getUserSessions = async (req, res) => {
  try {
    // 查找屬於當前用戶的所有場次，並填充場地和用戶信息
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

// 獲取所有場次（帶過濾和分頁）
export const getAllSessions = async (req, res) => {
  try {
    const { date, city, venueId, page = 1, itemsPerPage = 10 } = req.query
    const netheight = Array.isArray(req.query.netheight) ? req.query.netheight : [req.query.netheight].filter(Boolean)
    const level = Array.isArray(req.query.level) ? req.query.level : [req.query.level].filter(Boolean)

    const filter = {}

    // 日期篩選
    if (date) {
      filter.date = new Date(date)
    }

    // 球場篩選
    if (venueId) {
      filter.v_id = venueId
    }

    // 網高篩選
    if (netheight.length) {
      filter.$or = netheight.map(height => ({ netheight: height }))
    }

    // 程度篩選
    if (level.length) {
      filter.$or = level.map(lvl => ({ level: lvl }))
    }

    // 獲取所有符合初始條件的 sessions
    let sessions = await Session.find(filter)
      .populate('v_id', 'name address')
      .populate('userId', 'userId')
      .sort({ date: 1 })

    // 如果指定了城市，在內存中進行過濾
    if (city) {
      sessions = sessions.filter(session => {
        const venueAddress = session.v_id.address
        return venueAddress.toLowerCase().includes(city.toLowerCase())
      })
    }

    // 計算總數和頁數
    const total = sessions.length
    const totalPages = Math.ceil(total / itemsPerPage)

    // 分頁
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + parseInt(itemsPerPage)
    const paginatedSessions = sessions.slice(startIndex, endIndex)

    res.status(StatusCodes.OK).json({
      success: true,
      result: {
        data: paginatedSessions,
        total,
        page: parseInt(page),
        totalPages
      }
    })

    console.log('Filter:', JSON.stringify(filter, null, 2))
  } catch (error) {
    console.error('Get all sessions error:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '獲取場次信息失敗',
      error: process.env.NODE_ENV === 'development' ? error.message : '服務器內部錯誤'
    })
  }
}

// 根據ID獲取特定場次
export const getSessionById = async (req, res) => {
  try {
    // 驗證場次ID是否為有效的MongoDB ID
    if (!validator.isMongoId(req.params.id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID格式錯誤'
      })
    }

    // 查找指定ID的場次，並填充場地和用戶信息
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
