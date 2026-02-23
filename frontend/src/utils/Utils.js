/**
 * Formats a duration in seconds into hh:mm:ss string.
 * @param {number} durationInSeconds 
 * @returns {string}
 */
export const formatDurationToHours = (durationInSeconds) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    const pad = (num) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Formats a number with suffixes (K, M, B) for short representation.
 * @param {number} num 
 * @returns {string}
 */
export const formatNumberShort = (num) => {
    if (num < 1000) return num.toString()
    num /= 1000
    if (num < 1000) return num.toFixed(1).replace(/\.0$/, '') + "K"
    num /= 1000
    if (num < 1000) return num.toFixed(1).replace(/\.0$/, '') + "M"
    num /= 1000
    if (num < 1000) return num.toFixed(1).replace(/\.0$/, '') + "B"
    num /= 1000
    if (num < 1000) return num.toFixed(1).replace(/\.0$/, '') + "T"
    return "∞"
};

/**
 * Formats a number with thousands separators.
 * @param {number} num 
 * @returns {string}
 */
export const formatNumberFull = (num) => {
    return new Intl.NumberFormat().format(num);
};
