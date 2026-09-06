import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required.' });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
}
