import Enrollment from '../models/enrollment.js'
import Session from '../models/session.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'
import mongoose from 'mongoose'

// 輔助函數：處理錯誤響應
const handleError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  })
}

// 創建報名
export const create = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { s_id, male, female, nopreference } = req.body
    const userId = req.user._id

    if (!validator.isMongoId(s_id)) {
      throw new Error('INVALID_SESSION_ID')
    }

    const sessionDoc = await Session.findById(s_id).session(session)
    if (!sessionDoc) {
      throw new Error('SESSION_NOT_FOUND')
    }

    // 檢查是否有足夠的名額
    const totalRequested = male + female + nopreference
    const availableMale = sessionDoc.male - (sessionDoc.participantMale || 0)
    const availableFemale = sessionDoc.female - (sessionDoc.participantFemale || 0)
    const availableNoPreference = sessionDoc.nopreference - (sessionDoc.participantNoPreference || 0)
    const totalAvailable = availableMale + availableFemale + availableNoPreference

    if (totalRequested > totalAvailable) {
      throw new Error('EXCEEDS_AVAILABLE_SLOTS')
    }

    // 檢查具體的名額分配
    if (nopreference > 0) {
      if (nopreference > availableNoPreference) {
        throw new Error('EXCEEDS_AVAILABLE_NO_PREFERENCE_SLOTS')
      }
      sessionDoc.participantNoPreference = (sessionDoc.participantNoPreference || 0) + nopreference
    } else {
      if (male > availableMale || female > availableFemale) {
        throw new Error('EXCEEDS_AVAILABLE_GENDER_SLOTS')
      }
      sessionDoc.participantMale = (sessionDoc.participantMale || 0) + male
      sessionDoc.participantFemale = (sessionDoc.participantFemale || 0) + female
    }

    await sessionDoc.save({ session })

    const enrollment = new Enrollment({
      s_id,
      userId,
      male: male || 0,
      female: female || 0,
      nopreference: nopreference || 0
    })
    await enrollment.save({ session })

    await session.commitTransaction()
    session.endSession()

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '報名成功',
      result: {
        enrollment,
        session: sessionDoc
      }
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()

    console.error('Error in create enrollment:', error)
    switch (error.message) {
      case 'INVALID_SESSION_ID':
        return handleError(res, StatusCodes.BAD_REQUEST, '無效的場次 ID')
      case 'SESSION_NOT_FOUND':
        return handleError(res, StatusCodes.NOT_FOUND, '未找到該場次')
      case 'EXCEEDS_AVAILABLE_SLOTS':
        return handleError(res, StatusCodes.BAD_REQUEST, '報名人數超過場次總剩餘容量')
      case 'EXCEEDS_AVAILABLE_NO_PREFERENCE_SLOTS':
        return handleError(res, StatusCodes.BAD_REQUEST, '報名人數超過不限性別剩餘容量')
      case 'EXCEEDS_AVAILABLE_GENDER_SLOTS':
        return handleError(res, StatusCodes.BAD_REQUEST, '報名人數超過指定性別剩餘容量')
      default:
        return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, '創建報名時發生錯誤')
    }
  }
}

// 編輯報名
export const edit = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    if (!validator.isMongoId(req.params.id)) {
      throw new Error('INVALID_ENROLLMENT_ID')
    }

    const enrollment = await Enrollment.findById(req.params.id).session(session)
    if (!enrollment) {
      throw new Error('ENROLLMENT_NOT_FOUND')
    }

    if (enrollment.userId.toString() !== req.user._id.toString()) {
      throw new Error('UNAUTHORIZED')
    }

    const sessionDoc = await Session.findById(enrollment.s_id).session(session)
    if (!sessionDoc) {
      throw new Error('SESSION_NOT_FOUND')
    }

    const oldMale = enrollment.male
    const oldFemale = enrollment.female
    const oldNopreference = enrollment.nopreference || 0

    // 只允許編輯場次需要的性別欄位
    const newMale = sessionDoc.male > 0 ? (req.body.male || oldMale) : oldMale
    const newFemale = sessionDoc.female > 0 ? (req.body.female || oldFemale) : oldFemale
    const newNopreference = sessionDoc.nopreference > 0 ? (req.body.nopreference || oldNopreference) : oldNopreference

    // 檢查並更新場次名額
    const maleDiff = newMale - oldMale
    const femaleDiff = newFemale - oldFemale
    const nopreferenceDiff = newNopreference - oldNopreference

    const availableMale = sessionDoc.male - sessionDoc.participantMale + oldMale
    const availableFemale = sessionDoc.female - sessionDoc.participantFemale + oldFemale
    const availableNoPreference = sessionDoc.nopreference - sessionDoc.participantNoPreference + oldNopreference

    if (sessionDoc.nopreference > 0) {
      if (newNopreference > availableNoPreference) {
        throw new Error('EXCEEDS_AVAILABLE_NO_PREFERENCE_SLOTS')
      }
    } else {
      if (newMale > availableMale || newFemale > availableFemale) {
        throw new Error('EXCEEDS_AVAILABLE_GENDER_SLOTS')
      }
    }

    sessionDoc.participantMale += maleDiff
    sessionDoc.participantFemale += femaleDiff
    sessionDoc.participantNoPreference += nopreferenceDiff

    await sessionDoc.save({ session })

    enrollment.male = newMale
    enrollment.female = newFemale
    enrollment.nopreference = newNopreference
    await enrollment.save({ session })

    await session.commitTransaction()
    session.endSession()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '報名資訊更新成功',
      result: {
        enrollment,
        session: sessionDoc
      }
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()

    console.error('Error in edit enrollment:', error)
    switch (error.message) {
      case 'INVALID_ENROLLMENT_ID':
        return handleError(res, StatusCodes.BAD_REQUEST, '報名 ID 格式錯誤')
      case 'ENROLLMENT_NOT_FOUND':
        return handleError(res, StatusCodes.NOT_FOUND, '查無報名資訊')
      case 'SESSION_NOT_FOUND':
        return handleError(res, StatusCodes.NOT_FOUND, '查無場次資訊')
      case 'UNAUTHORIZED':
        return handleError(res, StatusCodes.FORBIDDEN, '您無權編輯此報名')
      case 'EXCEEDS_AVAILABLE_NO_PREFERENCE_SLOTS':
        return handleError(res, StatusCodes.BAD_REQUEST, '報名人數超過不限性別剩餘容量')
      case 'EXCEEDS_AVAILABLE_GENDER_SLOTS':
        return handleError(res, StatusCodes.BAD_REQUEST, '報名人數超過指定性別剩餘容量')
      default:
        return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, '編輯報名時發生錯誤')
    }
  }
}

