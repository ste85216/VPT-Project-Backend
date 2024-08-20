import { Router } from 'express'
import { create, getAll, updateStatus, deleteContact } from '../controllers/contact.js'
import admin from '../middlewares/admin.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

// 公開路由：創建新的聯絡表單
router.post('/', create)

// 需要管理員權限的路由
router.get('/', auth.jwt, admin, getAll)
router.patch('/:id/status', auth.jwt, admin, updateStatus)
router.delete('/:id', auth.jwt, admin, deleteContact)

export default router
