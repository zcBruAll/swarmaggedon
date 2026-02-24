import {Router} from 'express'
import {getUser, getLoggedInUser, getLoggedInUserFriends, postAddFriend, deleteRemoveFriend, getUserSearch} from '../controllers/user.controller.js'

const router = Router()

router.route("/").get(getLoggedInUser)
router.route("/friends").get(getLoggedInUserFriends)
router.route("/search/:username").get(getUserSearch)

router.route("/:id").get(getUser)
router.route("/:id/add").post(postAddFriend)
router.route("/:id/remove").delete(deleteRemoveFriend)

export default router