import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Driver from '../models/Driver.js';
import * as XLSX from 'xlsx';

const router = Router();

// All driver routes require admin role
router.use(requireAuth, requireRoles('admin'));

// GET all drivers (with pagination, search and filters)
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const type = req.query.type || '';

        const query = {};

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { vipCarNum: { $regex: search, $options: 'i' } }
            ];
        }

        // Vehicle type filter
        if (type) {
            query.vehicleType = { $regex: `^${type}$`, $options: 'i' };
        }

        const total = await Driver.countDocuments(query);
        const drivers = await Driver.find(query)
            .sort({ vipCarNum: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            drivers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        next(err);
    }
});

// POST manual add
router.post(
    '/',
    body('vipCarNum').notEmpty().withMessage('VIP Car # is required'),
    body('name').notEmpty().withMessage('Driver Name is required'),
    body('vehicleType').optional(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const { vipCarNum, name, carMake, carModel, carYear, vehicleType } = req.body;

            const existing = await Driver.findOne({ vipCarNum });
            if (existing) {
                return res.status(409).json({ message: 'Driver with this VIP Car # already exists' });
            }

            const driver = await Driver.create({
                vipCarNum,
                name,
                carMake,
                carModel,
                carYear,
                vehicleType
            });

            res.status(201).json(driver);
        } catch (err) {
            next(err);
        }
    }
);

// PUT update driver
router.put(
    '/:id',
    body('vipCarNum').optional().notEmpty().withMessage('VIP Car # is required'),
    body('name').optional().notEmpty().withMessage('Driver Name is required'),
    body('vehicleType').optional(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const driver = await Driver.findById(req.params.id);
            if (!driver) return res.status(404).json({ message: 'Driver not found' });

            const { vipCarNum, name, carMake, carModel, carYear, vehicleType } = req.body;

            if (vipCarNum && vipCarNum !== driver.vipCarNum) {
                const existing = await Driver.findOne({ vipCarNum });
                if (existing) {
                    return res.status(409).json({ message: 'Another driver with this VIP Car # already exists' });
                }
                driver.vipCarNum = vipCarNum;
            }

            if (name !== undefined) driver.name = name;
            if (carMake !== undefined) driver.carMake = carMake;
            if (carModel !== undefined) driver.carModel = carModel;
            if (carYear !== undefined) driver.carYear = carYear;
            if (vehicleType !== undefined) driver.vehicleType = vehicleType;

            await driver.save();
            res.json(driver);
        } catch (err) {
            next(err);
        }
    }
);

// DELETE driver
router.delete('/:id', async (req, res, next) => {
    try {
        const driver = await Driver.findByIdAndDelete(req.params.id);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        res.json({ message: 'Driver removed' });
    } catch (err) {
        next(err);
    }
});

// POST bulk upload (append mode)
router.post('/upload', async (req, res, next) => {
    try {
        const { drivers } = req.body;
        if (!Array.isArray(drivers)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        // Get all existing VIP Car nums to avoid unnecessary DB calls in loop
        const existingDrivers = await Driver.find({}, 'vipCarNum');
        const existingVips = new Set(existingDrivers.map(d => d.vipCarNum));

        const toInsert = [];
        let skippedCount = 0;

        for (const item of drivers) {
            const { carNum, name, carMake, carModel, carYear, vehicleType } = item;

            const vCarNum = String(carNum || '').trim();
            if (!vCarNum || !name) {
                skippedCount++;
                continue;
            }

            if (existingVips.has(vCarNum)) {
                skippedCount++;
                continue;
            }

            toInsert.push({
                vipCarNum: vCarNum,
                name: String(name).trim(),
                carMake: carMake || '',
                carModel: carModel || '',
                carYear: carYear || '',
                vehicleType: vehicleType || ''
            });
            // Also add to local set to handle duplicates within the same upload file
            existingVips.add(vCarNum);
        }

        if (toInsert.length > 0) {
            await Driver.insertMany(toInsert, { ordered: false });
        }

        res.json({
            message: `Upload complete. ${toInsert.length} records added, ${skippedCount} skipped.`,
            inserted: toInsert.length,
            skipped: skippedCount
        });
    } catch (err) {
        console.error('Upload error details:', err);
        // Special handling for bulk write errors (like duplicate key that slipped through)
        if (err.name === 'BulkWriteError' || err.code === 11000) {
            return res.json({
                message: 'Upload completed with some duplicates handled.',
                partial: true
            });
        }
        next(err);
    }
});

// POST bulk delete
router.post('/bulk-delete', async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const result = await Driver.deleteMany({ _id: { $in: ids } });
        res.json({ message: `${result.deletedCount} drivers removed`, deletedCount: result.deletedCount });
    } catch (err) {
        next(err);
    }
});

// GET export to excel
router.get('/export', async (req, res, next) => {
    try {
        const drivers = await Driver.find().sort({ vipCarNum: 1 });

        const data = drivers.map(d => ({
            'VIP Car #': d.vipCarNum,
            'Driver Name': d.name,
            'Car Make': d.carMake || '',
            'Car Model': d.carModel || '',
            'Car Year': d.carYear || '',
            'Vehicle Type': d.vehicleType || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=drivers_export.xlsx');
        res.send(buffer);
    } catch (err) {
        next(err);
    }
});

export default router;
