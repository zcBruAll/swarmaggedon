import { jest } from '@jest/globals';

jest.unstable_mockModule('../../config/db.js', () => ({
    getDB: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
            countDocuments: jest.fn().mockResolvedValue(42),
            aggregate: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([{
                    total_games: 100,
                    total_kills: 500,
                    total_survival_time: 1000
                }])
            })
        })
    }),
    COLLECTION_USERS: 'users',
    COLLECTION_RUNS: 'runs',
    COLLECTION_FRIENDS: 'friends'
}));

const { ApolloServer } = await import('@apollo/server');
const { typeDefs, resolvers } = await import('../index.js');

describe('Apollo Server Schema Integration', () => {
    let testServer;

    beforeAll(() => {
        testServer = new ApolloServer({
            typeDefs,
            resolvers,
        });
    });

    it('validates GraphQL queries against the schema correctly', async () => {
        const query = `
      query GlobalStats {
        global {
          stats {
            total_games
            players_online
          }
        }
      }
    `;

        const response = await testServer.executeOperation({ query });

        expect(response.body.singleResult.errors).toBeUndefined();

        expect(response.body.singleResult.data.global.stats).toEqual({
            total_games: 100,
            players_online: 42
        });
    });
});