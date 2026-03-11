import { Db, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/mywallet";

// Singleton: reuse connection across hot-reloads in dev
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();

  console.log("[DB] Connected to MongoDB");
  return db;
}
