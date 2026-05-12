import { jest } from '@jest/globals';

const mockInsertOne = jest.fn();
const mockFind = jest.fn();
const mockToArray = jest.fn();

jest.unstable_mockModule('../../config/db.js', () => ({
    getDB: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
            insertOne: mockInsertOne,
            find: mockFind.mockReturnValue({ sort: jest.fn().mockReturnValue({ toArray: mockToArray }) }),
            findOne: jest.fn()
        })
    }),
    COLLECTION_RUNS: 'runs',
    COLLECTION_FRIENDS: 'friends',
    COLLECTION_USERS: 'users',
}));

jest.unstable_mockModule('../../utils.js', () => ({
    checkScoreValidity: jest.fn(),
    setCheater: jest.fn()
}));

const { runResolvers } = await import('../runs.js');
const { checkScoreValidity, setCheater } = await import('../../utils.js');

describe('Runs GraphQL Resolvers', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Mutation: addRun', () => {
        const validArgs = { score: 100, duration: 300, wave: 5, kills: 20 };
        const validContext = { user: { id: 'user123', username: 'TestPlayer' } };

        it('should throw an error if the user is not authenticated', async () => {
            const context = { user: null };

            await expect(runResolvers.Mutation.addRun(null, validArgs, context))
                .rejects
                .toThrow("You are not logged in");

            expect(mockInsertOne).not.toHaveBeenCalled();
        });

        it('should insert a run successfully for valid inputs', async () => {
            checkScoreValidity.mockReturnValue(true);
            mockInsertOne.mockResolvedValue({ acknowledged: true, insertedId: 'run123' });

            const result = await runResolvers.Mutation.addRun(null, validArgs, validContext);

            expect(result).toBe("Inserted new run");
            expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 'user123',
                score: 100,
                duration: 300,
                wave: 5,
                kills: 20
            }));
        });

        it('should trigger anti-cheat and throw if values are negative', async () => {
            const maliciousArgs = { score: -500, duration: 300, wave: 5, kills: 20 };

            await expect(runResolvers.Mutation.addRun(null, maliciousArgs, validContext))
                .rejects
                .toThrow(/Invalid run/);

            expect(setCheater).toHaveBeenCalledWith(validContext.user);
            expect(mockInsertOne).not.toHaveBeenCalled();
        });

        it('should trigger anti-cheat if score validity math fails', async () => {
            checkScoreValidity.mockReturnValue(false);

            await expect(runResolvers.Mutation.addRun(null, validArgs, validContext))
                .rejects
                .toThrow(/Invalid run/);

            expect(setCheater).toHaveBeenCalledWith(validContext.user);
        });
    });
});