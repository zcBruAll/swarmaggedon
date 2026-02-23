import { getDB, COLLECTION_USERS, COLLECTION_RUNS } from "../config/db.js";

const getGlobalStats = async (req, res) => {
    const db = getDB()
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    
    try {
        const players_online = await db.collection(COLLECTION_USERS).countDocuments({
            last_online: { $gte: fiveMinutesAgo }
        })

        const global_run_stats = await db.collection(COLLECTION_RUNS).aggregate([
            {
                $group: {
                    _id: null,
                    total_games: { $sum: 1 },
                    total_kills: { $sum: "$kills" },
                    avg_survival_time: { $avg: "$duration" }
                }
            }
        ]).toArray()

        const stats = {
            players_online,
            total_games: global_run_stats[0]?.total_games || 0,
            total_kills: global_run_stats[0]?.total_kills || 0,
            avg_survival_time: global_run_stats[0]?.avg_survival_time || 0
        }

        return res.status(200).json(stats)
    } catch (error) {
        console.error("Error fetching global stats:", error)
        return res.status(500).send("Internal server error")
    }
}

const getGlobalLeaderboard = async (req, res) => {}

export {
    getGlobalLeaderboard,
    getGlobalStats
}