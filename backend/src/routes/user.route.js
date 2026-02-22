import {Router} from 'express'
import {getUser, getLoggedInUser} from '../controllers/user.controller.js'

const router = Router()

router.route("/").get(getLoggedInUser)
router.route("/:id").get(getUser)

export default router