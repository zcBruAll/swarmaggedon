import { MongoClient } from 'mongodb';

const url = process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : process.env.MONGODB_DEV_URI;
const client = new MongoClient(url);

let db;

export const connectDB = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db(process.env.MONGODB_DB_NAME);
    await ensureIndexes();
  } catch (e) {
    console.error("Connection error", e);
    process.exit(1);
  }
};

const ensureIndexes = async () => {
  //   - runs {user_id: 1, score: -1}   getRankAndScore userBest ($match user_id + $max score)
  //   - runs {date: 1, score: -1}      daily/weekly leaderboards ($match date + $sort score)
  //   - runs {score: -1}               all-time leaderboard ($sort score, index scan delivers top-10)
  //   - users {last_online: 1}         Global.stats.players_online (countDocuments)
  await Promise.all([
    db.collection(COLLECTION_RUNS).createIndex({ user_id: 1, score: -1 }),
    db.collection(COLLECTION_RUNS).createIndex({ date: 1, score: -1 }),
    db.collection(COLLECTION_RUNS).createIndex({ score: -1 }),
    db.collection(COLLECTION_USERS).createIndex({ last_online: 1 }),
  ]);
};

export const getDB = () => db;

export const COLLECTION_USERS = 'users'
export const COLLECTION_FRIENDS = 'friends'
export const COLLECTION_RUNS = 'runs'