import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import admin from '../middlewares/admin.js'
import {
  createSession,
  editSession,
  getUserSessions,
  deleteSession,
  getAllSessions,
  getSessionById // 新增這個導入
} from '../controllers/session.js'

const router = Router()

router.post('/', auth.jwt, createSession)
router.get('/', getAllSessions)
router.get('/user', auth.jwt, getUserSessions)
router.get('/all', auth.jwt, admin, getAllSessions)
router.patch('/:id', auth.jwt, editSession)
router.delete('/:id', auth.jwt, deleteSession)

// 新增這個路由
router.get('/:id', auth.jwt, getSessionById)

export default router
