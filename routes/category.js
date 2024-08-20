import { Router } from 'express'
import { create, getAll, edit, getId, deleteCategory } from '../controllers/category.js'
import * as auth from '../middlewares/auth.js'
import admin from '../middlewares/admin.js'

const router = Router()

router.post('/', auth.jwt, admin, create) // 新增分類
router.get('/', getAll) // 取得所有分類
router.get('/:id', getId) // 取得單一分類
router.patch('/:id', auth.jwt, admin, edit) // 編輯分類
router.delete('/:id', auth.jwt, admin, deleteCategory) // 刪除分類

export default router
