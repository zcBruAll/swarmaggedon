import { ObjectId } from "mongodb"
import { COLLECTION_USERS, getDB } from "./config/db.js"
import { BASE_STATS, getEnemyCount } from "../../frontend/src/game/enemies.js"

/**
 * Sends query to API to check if username contains profanity
 * @param {String} username name to check
 * @returns {Boolean} Ok or not (will return true if no api key is available or if query fails) 
 */
export const checkProfanity = async (username) => {
    if (!username) return true

    const result = await fetch('https://vector.profanity.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: username + " " + username + " " + username }),
    })
    
    if (!result.ok) return true
    
    const data = await result.json()
    return !data.isProfanity
}

/**
 * 
 * @param {Number} wave_number
 * @returns [score, kills] for this round 
 */
const calcValuesForWave = (wave_number) => {
    const enemy_data = getEnemyCount(wave_number)

    const score = Object.keys(enemy_data).map((x => 
        Number(BASE_STATS[x].score * enemy_data[x])
    )).reduce((a,b) => a + b, 0)
    const kills = Object.values(enemy_data).reduce((a,b) => a + b, 0)

    return [score, kills]
}

/**
 * 
 * @param {Number} obtainedScore 
 * @param {Number} endWave 
 * @param {Number} obtainedKills
 * @returns {Boolean} true if score is valid, false otherwise
 */
export const checkScoreValidity = (obtainedScore, endWave, obtainedKills) => {
    let lastCompletedWaveScore = 0
    let lastCompletedWaveKills = 0

    // calc all waves up until one before last
    for (let i = 1; i < endWave; i++) {
        const waveData = calcValuesForWave(i)
        lastCompletedWaveScore += waveData[0]
        lastCompletedWaveKills += waveData[1]
    }

    // calc last wave score
    const [lastWaveScore, lastWaveKills] = calcValuesForWave(endWave)   // [score, kills]

    const maxFinalScore = lastCompletedWaveScore + lastWaveScore
    const maxFinalKills = lastCompletedWaveKills + lastWaveKills

    // return validity
    return obtainedScore >= lastCompletedWaveScore && 
        obtainedScore <= maxFinalScore &&
        obtainedKills >= lastCompletedWaveKills &&
        obtainedKills <= maxFinalKills
}

export const setCheater = async (user) => {
    if (!user || !user.id) return
    await getDB().collection(COLLECTION_USERS).updateOne(
        { _id: new ObjectId(user.id) },
        { $set: { cheater: true } }
    )
}