import { MongoClient } from 'mongodb';

const url = `mongodb://${process.env.MONGO_HOST}:27017`;
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