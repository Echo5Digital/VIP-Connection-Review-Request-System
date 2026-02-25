import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import Admin from '../models/Admin.js';
import Customer from '../models/Customer.js';

const roleModelMap = {
  admin: Admin,
  customer: Customer,
};

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const role = decoded.role === 'customer' ? 'customer' : 'admin';
    const UserModel = roleModelMap[role];
    const user = await UserModel.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = { ...user.toObject(), role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
