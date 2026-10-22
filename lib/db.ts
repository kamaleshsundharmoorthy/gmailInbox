import mongoose from "mongoose";

const uri = process.env.MONGODB_URI!;

if (!uri) {
  throw new Error("MONGODB_URI is missing from .env.local");
}

const globalForMongoose = globalThis as typeof globalThis & {
  mongoosePromise?: Promise<typeof mongoose>;
};

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!globalForMongoose.mongoosePromise) {
    globalForMongoose.mongoosePromise = mongoose.connect(uri);
  }

  try {
    return await globalForMongoose.mongoosePromise;
  } catch (error) {
    globalForMongoose.mongoosePromise = undefined;
    throw error;
  }
}