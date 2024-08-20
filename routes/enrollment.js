import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import { create, edit, get, getBySession, checkEnrollment, remove } from '../controllers/enrollment.js'

const router = Router()

router.post('/', auth.jwt, create)
router.patch('/:id', auth.jwt, edit)
router.get('/', auth.jwt, get)
router.get('/session/:sessionId', auth.jwt, getBySession)
router.get('/check/:sessionId', auth.jwt, checkEnrollment)
router.delete('/:id', auth.jwt, remove)

export default router
