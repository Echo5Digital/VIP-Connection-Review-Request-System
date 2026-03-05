import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Restriction from '../models/Restriction.js';

const router = Router();

router.use(requireAuth, requireRoles('admin'));

// GET all restrictions
router.get('/', async (req, res, next) => {
    try {
        const list = await Restriction.find().sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        next(err);
    }
});

// POST new restriction
router.post(
    '/',
    body('customerCode').optional(),
    body('passengerName').optional(),
    body('email').optional(),
    body('phone').optional(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const item = await Restriction.create(req.body);
            res.status(201).json(item);
        } catch (err) {
            next(err);
        }
    }
);

// PUT update restriction
router.put('/:id', async (req, res, next) => {
    try {
        const item = await Restriction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Entry not found' });
        res.json(item);
    } catch (err) {
        next(err);
    }
});

// DELETE restriction
router.delete('/:id', async (req, res, next) => {
    try {
        await Restriction.findByIdAndDelete(req.params.id);
        res.json({ message: 'Entry removed' });
    } catch (err) {
        next(err);
    }
});

export default router;
