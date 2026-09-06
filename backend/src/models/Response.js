import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema(
  {
    inviteCode: { type: String, required: true, index: true },
    ownerPhone: { type: String, required: true, trim: true },
    ownerEmail: { type: String, required: true, trim: true },
    guestName: { type: String, required: true, trim: true, maxlength: 120 },
    guestPhone: { type: String, required: true, trim: true, maxlength: 40 },
    guestEmail: { type: String, trim: true, lowercase: true },
    answer: { type: String, enum: ['yes', 'no'], required: true },
    noReason: { type: String, trim: true, maxlength: 500 },
    dateType: { type: String, trim: true },
    cuisine: { type: String, trim: true },
    foods: { type: [String], default: [] },
    desserts: { type: [String], default: [] },
    restaurant: { type: String, trim: true },
    cafe: { type: String, trim: true },
    movie: { type: String, trim: true },
    sunsetSpot: { type: String, trim: true },
    surprise: { type: String, trim: true },
    dateDate: { type: String, trim: true },
    dateTime: { type: String, trim: true },
    date: { type: String, trim: true },
    time: { type: String, trim: true },
    location: { type: String, trim: true, maxlength: 240 },
    message: { type: String, trim: true, maxlength: 1000 },
    browser: { type: String, trim: true },
    device: { type: String, trim: true },
    metadata: {
      userAgent: String,
      timezone: String,
      browser: String,
      device: String,
      ipAddress: String
    }
  },
  { timestamps: true }
);

export default mongoose.model('Response', responseSchema);
