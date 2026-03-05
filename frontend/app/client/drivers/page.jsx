'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const NAME_KEYS = ['name', 'driver', 'drivername', 'fullname'];
const CAR_NUM_KEYS = ['car', 'carnum', 'carnumber', 'carno', 'drivernum', 'drivercode', 'vehiclenum', 'vipcar#', 'vipcar'];

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

function xlsxMatrixToObjects(matrix) {
  if (matrix.length < 2) return [];

  let headerIdx = 0;
  for (let i = 0; i < Math.min(matrix.length, 5); i++) {
    if (matrix[i].some((cell) => {
      const val = String(cell).trim().toLowerCase();
      return val === 'name' || val === 'driver' || val === 'vip car #';
    })) {
      headerIdx = i;
      break;
    }
  }

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

function mapDriversForUpload(rows) {
  return rows
    .map((row) => {
      const normalized = {};
      Object.entries(row || {}).forEach(([key, value]) => {
        normalized[normalizeKey(key)] = String(value ?? '').trim();
      });

      const name = pickFirstValue(normalized, NAME_KEYS);
      if (!name) return null;

      const carNum = pickFirstValue(normalized, CAR_NUM_KEYS);
      const carYear = normalized['caryear'] || normalized['year'] || '';
      const carMake = normalized['caryear2'] || normalized['carmake'] || normalized['make'] || '';
      const carModel = normalized['vehiclemodel'] || normalized['model'] || '';

      const vehicleType =
        normalized['sedanmidsuvsuv'] ||
        normalized['type'] ||
        normalized['vehicletype'] ||
        normalized['cartype'] ||
        '';

      return {
        carNum,
        name,
        carYear,
        carMake,
        carModel,
        vehicleType: vehicleType
      };
    })
    .filter(Boolean);
}

async function parseDriverFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const text = await file.text();
    return csvRowsToObjects(text);
  }

  if (extension === 'xlsx') {
    if (typeof window === 'undefined' || !window.XLSX) {
      throw new Error('Excel parser is still loading. Try again in a moment.');
    }

    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: 'array', raw: false });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    return xlsxMatrixToObjects(matrix);
  }

  throw new Error('Only .csv and .xlsx files are allowed');
}

