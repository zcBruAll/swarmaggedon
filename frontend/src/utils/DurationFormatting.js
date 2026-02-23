export const formatDurationToHours = (durationInSeconds) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    const pad = (num) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
