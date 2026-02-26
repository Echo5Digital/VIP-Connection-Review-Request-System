import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { config } from '../config/index.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Admin from '../models/Admin.js';
import Client from '../models/Client.js';

const router = Router();
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function getValidationMessage(errors) {
  return errors.array()[0]?.msg || 'Invalid request data';
}

function createAuthSession(res, user, role) {
  const token = jwt.sign(
    { userId: user._id, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  res.cookie('token', token, authCookieOptions);
}

function serializeUser(user, role) {
  return {
    _id: user._id,
    email: user.email,
    name: user.name,
    role,
  };
}

router.post(
  '/signup',
  requireAuth,
  requireRoles('admin'),
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .matches(/[a-z]/)
    .withMessage('Password must include at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must include at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must include at least one number'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: getValidationMessage(errors) });
      }

      const { name = '', email, password } = req.body;
      const existing = await Admin.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'An account already exists for this email' });
      }

      const admin = await Admin.create({
        name: String(name).trim(),
        email,
        password,
      });

      createAuthSession(res, admin, 'admin');
      return res.status(201).json({
        user: serializeUser(admin, 'admin'),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: getValidationMessage(errors) });
      }

      const { email, password } = req.body;
      const [admin, client] = await Promise.all([
        Admin.findOne({ email }).select('+password'),
        Client.findOne({ email }).select('+password'),
      ]);

      let user = null;
      let role = null;

      if (admin && (await admin.comparePassword(password))) {
        user = admin;
        role = 'admin';
      } else if (client && (await client.comparePassword(password))) {
        if (client.active === false) {
          return res.status(403).json({ message: 'Account is deactivated' });
        }
        user = client;
        role = 'client';
      }

      if (!user || !role) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      createAuthSession(res, user, role);
      res.json({ user: serializeUser(user, role) });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
