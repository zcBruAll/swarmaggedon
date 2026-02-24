import {Router} from 'express'
import {getUser, getLoggedInUser, getLoggedInUserFriends, postAddFriend, postRemoveFriend} from '../controllers/user.controller.js'

const router = Router()

router.route("/").get(getLoggedInUser)
router.route("/friends").get(getLoggedInUserFriends)
router.route("/:id").get(getUser)
router.route("/:id/add").post(postAddFriend)
router.route("/:id/remove").post(postRemoveFriend)

export default router