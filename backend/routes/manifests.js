import { Router } from 'express';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import { upload } from '../middleware/upload.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Manifest from '../models/Manifest.js';
import Contact from '../models/Contact.js';
import * as XLSX from 'xlsx';

const router = Router();
router.use(requireAuth, requireRoles('admin'));

router.get('/', async (req, res, next) => {
  try {
    const manifests = await Manifest.find().sort({ createdAt: -1 });
    res.json(manifests);
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
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
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
      return { manifestId: manifest._id, name: passengerName, phone, email, extra: { ...row } };
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
