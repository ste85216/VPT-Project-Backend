import { Router } from 'express'
import { uploadAvatar } from '../middlewares/uploadAvatar.js'
import admin from '../middlewares/admin.js'
import { create, login, extend, profile, logout, getAll, edit, get, getId, remove, getCart, editCart, updateAvatar, updateUserProfile } from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

router.post('/', create)
router.post('/login', auth.login, login)
router.patch('/extend', auth.jwt, extend)
router.get('/profile', auth.jwt, profile)
router.delete('/logout', auth.jwt, logout)
router.patch('/cart', auth.jwt, editCart)
router.get('/cart', auth.jwt, getCart)
router.patch('/avatar', auth.jwt, uploadAvatar, updateAvatar)
router.patch('/profile', auth.jwt, updateUserProfile)

// 新增的路由
router.get('/', get)
router.get('/all', auth.jwt, admin, getAll)
router.get('/:id', auth.jwt, getId)
router.patch('/:id', auth.jwt, admin, edit)
router.delete('/:id', auth.jwt, admin, remove)

export default router
