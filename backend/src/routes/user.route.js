import {Router} from 'express'
import {getUser, getLoggedInUser, getLoggedInUserFriends, postAddFriend, deleteRemoveFriend, getUserSearch, getUserRuns, getUserLastRun, postNewRun } from '../controllers/user.controller.js'

const router = Router()

router.route("/search/:username").get(getUserSearch)

export default router