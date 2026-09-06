import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  ownerName: { type: String, required: true, trim: true, maxlength: 120 },
  ownerEmail: { type: String, required: true, trim: true, lowercase: true },
  ownerPhone: { type: String, required: true, trim: true, maxlength: 40 },
  nickname: { type: String, trim: true, maxlength: 80 },
  inviteCode: { type: String, required: true, unique: true, index: true },
  theme: { type: String, default: 'pink', trim: true },
  status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Invitation', invitationSchema);
