import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('Please define MONGODB_URI in your .env.local file');

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
// Cache across hot reloads in development to avoid opening many connections.
const globalForMongoose = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cached = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cached;

export default async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}
