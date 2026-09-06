import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Response from '../models/Response.js';
import Invitation from '../models/Invitation.js';
import Admin from '../models/Admin.js';
import { toCsv } from '../utils/csv.js';

function signAdmin(admin) {
  return jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET || 'development-secret', {
    expiresIn: '7d'
  });
}

function filtersFromQuery(query) {
  const filter = {};
  if (query.answer && ['yes', 'no'].includes(query.answer)) filter.answer = query.answer;
  if (query.dateType) filter.dateType = query.dateType;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) filter.createdAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
  }
  if (query.search) {
    const regex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ location: regex }, { message: regex }, { restaurant: regex }, { cafe: regex }, { movie: regex }, { surprise: regex }, { cuisine: regex }, { foods: regex }, { desserts: regex }, { inviteCode: regex }, { ownerEmail: regex }, { ownerPhone: regex }];
  }
  return filter;
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  const admin = await Admin.findOne({ email: String(email || '').toLowerCase() });
  if (!admin || !(await bcrypt.compare(password || '', admin.passwordHash))) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }
  res.json({ token: signAdmin(admin), admin: { email: admin.email } });
}

export async function analytics(req, res) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [owners, total, yes, no, today, upcoming, latest] = await Promise.all([
    Invitation.countDocuments(),
    Response.countDocuments(),
    Response.countDocuments({ answer: 'yes' }),
    Response.countDocuments({ answer: 'no' }),
    Response.countDocuments({ createdAt: { $gte: startOfToday } }),
    Response.countDocuments({ answer: 'yes', dateDate: { $gte: startOfToday.toISOString().slice(0, 10) } }),
    Response.find().sort({ createdAt: -1 }).limit(5).lean()
  ]);
  const dateTypes = await Response.aggregate([
    { $match: { answer: 'yes' } },
    { $group: { _id: '$dateType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  res.json({ owners, total, yes, no, today, upcoming, yesRate: total ? Math.round((yes / total) * 100) : 0, dateTypes, latest });
}

export async function listInvitations(req, res) {
  const search = req.query.search?.trim();
  const filter = search ? { $or: [{ ownerName: new RegExp(search, 'i') }, { ownerEmail: new RegExp(search, 'i') }, { ownerPhone: new RegExp(search, 'i') }, { inviteCode: new RegExp(search, 'i') }] } : {};
  const items = await Invitation.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ items });
}

export async function deleteInvitation(req, res) {
  const invitation = await Invitation.findOneAndDelete({ inviteCode: req.params.inviteCode });
  if (!invitation) return res.status(404).json({ message: 'Invitation not found.' });
  await Response.deleteMany({ inviteCode: invitation.inviteCode });
  res.json({ message: 'Invitation and its responses deleted.' });
}

export async function listResponses(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = filtersFromQuery(req.query);
  const [items, total] = await Promise.all([
    Response.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Response.countDocuments(filter)
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}

export async function getResponse(req, res) {
  const response = await Response.findById(req.params.id).lean();
  if (!response) return res.status(404).json({ message: 'Response not found.' });
  res.json(response);
}

export async function deleteResponse(req, res) {
  const response = await Response.findByIdAndDelete(req.params.id);
  if (!response) return res.status(404).json({ message: 'Response not found.' });
  res.json({ message: 'Response deleted.' });
}

export async function exportResponses(req, res) {
  const rows = await Response.find(filtersFromQuery(req.query)).sort({ createdAt: -1 }).lean();
  if (req.query.format === 'json') return res.json(rows);
  res.type('text/csv').attachment('date-me-responses.csv').send(toCsv(rows));
}
