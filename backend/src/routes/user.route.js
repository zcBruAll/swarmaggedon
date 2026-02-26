import {Router} from 'express'
import {getUser, getLoggedInUser, getLoggedInUserFriends, postAddFriend, deleteRemoveFriend, getUserSearch, getUserRuns, getUserLastRun, postNewRun } from '../controllers/user.controller.js'

const router = Router()

router.route("/search/:username").get(getUserSearch)
router.route("/runs").get(getUserRuns)
router.route("/runs").post(postNewRun)
router.route("/last_run").get(getUserLastRun)

router.route("/:id/add").post(postAddFriend)
router.route("/:id/remove").delete(deleteRemoveFriend)

export default router