import {Router} from 'express'
import {getUser, getLoggedInUser, getLoggedInUserFriends} from '../controllers/user.controller.js'

const router = Router()

router.route("/").get(getLoggedInUser)
router.route("/friends").get(getLoggedInUserFriends)
router.route("/:id").get(getUser)

export default router