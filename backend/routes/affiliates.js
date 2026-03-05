import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Affiliate from '../models/Affiliate.js';
import Rating from '../models/Rating.js';
import Contact from '../models/Contact.js';

const router = Router();

router.use(requireAuth, requireRoles('admin'));

// GET all affiliates
router.get('/', async (req, res, next) => {
    try {
        const affiliates = await Affiliate.find().sort({ name: 1 });

        // In a real app, we would calculate avg rating and trip count via aggregation
        // For now, let's just return the list. We can add aggregation later if needed.
        const enhancedAffiliates = await Promise.all(affiliates.map(async (aff) => {
            // Logic for calculating stats could go here or be pre-calculated
            return {
                ...aff.toObject(),
                avgRating: 0, // Placeholder
                tripsCount: 0, // Placeholder
            };
        }));

        res.json(enhancedAffiliates);
    } catch (err) {
        next(err);
    }
});

// POST new affiliate
router.post(
    '/',
    body('code').notEmpty(),
    body('name').notEmpty(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const existing = await Affiliate.findOne({ code: req.body.code });
            if (existing) return res.status(409).json({ message: 'Affiliate code already exists' });

            const affiliate = await Affiliate.create(req.body);
            res.status(201).json(affiliate);
        } catch (err) {
            next(err);
        }
    }
);

// PUT update affiliate
router.put('/:id', async (req, res, next) => {
    try {
        const affiliate = await Affiliate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!affiliate) return res.status(404).json({ message: 'Affiliate not found' });
        res.json(affiliate);
    } catch (err) {
        next(err);
    }
});

// DELETE affiliate
router.delete('/:id', async (req, res, next) => {
    try {
        await Affiliate.findByIdAndDelete(req.params.id);
        res.json({ message: 'Affiliate removed' });
    } catch (err) {
        next(err);
    }
});

export default router;
