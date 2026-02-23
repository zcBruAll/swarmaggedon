import { MongoClient } from 'mongodb';

const url = `mongodb://${process.env.NODE_ENV === 'production' ? 'mongo' : 'localhost'}:27017`;
const client = new MongoClient(url);

let db;

export const connectDB = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db('swarmaggedon');
  } catch (e) {
    console.error("Connection error", e);
    process.exit(1);
  }
};

export const getDB = () => db;

export const COLLECTION_USERS = 'users'
export const COLLECTION_FRIENDS = 'friends'
export const COLLECTION_RUNS = 'runs'