export default function DriversPage() {
  const inputRef = useRef(null);
  const tableTopRef = useRef(null);
  const [file, setFile] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search and Selection State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(''); // New state for vehicle type filter
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 20;

  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    vipCarNum: '',
    name: '',
    carMake: '',
    carModel: '',
    carYear: '',
    vehicleType: ''
  });

  useEffect(() => {
    fetchDrivers();
  }, [currentPage, searchTerm, filterType]);

  async function fetchDrivers() {
    try {
      setLoading(true);
      const data = await api.get(`/api/drivers?page=${currentPage}&limit=${limit}&search=${searchTerm}&type=${filterType}`);
      setDrivers(data.drivers || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);
      // Clear selection on refresh
      setSelectedIds(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected drivers?`)) return;
    try {
      await api.post('/api/drivers/bulk-delete', { ids: Array.from(selectedIds) });
      fetchDrivers();
      setSuccess(`${selectedIds.size} drivers deleted`);
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredDrivers = drivers; // Server already filters

  const isAllSelected = filteredDrivers.length > 0 && filteredDrivers.every(d => selectedIds.has(d._id));

  function toggleSelectAll() {
    if (isAllSelected) {
      const newSelected = new Set(selectedIds);
      filteredDrivers.forEach(d => newSelected.delete(d._id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      filteredDrivers.forEach(d => newSelected.add(d._id));
      setSelectedIds(newSelected);
    }
  }

  function toggleSelectRow(id) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!file) {
      setError('Choose a .csv or .xlsx file');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const rows = await parseDriverFile(file);
      if (!rows.length) throw new Error('The file has no data rows');
      if (!hasNameColumn(rows)) throw new Error('Missing required name column (Name or Driver)');

      const parsedDrivers = mapDriversForUpload(rows);
      if (!parsedDrivers.length) throw new Error('No valid drivers found.');

      const result = await api.post('/api/drivers/upload', { drivers: parsedDrivers });

      setSuccess(result.message);
      fetchDrivers();
      if (inputRef.current) inputRef.current.value = '';
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function openAddModal() {
    setEditingDriver(null);
    setFormData({
      vipCarNum: '',
      name: '',
      carMake: '',
      carModel: '',
      carYear: '',
      vehicleType: ''
    });
    setIsModalOpen(true);
  }

  function openEditModal(driver) {
    setEditingDriver(driver);
    setFormData({
      vipCarNum: driver.vipCarNum,
      name: driver.name,
      carMake: driver.carMake || '',
      carModel: driver.carModel || '',
      carYear: driver.carYear || '',
      vehicleType: driver.vehicleType || ''
    });
    setIsModalOpen(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingDriver ? `/api/drivers/${editingDriver._id}` : '/api/drivers';

      let result;
      if (editingDriver) {
        result = await api.put(url, formData);
      } else {
        result = await api.post(url, formData);
      }

      setSuccess(editingDriver ? 'Driver updated' : 'Driver added');
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      await api.delete(`/api/drivers/${id}`);
      fetchDrivers();
      setSuccess('Driver deleted');
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDownload() {
    window.location.href = '/api-backend/drivers/export';
  }

  function changePage(nextPage) {
    setCurrentPage(nextPage);
    requestAnimationFrame(() => {
      document.querySelector('.admin-shell__main')?.scrollTo({ top: 0, behavior: 'auto' });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  return (
    <div>
      <Script
        src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
        strategy="afterInteractive"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Drivers</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn--danger btn--sm"
            >
              Delete Selected ({selectedIds.size})
            </button>
          )}
          <button onClick={handleDownload} className="btn btn--secondary btn--sm">
            Download Excel
          </button>
          <button onClick={openAddModal} className="btn btn--primary btn--sm">
            + Add Driver
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="form-error mb-4">{error}</div>}
      {success && <div className="form-success mb-4">{success}</div>}

      {/* Upload section */}
      <div className="card mb-6">
        <div className="card__header">Upload Drivers File</div>
        <div className="card__body">
          <p className="text-muted text-sm mb-6">
            Upload a .csv or .xlsx file. New records will be appended. Existing VIP Car # will be skipped.
          </p>
          <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                ref={inputRef}
                type="file"
                id="driver-file"
                accept=".csv,.xlsx"
                className="file-input-hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
              <label
                htmlFor="driver-file"
                className="btn btn--secondary"
              >
                Choose File
              </label>
            </div>
            <span className="text-muted" style={{ fontSize: '13px', margin: '0 12px' }}>
              {file ? file.name : 'No file chosen'}
            </span>
            <button type="submit" disabled={uploading} className="btn btn--primary">
              {uploading ? 'Uploading...' : 'Upload Drivers'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card__header">Drivers &amp; Vehicles</div>

        {/* Filters Section */}
        <div className="card__filters" style={{ padding: '20px', borderBottom: '1px solid var(--border-dim)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: '300px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* SearchBar */}
              <div style={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by VIP Car # or Name"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ paddingLeft: '40px' }}
                />
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
              </div>

              {/* Vehicle Type Filter */}
              <div style={{ minWidth: '200px', position: 'relative' }}>
                <select
                  className="form-control"
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Vehicle Types</option>
                  <option value="Luxury SUV">Luxury SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV*7">SUV*7</option>
                  <option value="Premium Luxury">Premium Luxury</option>
                  <option value="Electric Sedan">Electric Sedan</option>
                  <option value="Luxury Sedan">Luxury Sedan</option>
                  <option value="Van">Van</option>
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </div>

              {(searchTerm || filterType) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('');
                    setCurrentPage(1);
                  }}
                  className="btn btn--text btn--sm"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card__empty" style={{ padding: '60px' }}>
            <div className="page-loader" style={{ position: 'static', background: 'none' }}>Loading drivers...</div>
          </div>
        ) : drivers.length === 0 ? (
          <p className="card__empty">No drivers found.</p>
        ) : (
          <>
            <div className="table-wrap" ref={tableTopRef}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '56px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>VIP Car #</th>
                    <th>Name</th>
                    <th>Year</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver) => (
                    <tr key={driver._id} className={selectedIds.has(driver._id) ? 'row-selected' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(driver._id)}
                          onChange={() => toggleSelectRow(driver._id)}
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{driver.vipCarNum}</td>
                      <td style={{ fontWeight: 600 }}>{driver.name}</td>
                      <td>{driver.carYear || '—'}</td>
                      <td>{driver.carMake || '—'}</td>
                      <td>{driver.carModel || '—'}</td>
                      <td>
                        <span className="badge badge--gold">{driver.vehicleType || '—'}</span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(driver)}
                            className="btn btn--icon"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDelete(driver._id)}
                            className="btn btn--icon text-danger"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card__footer" style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div className="text-muted text-sm">
                  Showing <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{(currentPage - 1) * limit + 1}</span> to <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{Math.min(currentPage * limit, totalRecords)}</span> of <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{totalRecords}</span> records
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => changePage(Math.max(1, currentPage - 1))}
                    className="btn btn--secondary btn--sm"
                  >
                    Previous
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => changePage(pageNum)}
                            className={`btn btn--sm ${currentPage === pageNum ? 'btn--primary' : 'btn--secondary'}`}
                            style={{ minWidth: '32px', padding: 0 }}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return <span key={pageNum} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                    className="btn btn--secondary btn--sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', margin: '16px', border: '1px solid var(--border-dim)' }}>
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</span>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit} className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">VIP Car #</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.vipCarNum}
                  onChange={e => setFormData({ ...formData, vipCarNum: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Driver Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Car Make</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.carMake}
                    onChange={e => setFormData({ ...formData, carMake: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Car Model</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.carModel}
                    onChange={e => setFormData({ ...formData, carModel: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Car Year</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.carYear}
                    onChange={e => setFormData({ ...formData, carYear: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select
                    className="form-control"
                    value={formData.vehicleType}
                    onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="Luxury SUV">Luxury SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV*7">SUV*7</option>
                    <option value="Premium Luxury">Premium Luxury</option>
                    <option value="Electric Sedan">Electric Sedan</option>
                    <option value="Luxury Sedan">Luxury Sedan</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}

              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary px-8">
                  {editingDriver ? 'Update Driver' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
