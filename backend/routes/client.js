import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Client from '../models/Client.js';

const router = Router();

router.use(requireAuth, requireRoles('admin'));

router.get('/', async (req, res, next) => {
    try {
        const clients = await Client.find({}, '-password').sort({ createdAt: -1 });
        res.json(clients);
    } catch (err) {
        next(err);
    }
});

router.post(
    '/',
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').optional().isString().trim(),
    body('active').optional().isBoolean(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const { email, password, name, active } = req.body;
            const existing = await Client.findOne({ email });
            if (existing) {
                return res.status(409).json({ message: 'Client with this email already exists' });
            }

            const client = await Client.create({ email, password, name, active: active !== false });
            const clientObj = client.toObject();
            delete clientObj.password;
            res.status(201).json(clientObj);
        } catch (err) {
            next(err);
        }
    }
);

router.put(
    '/:id',
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').optional({ values: 'falsy' }).isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').optional({ values: 'falsy' }).isString().trim(),
    body('active').optional().isBoolean(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const client = await Client.findById(req.params.id);
            if (!client) return res.status(404).json({ message: 'Client not found' });

            const { email, password, name, active } = req.body;

            if (email && email !== client.email) {
                const existing = await Client.findOne({ email });
                if (existing) {
                    return res.status(409).json({ message: 'Client with this email already exists' });
                }
                client.email = email;
            }

            if (name !== undefined) client.name = name;
            if (active !== undefined) client.active = active;
            if (password) client.password = password;

            await client.save();
            const clientObj = client.toObject();
            delete clientObj.password;
            res.json(clientObj);
        } catch (err) {
            next(err);
        }
    }
);

router.delete('/:id', async (req, res, next) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.json({ message: 'Client deleted' });
    } catch (err) {
        next(err);
    }
});

export default router;