// 查找報名 (用戶自己的報名)
export const get = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate({
        path: 's_id',
        populate: { path: 'v_id' }
      })
      .populate('userId')

    // 過濾掉 s_id 為 null 的報名
    const validEnrollments = enrollments.filter(enrollment => enrollment.s_id != null)

    // 如果有無效的報名，記錄警告
    if (validEnrollments.length < enrollments.length) {
      console.warn(`Found ${enrollments.length - validEnrollments.length} enrollments with null s_id for user ${req.user._id}`)
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: validEnrollments
    })
  } catch (error) {
    console.error('Error in get enrollments:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '獲取報名記錄時發生錯誤'
    })
  }
}

// 查找特定場次的所有報名 (只有場次創建者可以查看)
export const getBySession = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.sessionId)) throw new Error('ID')

    const session = await Session.findById(req.params.sessionId)
    if (!session) throw new Error('NOT FOUND')

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: '您無權查看此場次的報名資訊'
      })
    }

    const enrollments = await Enrollment.find({ s_id: req.params.sessionId }).populate('userId', '-password')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: enrollments
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '場次 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無場次資訊'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

// 刪除報名
export const remove = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('INVALID_ENROLLMENT_ID')

    const enrollment = await Enrollment.findById(req.params.id).session(session)
    if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND')

    if (enrollment.userId.toString() !== req.user._id.toString()) {
      throw new Error('UNAUTHORIZED')
    }

    const sessionDoc = await Session.findById(enrollment.s_id).session(session)
    if (!sessionDoc) throw new Error('SESSION_NOT_FOUND')

    // 更新場次的參與人數
    sessionDoc.participantMale -= enrollment.male
    sessionDoc.participantFemale -= enrollment.female
    sessionDoc.participantNoPreference -= (enrollment.nopreference || 0)

    await sessionDoc.save({ session })

    await Enrollment.findByIdAndDelete(req.params.id, { session })

    await session.commitTransaction()
    session.endSession()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '報名刪除成功',
      result: {
        session: sessionDoc
      }
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()

    console.error('Error in remove enrollment:', error)
    switch (error.message) {
      case 'INVALID_ENROLLMENT_ID':
        return handleError(res, StatusCodes.BAD_REQUEST, '報名 ID 格式錯誤')
      case 'ENROLLMENT_NOT_FOUND':
        return handleError(res, StatusCodes.NOT_FOUND, '查無報名資訊')
      case 'UNAUTHORIZED':
        return handleError(res, StatusCodes.FORBIDDEN, '您無權刪除此報名')
      case 'SESSION_NOT_FOUND':
        return handleError(res, StatusCodes.NOT_FOUND, '查無場次資訊')
      default:
        return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, '刪除報名時發生錯誤')
    }
  }
}

// 新增：檢查用戶是否已報名特定場次
export const checkEnrollment = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.sessionId)) {
      return handleError(res, StatusCodes.BAD_REQUEST, '無效的場次 ID')
    }

    const enrollment = await Enrollment.findOne({
      s_id: req.params.sessionId,
      userId: req.user._id
    })

    res.status(StatusCodes.OK).json({
      success: true,
      enrolled: !!enrollment,
      message: enrollment ? '已報名該場次' : '未報名該場次'
    })
  } catch (error) {
    console.error('Error in check enrollment:', error)
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, '檢查報名狀態時發生錯誤')
  }
}
