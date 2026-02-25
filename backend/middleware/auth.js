import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import Admin from '../models/Admin.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const admin = await Admin.findById(decoded.userId).select('-password');
    if (!admin) return res.status(401).json({ message: 'Invalid token' });
    req.user = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
