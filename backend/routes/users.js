import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Admin from '../models/Admin.js';
import Staff from '../models/Staff.js';

const router = Router();

router.use(requireAuth, requireRoles('admin', 'manager'));

// GET all users
router.get('/', async (req, res, next) => {
    try {
        const isManager = req.user.role === 'manager';
        const [admins, staff] = await Promise.all([
            isManager ? Promise.resolve([]) : Admin.find({}, '-password'),
            Staff.find({}, '-password'),
        ]);

        const allUsers = [
            ...admins.map(a => ({ ...a.toObject(), role: 'admin' })),
            ...staff.map(s => ({ ...s.toObject() })),
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
    body('role').isIn(['admin', 'manager', 'dispatcher']),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const { email, password, name, role } = req.body;

            if (req.user.role === 'manager' && role === 'admin') {
                return res.status(403).json({ message: 'Managers cannot create admin users.' });
            }

            if (role === 'admin') {
                const existing = await Admin.findOne({ email });
                if (existing) return res.status(409).json({ message: 'User already exists' });
                const user = await Admin.create({ email, password, name });
                res.status(201).json({ ...user.toObject(), role: 'admin' });
            } else {
                const existing = await Staff.findOne({ email });
                if (existing) return res.status(409).json({ message: 'User already exists' });
                const user = await Staff.create({ email, password, name, role });
                res.status(201).json({ ...user.toObject() });
            }
        } catch (err) {
            next(err);
        }
    }
);

// PUT update user
router.put(
    '/:role/:id',
    body('email').optional().isEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('role').optional().isIn(['admin', 'manager', 'dispatcher']),
    async (req, res, next) => {
        try {
            const { role, id } = req.params;
            const { email, password, name, active, role: newRole } = req.body;

            if (req.user.role === 'manager' && (role === 'admin' || newRole === 'admin')) {
                return res.status(403).json({ message: 'Managers cannot edit admin users.' });
            }

            let user;
            if (role === 'admin') {
                user = await Admin.findById(id).select('+password');
            } else {
                user = await Staff.findById(id).select('+password');
            }

            if (!user) return res.status(404).json({ message: 'User not found' });

            if (email) user.email = email;
            if (name !== undefined) user.name = name;
            if (active !== undefined) user.active = active;
            if (password) user.password = password;

            // Handle role change
            if (newRole && newRole !== role) {
                if (role !== 'admin' && newRole !== 'admin') {
                    user.role = newRole;
                } else if (role === 'admin' && newRole !== 'admin') {
                    // Move Admin to Staff
                    const staffData = user.toObject();
                    delete staffData._id;
                    staffData.role = newRole;
                    await Staff.create(staffData);
                    await Admin.findByIdAndDelete(id);
                    return res.json({ message: 'User updated and moved to Staff' });
                } else if (role !== 'admin' && newRole === 'admin') {
                    // Move Staff to Admin
                    const adminData = user.toObject();
                    delete adminData._id;
                    delete adminData.role;
                    await Admin.create(adminData);
                    await Staff.findByIdAndDelete(id);
                    return res.json({ message: 'User updated and moved to Admin' });
                }
            }

            await user.save();
            res.json({ message: 'User updated successfully' });
        } catch (err) {
            next(err);
        }
    }
);

// DELETE user
router.delete('/:role/:id', async (req, res, next) => {
    try {
        const { role, id } = req.params;

        if (req.user.role === 'manager' && role === 'admin') {
            return res.status(403).json({ message: 'Managers cannot delete admin users.' });
        }

        if (role === 'admin') {
            await Admin.findByIdAndDelete(id);
        } else {
            await Staff.findByIdAndDelete(id);
        }
        res.json({ message: 'User removed' });
    } catch (err) {
        next(err);
    }
});

export default router;
