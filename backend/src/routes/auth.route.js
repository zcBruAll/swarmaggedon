import {Router} from 'express'
import { postLogin, postRegister, logout } from '../controllers/auth.controller.js'

const router = Router()

router.route("/login").post(postLogin)
router.route("/register").post(postRegister)
router.route("/logout").delete(logout)

export default router