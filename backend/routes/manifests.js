import { Router } from 'express';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import { upload } from '../middleware/upload.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Manifest from '../models/Manifest.js';
import Contact from '../models/Contact.js';
import * as XLSX from 'xlsx';

const router = Router();
router.use(requireAuth, requireRoles('admin', 'client'));

router.get('/', async (req, res, next) => {
  try {
    const manifests = await Manifest.find().sort({ createdAt: -1 });
    res.json(manifests);
  } catch (err) {
    next(err);
  }
});

// GET /entries - Fetch all manifest entries with pagination, sorting, and filtering
router.get('/entries', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, startDate, endDate, sortBy = 'pickupDate', order = 'asc' } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { pickupAddress: searchRegex },
        { dropoffAddress: searchRegex }
      ];
    }

    if (startDate || endDate) {
      query.pickupDate = {};
      // Set startDate to beginning of day in UTC
      if (startDate) {
        // Parse YYYY-MM-DD
        const [y, m, d] = startDate.split('-').map(Number);
        const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
        query.pickupDate.$gte = start;
      }
      // Set endDate to end of day in UTC
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
        query.pickupDate.$lte = end;
      }
    }

    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    }
    
    // Secondary sort by createdAt to ensure stable pagination
    sortOptions.createdAt = -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('manifestId', 'name'),
      Contact.countDocuments(query)
    ]);

    res.json({
      contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const name = req.body.name || req.file.originalname.replace(/\.[^.]+$/, '') || 'Manifest';
    const extension = req.file.originalname.split('.').pop().toLowerCase();

    let rows = [];
    if (extension === 'xlsx' || extension === 'xls') {
      const workbook = XLSX.readFile(req.file.path);
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    } else {
      const raw = await fs.readFile(req.file.path, 'utf-8');
      rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: 'The file appears to be empty' });
    }

    // Capture all columns present in the file
    const allColumns = Array.from(new Set(rows.flatMap(row => Object.keys(row))));

    const manifest = await Manifest.create({ name, columns: allColumns });

    const contacts = rows.map((row) => {
      // Support manifest.csv specific columns as well as generic ones
      const firstName = row.PassengerFirstName || row['Passenger First Name'] || '';
      const lastName = row.PassengerLastName || row['Passenger Last Name'] || '';
      const passengerName = (firstName || lastName)
        ? `${firstName} ${lastName}`.trim()
        : (row.name || row.Name || row.NAME || row.fullname || '');
      const phone = row.PassengerCellPhoneNumber || row['Passenger Cell Phone Number']
        || row.phone || row.Phone || row.PHONE || '';
      const email = row.PassengerEmailAddress || row['Passenger Email Address']
        || row.email || row.Email || row.EMAIL || '';

      // Extract additional fields
      let pickupDate = null;
      let pickupTime = '';
      
      // Try to find date field
      const dateStr = row.PickupDateTime || row['Pickup Date Time'] || row['Pickup Date'] || row.PickupDate || row.Date || row.DATE || '';
      // Try to find time field
      const timeStr = row.PickupTime || row['Pickup Time'] || row.Time || row.TIME || '';

      if (dateStr) {
        // Handle Excel serial dates if necessary, though sheet_to_json usually handles them if raw: false (default)
        // If raw: true, numbers might be returned. But here we use default.
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
            pickupDate = parsedDate;
        }
      }

      if (timeStr) {
          pickupTime = String(timeStr).trim();
      }

      const pickupAddress = row.PickupAddress || row['Pickup Address'] || row.From || row.FROM || '';
      const dropoffAddress = row.DropoffAddress || row['Dropoff Address'] || row.To || row.TO || '';

      return { 
          manifestId: manifest._id, 
          name: passengerName, 
          phone, 
          email, 
          pickupDate,
          pickupTime,
          pickupAddress,
          dropoffAddress,
          extra: { ...row } 
      };
    });
    await Contact.insertMany(contacts);
    await fs.unlink(req.file.path).catch(() => { });
    res.status(201).json(manifest);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const manifest = await Manifest.findById(req.params.id);
    if (!manifest) return res.status(404).json({ message: 'Manifest not found' });
    const contacts = await Contact.find({ manifestId: manifest._id });
    res.json({ ...manifest.toObject(), contacts });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const manifest = await Manifest.findByIdAndDelete(req.params.id);
    if (!manifest) return res.status(404).json({ message: 'Manifest not found' });
    await Contact.deleteMany({ manifestId: manifest._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
