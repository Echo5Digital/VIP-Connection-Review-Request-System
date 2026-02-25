'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'vip-drivers-upload-v2';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const NAME_KEYS = ['name', 'driver', 'drivername', 'fullname'];
const PHONE_KEYS = ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber'];
const EMAIL_KEYS = ['email', 'emailaddress', 'mail'];
const CAR_NUM_KEYS = ['car', 'carnum', 'carnumber', 'carno', 'drivernum', 'drivercode', 'vehiclenum'];

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function pickFirstValue(record, candidates) {
  for (const key of candidates) {
    if (record[key]) return record[key];
  }
  return '';
}

function parseCsvMatrix(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (char === '"') {
      if (inQuotes && input[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => String(cell).trim() !== ''));
}

function csvRowsToObjects(text) {
  const matrix = parseCsvMatrix(text);
  if (matrix.length < 2) return [];

  const [headers, ...bodyRows] = matrix;
  const normalizedHeaders = headers.map((header, idx) => {
    const clean = String(header ?? '').trim();
    return clean || `Column ${idx + 1}`;
  });

  return bodyRows.map((cells) => {
    const row = {};
    normalizedHeaders.forEach((header, idx) => {
      row[header] = String(cells[idx] ?? '').trim();
    });
    return row;
  });
}

// Build objects from a raw matrix, auto-detecting the header row and
// de-duplicating repeated column names (e.g. two "Car Year" columns).
function xlsxMatrixToObjects(matrix) {
  if (matrix.length < 2) return [];

  // Find the header row: first row (within first 5) that contains a cell
  // whose trimmed value equals "Name" (case-insensitive).
  let headerIdx = 0;
  for (let i = 0; i < Math.min(matrix.length, 5); i++) {
    if (matrix[i].some((cell) => String(cell).trim().toLowerCase() === 'name')) {
      headerIdx = i;
      break;
    }
  }

  // Build unique header names, appending _2, _3 … for duplicates.
  const seen = {};
  const headers = matrix[headerIdx].map((h) => {
    const clean = String(h ?? '').trim();
    if (!clean) return null;
    if (seen[clean] !== undefined) {
      seen[clean] += 1;
      return `${clean}_${seen[clean]}`;
    }
    seen[clean] = 1;
    return clean;
  });

  return matrix
    .slice(headerIdx + 1)
    .filter((cells) => cells.some((c) => String(c).trim() !== ''))
    .map((cells) => {
      const row = {};
      headers.forEach((h, i) => {
        if (h) row[h] = String(cells[i] ?? '').trim();
      });
      return row;
    });
}

function hasNameColumn(rows) {
  if (!rows.length) return false;
  const keys = Object.keys(rows[0]).map(normalizeKey);
  return NAME_KEYS.some((key) => keys.includes(key));
}

function mapDrivers(rows) {
  return rows
    .map((row, idx) => {
      const normalized = {};
      Object.entries(row || {}).forEach(([key, value]) => {
        normalized[normalizeKey(key)] = String(value ?? '').trim();
      });

      const name = pickFirstValue(normalized, NAME_KEYS);
      if (!name) return null;

      const phone = pickFirstValue(normalized, PHONE_KEYS);
      const email = pickFirstValue(normalized, EMAIL_KEYS);
      const carNum = pickFirstValue(normalized, CAR_NUM_KEYS);
      // "Car Year" → caryear; duplicate "Car Year_2" → caryear2 (= make in vehicle&drivers.xlsx)
      const carYear = normalized['caryear'] || normalized['year'] || '';
      const carMake = normalized['caryear2'] || normalized['carmake'] || normalized['make'] || '';
      const vehicleModel = normalized['vehiclemodel'] || normalized['model'] || '';
      // "Sedan/ MidSUV/SUV" normalises to "sedanmidsuvsuv"
      const vehicleType =
        normalized['sedanmidsuvsuv'] ||
        normalized['type'] ||
        normalized['vehicletype'] ||
        normalized['cartype'] ||
        '';

      return {
        id: `${idx}-${name}-${carNum}`,
        name,
        carNum,
        carYear,
        carMake,
        vehicleModel,
        vehicleType,
        phone,
        email,
      };
    })
    .filter(Boolean);
}

async function parseDriverFile(file, parserReady) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const text = await file.text();
    return csvRowsToObjects(text);
  }

  if (extension === 'xlsx') {
    if (!parserReady || typeof window === 'undefined' || !window.XLSX) {
      throw new Error('Excel parser is still loading. Try again in a moment.');
    }

    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: 'array', raw: false });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];

    // Use raw array mode so we can handle offset header rows
    const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    return xlsxMatrixToObjects(matrix);
  }

  throw new Error('Only .csv and .xlsx files are allowed');
}

