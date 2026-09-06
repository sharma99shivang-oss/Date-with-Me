import crypto from 'node:crypto';
import Invitation from '../models/Invitation.js';

function makeCode() {
  return crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase();
}

export async function createInvitation(req, res) {
  const { ownerName, ownerEmail, ownerPhone, nickname, theme } = req.body || {};
  if (!ownerName?.trim() || !ownerEmail?.trim() || !ownerPhone?.trim()) {
    return res.status(400).json({ message: 'Name, email, and WhatsApp number are required.' });
  }
  let inviteCode = makeCode();
  while (await Invitation.exists({ inviteCode })) inviteCode = makeCode();
  const invitation = await Invitation.create({ ownerName, ownerEmail, ownerPhone, nickname, theme: theme || 'pink', inviteCode });
  res.status(201).json({
    invitation: invitation.toObject(),
    shareUrl: `${process.env.CLIENT_ORIGIN?.split(',')[0] || 'http://localhost:5173'}/invite/${inviteCode}`
  });
}

export async function getInvitation(req, res) {
  const invitation = await Invitation.findOne({ inviteCode: req.params.inviteCode, status: 'active' }).lean();
  if (!invitation) return res.status(404).json({ message: 'This invitation is unavailable.' });
  res.json({ invitation });
}
