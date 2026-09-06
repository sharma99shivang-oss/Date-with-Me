import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';

if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required to seed an admin.');
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');

await mongoose.connect(process.env.MONGO_URI);
const passwordHash = await bcrypt.hash("Princess@2026", 12);
await Admin.findOneAndUpdate(
  { email: process.env.ADMIN_EMAIL.toLowerCase() },
  { email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash },
  { upsert: true, new: true }
);
console.log(`Admin seeded for ${process.env.ADMIN_EMAIL}`);
await mongoose.disconnect();
