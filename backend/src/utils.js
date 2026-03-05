import { ObjectId } from "mongodb"
import { COLLECTION_USERS, getDB } from "./config/db.js"

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

export const checkOnlyAlphanumeric = (str) => {
    // faster than regex
    var code, i, len;

    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123) && // lower alpha (a-z)
            !(code == 95) // _
        ) { 
            return false;
        }
    }
    return true;
}

const BOSS_WAVE_INTERVAL = 10
const ENEMY_RUNNER_SCORE = 8
const ENEMY_BRUTE_SCORE = 25
const ENEMY_SHOOTER_SCORE = 20
const ENEMY_BOSS_SCORE = 300

/**
 * 
 * @param {Number} wave_number
 * @returns [score, kills] for this round 
 */
const calcValuesForWave = (wave_number) => {
    let score = 0
    let kills = 0

    // boss wave ?
    if (wave_number % BOSS_WAVE_INTERVAL == 0) {
        // boss points
        score += ENEMY_BOSS_SCORE
        kills += 1

        // runners
        const runner_number = 1 + Math.floor(wave_number / 10)
        score += runner_number * ENEMY_RUNNER_SCORE
        kills += runner_number
    } else {
        const runnerCount = Math.max(2, Math.floor(wave_number * 0.8) + 2);
        const bruteCount = Math.max(0, Math.floor((wave_number - 3) / 3));
        const shooterCount = Math.max(0, Math.floor((wave_number - 4) / 4));

        score += (runnerCount * ENEMY_RUNNER_SCORE) + (bruteCount * ENEMY_BRUTE_SCORE) + (shooterCount * ENEMY_SHOOTER_SCORE)
        kills += runnerCount + bruteCount + shooterCount
    }

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