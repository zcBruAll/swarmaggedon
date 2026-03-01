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

/**
 * Checks if specified date is in the last 5 minutes.
 * @param {number} last_online
 * @returns {boolean}
 */
export const isUserOnline = (last_online) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return last_online > fiveMinutesAgo
}

/**
 * Formats a date into a relative time string (e.g., "2 hours ago").
 * @param {string|number|Date} date 
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
    if (!date) return "never";
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return "just now";
    
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    
    return `${Math.floor(months / 12)}y ago`;
};

export const formatTotalToHours = (duration) => {
    const hours = duration / 3600
    return hours.toFixed(1)
}