export default function DriversPage() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [sourceFile, setSourceFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parserReady, setParserReady] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (!cached) return;
      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed?.drivers)) return;
      setDrivers(parsed.drivers);
      setSourceFile(typeof parsed.fileName === 'string' ? parsed.fileName : '');
    } catch {
      // ignore bad cache data
    }
  }, []);

  function clearDrivers() {
    setDrivers([]);
    setSourceFile('');
    setFile(null);
    setError('');
    localStorage.removeItem(STORAGE_KEY);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setError('Choose a .csv or .xlsx file');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx'].includes(extension || '')) {
      setError('Only .csv and .xlsx files are allowed');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File is too large. Maximum upload size is 5MB.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const rows = await parseDriverFile(file, parserReady);
      if (!rows.length) {
        throw new Error('The file has no data rows');
      }
      if (!hasNameColumn(rows)) {
        throw new Error('Missing required name column (Name, Driver, or Driver Name)');
      }

      const parsedDrivers = mapDrivers(rows);
      if (!parsedDrivers.length) {
        throw new Error('No valid drivers found. Ensure each row has a name.');
      }

      setDrivers(parsedDrivers);
      setSourceFile(file.name);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          fileName: file.name,
          drivers: parsedDrivers,
        })
      );
      if (inputRef.current) inputRef.current.value = '';
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  // Determine which optional columns actually have data
  const hasPhone = drivers.some((d) => d.phone);
  const hasEmail = drivers.some((d) => d.email);

  return (
    <div>
      <Script
        src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
        strategy="afterInteractive"
        onLoad={() => setParserReady(true)}
        onError={() => setError('Could not load Excel parser. CSV uploads are still supported.')}
      />

      <h1 className="page-title">Drivers</h1>

      {/* Upload section */}
      <div className="card mb-6">
        <div className="card__header">Upload Drivers File</div>
        <div style={{ padding: '16px' }}>
          <p className="text-muted text-sm mb-4">
            Upload a .csv or .xlsx file with columns like Car #, Name, Car Year, Make, Model, and Type.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ fontSize: '13px', color: 'var(--gray-600)' }}
            />
            <button type="submit" disabled={loading} className="btn btn--primary btn--sm">
              {loading ? 'Uploading...' : 'Upload Drivers'}
            </button>
            {drivers.length > 0 && (
              <button type="button" onClick={clearDrivers} className="btn btn--outline btn--sm">
                Clear List
              </button>
            )}
            {error && <p className="form-error" style={{ width: '100%', marginTop: '8px' }}>{error}</p>}
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card__header">Drivers &amp; Vehicles</div>
        {drivers.length === 0 ? (
          <p className="card__empty">
            No drivers uploaded yet.
          </p>
        ) : (
          <>
            <p className="text-muted text-sm" style={{ padding: '12px 16px 0' }}>
              {drivers.length} driver(s){sourceFile ? ` from ${sourceFile}` : ''}
            </p>
            <div className="table-wrap" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Car #</th>
                    <th>Name</th>
                    <th>Year</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Type</th>
                    {hasPhone && <th>Phone</th>}
                    {hasEmail && <th>Email</th>}
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id}>
                      <td>{driver.carNum || '—'}</td>
                      <td style={{ fontWeight: 500 }}>{driver.name || '—'}</td>
                      <td>{driver.carYear || '—'}</td>
                      <td>{driver.carMake || '—'}</td>
                      <td>{driver.vehicleModel || '—'}</td>
                      <td>{driver.vehicleType || '—'}</td>
                      {hasPhone && <td>{driver.phone || '—'}</td>}
                      {hasEmail && <td>{driver.email || '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
