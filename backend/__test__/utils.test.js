import { jest } from '@jest/globals';
import {
    checkOnlyAlphanumeric,
    checkScoreValidity,
    checkProfanity
} from '../src/utils.js';

global.fetch = jest.fn();

describe('Backend Utilities (utils.js)', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('checkOnlyAlphanumeric()', () => {
        it('should return true for valid alphanumeric strings with underscores', () => {
            expect(checkOnlyAlphanumeric('Player123')).toBe(true);
            expect(checkOnlyAlphanumeric('cool_user_name')).toBe(true);
            expect(checkOnlyAlphanumeric('UPPERCASE_99')).toBe(true);
        });

        it('should return false for strings with spaces or special characters', () => {
            expect(checkOnlyAlphanumeric('Player 123')).toBe(false);
            expect(checkOnlyAlphanumeric('hacker@domain')).toBe(false);
            expect(checkOnlyAlphanumeric('user-name')).toBe(false);
        });
    });

    describe('checkProfanity()', () => {
        it('should return true immediately if no username is provided', async () => {
            const result = await checkProfanity('');
            expect(result).toBe(true);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should return true if the API request fails (fallback behavior)', async () => {
            fetch.mockResolvedValueOnce({ ok: false });

            const result = await checkProfanity('someName');
            expect(result).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('should return true if the name is NOT a profanity', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isProfanity: false }),
            });

            const result = await checkProfanity('cleanName');
            expect(result).toBe(true);
        });

        it('should return false if the name IS a profanity', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ isProfanity: true }),
            });

            const result = await checkProfanity('badWordName');
            expect(result).toBe(false);
        });
    });

    describe('checkScoreValidity()', () => {
        it('should return true for a plausible score and kill count', () => {
            const obtainedScore = 50;
            const endWave = 5;
            const obtainedKills = 10;

            expect(checkScoreValidity(obtainedScore, endWave, obtainedKills)).toBe(true);
        });

        it('should return false if the obtained score exceeds the theoretical maximum', () => {
            const obtainedScore = 1000000;
            const endWave = 2;
            const obtainedKills = 10;

            expect(checkScoreValidity(obtainedScore, endWave, obtainedKills)).toBe(false);
        });

        it('should return false if the obtained kills exceed the theoretical maximum', () => {
            const obtainedScore = 10;
            const endWave = 2;
            const obtainedKills = 5000;

            expect(checkScoreValidity(obtainedScore, endWave, obtainedKills)).toBe(false);
        });
    });

});