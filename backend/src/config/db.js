import mongoose from 'mongoose';

export async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI is not configured; persistence is disabled.');
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    return false;
  }
}
