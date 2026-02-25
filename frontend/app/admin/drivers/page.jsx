'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'vip-drivers-upload';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const NAME_KEYS = ['name', 'driver', 'drivername', 'fullname'];
const PHONE_KEYS = ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber'];
const EMAIL_KEYS = ['email', 'emailaddress', 'mail'];

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
      const phone = pickFirstValue(normalized, PHONE_KEYS);
      const email = pickFirstValue(normalized, EMAIL_KEYS);

      if (!name && !phone && !email) return null;
      if (!name) return null;

      return {
        id: `${idx}-${name}-${phone}-${email}`,
        name,
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
    return window.XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
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

  return (
    <div>
      <Script
        src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
        strategy="afterInteractive"
        onLoad={() => setParserReady(true)}
        onError={() => setError('Could not load Excel parser. CSV uploads are still supported.')}
      />

      <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Drivers</h1>
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
          {error && <p className="form-error" style={{ width: '100%' }}>{error}</p>}
        </form>
      </div>

      <p className="text-muted text-sm mb-4">
        Upload a .csv or .xlsx with driver columns like Name, Phone, and Email.
      </p>

      <div className="card">
        <div className="card__header">Drivers List</div>
        {drivers.length === 0 ? (
          <p className="card__empty">
            No drivers uploaded yet.
          </p>
        ) : (
          <>
            <p className="text-muted text-sm" style={{ padding: '12px 16px 0' }}>
              {drivers.length} driver(s){sourceFile ? ` from ${sourceFile}` : ''}
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id}>
                      <td style={{ fontWeight: 500 }}>{driver.name || '-'}</td>
                      <td>{driver.phone || '-'}</td>
                      <td>{driver.email || '-'}</td>
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
