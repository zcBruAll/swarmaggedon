import { gql } from 'graphql-tag';
import { COLLECTION_USERS, COLLECTION_RUNS, getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const adminTypeDefs = gql`
    type RunWithUser {
        id: ID!
        user_id: ID
        username: String
        date: String
        score: Int!
        duration: Int!
        wave: Int!
        kills: Int!
        cheater: Boolean
    }

    type AdminRunsResult {
        runs: [RunWithUser]
        total: Int!
    }

    type AdminUser {
        id: ID!
        username: String!
        email: String!
        cheater: Boolean
        date_created: Float
        last_online: Float
        run_count: Int
    }

    extend type Query {
        adminLogin(password: String!): String
        adminRuns(
            page: Int
            limit: Int
            username: String
            cheaterOnly: Boolean
            minScore: Int
            maxScore: Int
            sortBy: String
            sortDir: String
        ): AdminRunsResult
        adminUsers(
            page: Int
            limit: Int
            username: String
            cheaterOnly: Boolean
        ): [AdminUser]
    }

    extend type Mutation {
        adminDeleteRun(runId: ID!): Boolean
        adminDeleteRunsByUser(userId: ID!): Int
        adminSetCheater(userId: ID!, cheater: Boolean!): Boolean
        adminDeleteUser(userId: ID!): Boolean
    }
`;

function verifyAdmin(context) {
    const token = context.adminToken;
    if (!token) throw new Error('Admin authentication required');
    try {
        jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    } catch {
        throw new Error('Invalid or expired admin token');
    }
}

export const adminResolvers = {
    Query: {
        adminLogin: async (_, { password }, { res }) => {
            const adminSecret = process.env.ADMIN_SECRET;
            if (!adminSecret) throw new Error('Admin not configured');
            if (password !== adminSecret) throw new Error('Invalid admin password');

            const token = jwt.sign(
                { admin: true },
                process.env.ADMIN_JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.cookie('admin_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 1 * 60 * 60 * 1000 // 1 hour
            });

            return token;
        },

        adminRuns: async (_, { page = 1, limit = 50, username, cheaterOnly, minScore, maxScore, sortBy = 'date', sortDir = 'desc' }, context) => {
            verifyAdmin(context);

            const db = getDB();
            const skip = (page - 1) * limit;

            // Build match for runs
            const runMatch = {};
            if (minScore != null) runMatch.score = { ...(runMatch.score || {}), $gte: minScore };
            if (maxScore != null) runMatch.score = { ...(runMatch.score || {}), $lte: maxScore };

            const sortField = ['date', 'score', 'wave', 'kills', 'duration'].includes(sortBy) ? sortBy : 'date';
            const sortOrder = sortDir === 'asc' ? 1 : -1;

            // Build user filter if needed
            let userIdFilter = null;
            if (username) {
                const users = await db.collection(COLLECTION_USERS).find(
                    { username: { $regex: username, $options: 'i' } },
                    { projection: { _id: 1 } }
                ).toArray();
                userIdFilter = users.map(u => u._id.toString());
                if (userIdFilter.length === 0) return { runs: [], total: 0 };
                runMatch.user_id = { $in: userIdFilter };
            }

            if (cheaterOnly) {
                // Get cheater user ids
                const cheaters = await db.collection(COLLECTION_USERS).find(
                    { cheater: true },
                    { projection: { _id: 1 } }
                ).toArray();
                const cheaterIds = cheaters.map(u => u._id.toString());
                if (username) {
                    runMatch.user_id = { $in: cheaterIds.filter(id => userIdFilter?.includes(id)) };
                } else {
                    runMatch.user_id = { $in: cheaterIds };
                }
                if (!runMatch.user_id.$in.length) return { runs: [], total: 0 };
            }

            const [runsRaw, totalArr] = await Promise.all([
                db.collection(COLLECTION_RUNS).aggregate([
                    { $match: runMatch },
                    { $sort: { [sortField]: sortOrder } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: COLLECTION_USERS,
                            let: { uid: '$user_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$uid'] } } },
                                { $project: { username: 1, cheater: 1, _id: 0 } }
                            ],
                            as: 'user_info'
                        }
                    },
                    { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } }
                ]).toArray(),
                db.collection(COLLECTION_RUNS).countDocuments(runMatch)
            ]);

            const runs = runsRaw.map(r => ({
                id: r._id.toString(),
                user_id: r.user_id,
                username: r.user_info?.username || null,
                date: r.date ? new Date(r.date).toISOString() : null,
                score: r.score,
                duration: r.duration,
                wave: r.wave,
                kills: r.kills,
                cheater: r.user_info?.cheater || false,
            }));

            return { runs, total: totalArr };
        },

        adminUsers: async (_, { page = 1, limit = 50, username, cheaterOnly }, context) => {
            verifyAdmin(context);

            const db = getDB();
            const skip = (page - 1) * limit;
            const match = {};
            if (username) match.username = { $regex: username, $options: 'i' };
            if (cheaterOnly) match.cheater = true;

            const users = await db.collection(COLLECTION_USERS).aggregate([
                { $match: match },
                { $sort: { date_created: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: COLLECTION_RUNS,
                        let: { uid: { $toString: '$_id' } },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$user_id', '$$uid'] } } },
                            { $count: 'count' }
                        ],
                        as: 'run_stats'
                    }
                }
            ]).toArray();

            return users.map(u => ({
                id: u._id.toString(),
                username: u.username,
                email: u.email,
                cheater: u.cheater || false,
                date_created: u.date_created,
                last_online: u.last_online,
                run_count: u.run_stats?.[0]?.count || 0,
            }));
        },
    },

    Mutation: {
        adminDeleteRun: async (_, { runId }, context) => {
            verifyAdmin(context);
            const result = await getDB().collection(COLLECTION_RUNS).deleteOne({ _id: new ObjectId(runId) });
            return result.deletedCount > 0;
        },

        adminDeleteRunsByUser: async (_, { userId }, context) => {
            verifyAdmin(context);
            const result = await getDB().collection(COLLECTION_RUNS).deleteMany({ user_id: userId });
            return result.deletedCount;
        },

        adminSetCheater: async (_, { userId, cheater }, context) => {
            verifyAdmin(context);
            const result = await getDB().collection(COLLECTION_USERS).updateOne(
                { _id: new ObjectId(userId) },
                { $set: { cheater } }
            );
            return result.modifiedCount > 0;
        },

        adminDeleteUser: async (_, { userId }, context) => {
            verifyAdmin(context);
            const db = getDB();
            await db.collection(COLLECTION_USERS).deleteOne({ _id: new ObjectId(userId) });
            await db.collection(COLLECTION_RUNS).updateMany({ user_id: userId }, { $set: { user_id: null } });
            return true;
        },
    }
}