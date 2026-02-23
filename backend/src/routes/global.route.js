import {Router} from 'express'
import { getGlobalStats, getGlobalLeaderboard } from '../controllers/global.controller.js'

const router = Router()

router.route("/stats").get(getGlobalStats)
router.route("/leaderboard").get(getGlobalLeaderboard)

export default router