import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Admin from '../models/Admin.js';
import Client from '../models/Client.js';

const router = Router();

router.use(requireAuth, requireRoles('admin'));

// GET all users
router.get('/', async (req, res, next) => {
    try {
        const [admins, clients] = await Promise.all([
            Admin.find({}, '-password'),
            Client.find({}, '-password'),
        ]);

        const allUsers = [
            ...admins.map(a => ({ ...a.toObject(), role: 'admin' })),
            ...clients.map(c => ({ ...c.toObject(), role: 'client' })),
        ];

        res.json(allUsers);
    } catch (err) {
        next(err);
    }
});

// POST new user
router.post(
    '/',
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['admin', 'client']),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const { email, password, name, role } = req.body;

            if (role === 'admin') {
                const existing = await Admin.findOne({ email });
                if (existing) return res.status(409).json({ message: 'User already exists' });
                const user = await Admin.create({ email, password, name });
                res.status(201).json({ ...user.toObject(), role: 'admin' });
            } else {
                const existing = await Client.findOne({ email });
                if (existing) return res.status(409).json({ message: 'User already exists' });
                const user = await Client.create({ email, password, name });
                res.status(201).json({ ...user.toObject(), role: 'client' });
            }
        } catch (err) {
            next(err);
        }
    }
);

// DELETE user
router.delete('/:role/:id', async (req, res, next) => {
    try {
        const { role, id } = req.params;
        if (role === 'admin') {
            // Prevent deleting the last admin if needed
            await Admin.findByIdAndDelete(id);
        } else {
            await Client.findByIdAndDelete(id);
        }
        res.json({ message: 'User removed' });
    } catch (err) {
        next(err);
    }
});

export default router;
