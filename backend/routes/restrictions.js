import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Restriction from '../models/Restriction.js';
import Contact from '../models/Contact.js';

// Built-in restriction rules (mirrors manifests.js)
const BUILT_IN_RESTRICTION_CODES = [
    { type: 'exact',  code: 'V825', reason: 'Built-in Restriction Rule' },
    { type: 'prefix', code: 'VAFF', reason: 'Built-in Restriction Rule' },
    { type: 'prefix', code: 'VLV',  reason: 'Built-in Restriction Rule' },
];

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function checkRestricted(data, dbRestrictions) {
    const { customerCode, name, email, phone } = data;
    if (customerCode) {
        for (const rule of BUILT_IN_RESTRICTION_CODES) {
            if (rule.type === 'exact' && customerCode === rule.code)
                return { customerCode: rule.code, reason: rule.reason };
            if (rule.type === 'prefix' && customerCode.startsWith(rule.code))
                return { customerCode: rule.code + '*', reason: rule.reason };
        }
    }
    for (const r of dbRestrictions) {
        if (r.customerCode) {
            if (r.customerCode.endsWith('*')) {
                const prefix = r.customerCode.slice(0, -1);
                if (customerCode && customerCode.startsWith(prefix)) return r;
            } else if (customerCode && r.customerCode === customerCode) return r;
        }
        if (r.passengerName && name && r.passengerName.toLowerCase() === name.toLowerCase()) return r;
        if (r.email && email && r.email.toLowerCase() === email.toLowerCase()) return r;
        if (r.phone && phone && r.phone === phone) return r;
    }
    return null;
}

async function autoCreateRestriction(customerCode, passengerName, email, phone) {
    const orClauses = [];
    if (customerCode) orClauses.push({ customerCode });
    if (email) orClauses.push({ email: email.toLowerCase() });
    if (passengerName) orClauses.push({ passengerName: new RegExp(`^${escapeRegex(passengerName)}$`, 'i') });
    if (orClauses.length === 0) return false;
    const exists = await Restriction.findOne({ $or: orClauses });
    if (!exists) {
        await Restriction.create({
            customerCode: customerCode || '',
            passengerName: passengerName || '',
            email: email ? email.toLowerCase() : '',
            phone: phone || '',
            reason: 'Auto-added from Manifest Restriction Rule',
            source: 'Manifest Auto-Detection',
        });
        return true;
    }
    return false;
}

const router = Router();

router.use(requireAuth, requireRoles('admin', 'manager'));

// GET all restrictions
router.get('/', async (req, res, next) => {
    try {
        const list = await Restriction.find().sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        next(err);
    }
});

// GET blocked manifest entries (contacts marked isRestricted: true)
router.get('/blocked', async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [entries, total] = await Promise.all([
            Contact.find({ isRestricted: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('manifestId', 'name'),
            Contact.countDocuments({ isRestricted: true }),
        ]);
        res.json({ entries, total });
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

// POST /api/restrictions/backfill — admin-only
// Scans all non-restricted Contact records and flags those matching current restriction rules.
// Also auto-creates Restriction records for newly discovered passengers.
router.post('/backfill', requireRoles('admin'), async (req, res, next) => {
    try {
        const dbRestrictions = await Restriction.find({});
        // Process in batches to avoid loading everything into memory at once
        const BATCH = 500;
        let skip = 0;
        let updatedCount = 0;
        let restrictionsCreated = 0;

        while (true) {
            const contacts = await Contact.find({ isRestricted: { $ne: true } })
                .skip(skip)
                .limit(BATCH)
                .lean();
            if (contacts.length === 0) break;

            for (const contact of contacts) {
                const customerCode = contact.extra?.CustomerCode || contact.extra?.['Customer Code'] || '';
                const match = checkRestricted(
                    { customerCode, name: contact.name, email: contact.email, phone: contact.phone },
                    dbRestrictions
                );
                if (match) {
                    await Contact.updateOne(
                        { _id: contact._id },
                        {
                            $set: {
                                isRestricted: true,
                                status: 'Excluded – Restriction List',
                                'extra.TripType': 'Restricted',
                                'extra.RestrictedReason': match.reason || 'Restriction List',
                                'extra.MatchedRestrictionCode': match.customerCode || '',
                            },
                        }
                    );
                    updatedCount++;
                    const created = await autoCreateRestriction(customerCode, contact.name, contact.email, contact.phone);
                    if (created) restrictionsCreated++;
                }
            }
            skip += BATCH;
        }

        res.json({ updated: updatedCount, restrictionsCreated });
    } catch (err) {
        next(err);
    }
});

export default router;
