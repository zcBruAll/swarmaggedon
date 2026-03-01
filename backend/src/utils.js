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