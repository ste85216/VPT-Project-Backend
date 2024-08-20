import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import uploadVenue from '../middlewares/uploadVenue.js'
import admin from '../middlewares/admin.js'
import { create, getAll, get, edit, getId, remove } from '../controllers/venue.js'

const router = Router()

router.post('/', auth.jwt, admin, uploadVenue, create)
router.get('/', get)
router.get('/all', auth.jwt, admin, getAll)
router.get('/:id', getId)
router.patch('/:id', auth.jwt, admin, uploadVenue, edit)
router.delete('/:id', auth.jwt, admin, remove)

export default router
