import { Router } from 'express';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import { upload } from '../middleware/upload.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Manifest from '../models/Manifest.js';
import Contact from '../models/Contact.js';
import ReviewRequest from '../models/ReviewRequest.js';
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
      const orQuery = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { pickupAddress: searchRegex },
        { dropoffAddress: searchRegex },
      ];

      // Get all unique columns from all manifests to dynamically search 'extra' fields
      const allManifests = await Manifest.find({}, 'columns');
      const allColumns = new Set();
      allManifests.forEach(m => {
        if (Array.isArray(m.columns)) {
          m.columns.forEach(c => allColumns.add(c));
        }
      });

      // Add each column to the search query
      allColumns.forEach(col => {
        // Prevent duplicate or invalid keys
        if (col && typeof col === 'string') {
          // Use bracket notation logic for MongoDB path? No, Mongo uses dot notation.
          // Ensure key is safe? keys with dots might be tricky but usually columns are simple strings.
          orQuery.push({ [`extra.${col}`]: searchRegex });
        }
      });

      query.$or = orQuery;
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
        // If sorting by pickupDate, also sort by pickupTime as secondary
        if (sortBy === 'pickupDate') {
          sortOptions['pickupTime'] = order === 'desc' ? -1 : 1;
        }
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

// GET /entries/export - Export manifest entries to Excel
router.get('/entries/export', async (req, res, next) => {
  try {
    const { search, startDate, endDate, sortBy = 'pickupDate', order = 'asc' } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const orQuery = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { pickupAddress: searchRegex },
        { dropoffAddress: searchRegex },
      ];

      // Get all unique columns from all manifests
      const allManifests = await Manifest.find({}, 'columns');
      const allColumns = new Set();
      allManifests.forEach(m => {
        if (Array.isArray(m.columns)) {
          m.columns.forEach(c => allColumns.add(c));
        }
      });

      allColumns.forEach(col => {
        if (col && typeof col === 'string') {
          orQuery.push({ [`extra.${col}`]: searchRegex });
        }
      });

      query.$or = orQuery;
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
        // If sorting by pickupDate, also sort by pickupTime as secondary
        if (sortBy === 'pickupDate') {
          sortOptions['pickupTime'] = order === 'desc' ? -1 : 1;
        }
    }
    sortOptions.createdAt = -1;

    const contacts = await Contact.find(query).sort(sortOptions).populate('manifestId', 'name');

    // Define column order preferences
    const PREFERRED_ORDER = [
      'PickupDateTime', 'ResNumber', 'CustomerCode', 'CustomerName', 
      'PassengerCellPhoneNumber', 'PassengerEmailAddress', 'PassengerFirstName', 'PassengerLastName',
      'PickupAddress', 'PickupPricingZone', 'DropoffPricingZone', 'DropoffAddress', 
      'DispatchDriverCode', 'DispatchDriverName', 'DispatchVehicleCode', 'DispatchDriverPhoneNumber',
      'DispatchVehicleTypeCode', 'OnLocationDateTime', 'PassengerOnBoardDateTime',
      'SegmentStatusCode', 'SegmentTotal', 
      'ContactEmailAddress', 'ContactFirstName', 'ContactLastName', 'ContactPhoneNumber'
    ];

    const data = contacts.map(c => {
      const row = {
        'Manifest Source': c.manifestId?.name || '',
        'Passenger Name': c.name,
        'Passenger Phone': c.phone,
        'Passenger Email': c.email,
        'Pickup Date': c.pickupDate ? new Date(c.pickupDate).toISOString().split('T')[0] : '',
        'Pickup Time': c.pickupTime,
        'Pickup Address': c.pickupAddress,
        'Dropoff Address': c.dropoffAddress,
        'Status': c.status,
      };

      // Add extra fields
      if (c.extra) {
        // Sort extra keys based on preferred order
        const extraKeys = Object.keys(c.extra).sort((a, b) => {
          const aIdx = PREFERRED_ORDER.indexOf(a);
          const bIdx = PREFERRED_ORDER.indexOf(b);
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return a.localeCompare(b);
        });

        extraKeys.forEach(key => {
          row[key] = c.extra[key];
        });
      }
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Manifest Entries');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=manifest_entries_export.xlsx');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// POST /entries - Create a single contact entry manually
router.post('/entries', async (req, res, next) => {
  try {
    const { manifestId, name, phone, email, pickupDate, pickupTime, pickupAddress, dropoffAddress, status, extra } = req.body;
    if (!manifestId) return res.status(400).json({ message: 'manifestId is required' });
    const manifest = await Manifest.findById(manifestId);
    if (!manifest) return res.status(404).json({ message: 'Manifest not found' });
    const contact = await Contact.create({
      manifestId,
      name: name || '',
      phone: phone || '',
      email: email || '',
      pickupDate: pickupDate ? new Date(pickupDate) : null,
      pickupTime: pickupTime || '',
      pickupAddress: pickupAddress || '',
      dropoffAddress: dropoffAddress || '',
      status: status || 'Pending',
      extra: extra || {},
    });
    const populated = await contact.populate('manifestId', 'name');
    res.status(201).json({ contact: populated });
  } catch (err) {
    next(err);
  }
});

// PATCH /entries/:id - Update a contact entry
router.patch('/entries/:id', async (req, res, next) => {
  try {
    const { name, phone, email, pickupDate, pickupTime, pickupAddress, dropoffAddress, status, extra } = req.body;
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    if (name !== undefined) contact.name = name;
    if (phone !== undefined) contact.phone = phone;
    if (email !== undefined) contact.email = email;
    if (pickupDate !== undefined) contact.pickupDate = pickupDate ? new Date(pickupDate) : null;
    if (pickupTime !== undefined) contact.pickupTime = pickupTime;
    if (pickupAddress !== undefined) contact.pickupAddress = pickupAddress;
    if (dropoffAddress !== undefined) contact.dropoffAddress = dropoffAddress;
    if (status !== undefined) contact.status = status;
    if (extra !== undefined) contact.extra = extra;
    await contact.save();
    const populated = await contact.populate('manifestId', 'name');
    res.json({ contact: populated });
  } catch (err) {
    next(err);
  }
});

// DELETE /entries/:id - Delete a single contact entry (cascades to ReviewRequests)
router.delete('/entries/:id', async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    await ReviewRequest.deleteMany({ contactId: contact._id });
    res.json({ ok: true });
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
        || row.ContactPhoneNumber || row['Contact Phone Number']
        || row.phone || row.Phone || row.PHONE || '';
        
      const email = row.PassengerEmailAddress || row['Passenger Email Address']
        || row.ContactEmailAddress || row['Contact Email Address']
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

      // If pickupDate is valid but has 00:00:00 time, and we have a time string, try to merge it
      if (pickupDate && pickupTime) {
        // Check if pickupDate is midnight (in UTC or local? new Date(dateStr) depends on input)
        // We'll check if hours/minutes are 0.
        // Actually, safer to just parse timeStr and set it if valid, overwriting whatever time was there?
        // No, if PickupDateTime had time, we prefer that.
        // Only if PickupDateTime was date-only.
        
        // Simple heuristic: if pickupDate is exactly midnight UTC or Local (depending on how it was parsed)
        // Let's just try to parse pickupTime and if successful, set it.
        const hours = pickupDate.getHours();
        const minutes = pickupDate.getMinutes();
        
        if (hours === 0 && minutes === 0) {
           // Try to parse HH:mm or H:mm or hh:mm A
           // Matches: 14:30, 2:30, 2:30 PM, 02:30 PM
           const timeMatch = pickupTime.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
           if (timeMatch) {
             let [_, h, m, meridiem] = timeMatch;
             let hNum = parseInt(h, 10);
             const mNum = parseInt(m, 10);
             
             if (meridiem) {
               if (meridiem.toUpperCase() === 'PM' && hNum < 12) hNum += 12;
               if (meridiem.toUpperCase() === 'AM' && hNum === 12) hNum = 0;
             }
             
             // Set time
             pickupDate.setHours(hNum, mNum, 0, 0);
           }
        }
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
