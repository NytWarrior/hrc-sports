import mongoose from 'mongoose';

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cached = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cached;

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing. Add it to .env.local or Vercel Environment Variables.');
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(uri, { bufferCommands: false });
  try { cached.conn = await cached.promise; }
  catch (error) { cached.promise = null; throw error; }
  return cached.conn;
}
