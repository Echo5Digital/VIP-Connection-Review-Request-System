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

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const data = await api.get('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  }

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

  async function toggleStatus(driver) {
    try {
      // Optimistic update
      const currentStatus = driver.isActive !== false;
      const newStatus = !currentStatus;
      setDrivers(prev => prev.map(d => d._id === driver._id ? { ...d, isActive: newStatus } : d));

      await api.put(`/api/drivers/${driver._id}`, { isActive: newStatus });
    } catch (err) {
      setError(err.message);
      fetchDrivers(); // Revert on error
    }
  }

  function handleDriverSelect(driver) {
    setSearchTerm(driver.name);
    setCurrentPage(1);
    // This will trigger the useEffect to fetch drivers with the new search term
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
              onClick={() => handleBulkDelete()}
              className="btn btn--secondary"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              Delete Selected ({selectedIds.size})
            </button>
          )}
          <button onClick={handleDownload} className="btn btn--secondary">
            Download Excel
          </button>
          <button onClick={openAddModal} className="btn btn--primary">
            Add Driver
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
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
              <button
                type="button"
                className="btn btn--secondary"
                style={{ pointerEvents: 'none' }}
              >
                Choose File
              </button>
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {file ? file.name : 'No file chosen'}
            </span>
            <button type="submit" disabled={uploading || !file} className="btn btn--primary">
              {uploading ? 'Uploading...' : 'Upload Drivers'}
            </button>
          </form>
        </div>
      </div>


      <div className="card">
        <div className="card__header">Drivers &amp; Vehicles</div>

        {/* Filters Section */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-dim)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '300px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* SearchBar */}
              <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by VIP Car # or Name"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    paddingLeft: '40px',
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    width: '100%',
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--border-dim)',
                    color: 'var(--text-main)'
                  }}
                />
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', opacity: 0.8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
              </div>

              {/* Vehicle Type Filter */}
              <div style={{ minWidth: '180px', position: 'relative' }}>
                <select
                  className="form-control"
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    height: '42px',
                    borderRadius: '8px',
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--border-dim)',
                    paddingRight: '36px',
                    appearance: 'none',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: 'var(--text-main)'
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

              {/* Reset Button */}
              {(searchTerm || filterType) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('');
                    setCurrentPage(1);
                  }}
                  className="btn btn--text"
                  style={{ color: 'var(--accent)', fontWeight: 600, padding: '0 8px' }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="btn btn--text"
                  style={{ color: 'var(--text-muted)', padding: '0 8px' }}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="card__empty">Loading drivers...</p>
        ) : drivers.length === 0 ? (
          <p className="card__empty">No drivers found. Upload a file or add manually.</p>
        ) : filteredDrivers.length === 0 ? (
          <p className="card__empty">No drivers match your search.</p>
        ) : (
          <>
            <div className="table-wrap" ref={tableTopRef}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
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
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver) => (
                    <tr
                      key={driver._id}
                      className={selectedIds.has(driver._id) ? 'row-selected' : ''}
                      onClick={() => handleDriverSelect(driver)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(driver._id)}
                          onChange={() => toggleSelectRow(driver._id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--blue-500)' }}
                        />
                      </td>
                      <td>{driver.vipCarNum}</td>
                      <td style={{ fontWeight: 500 }}>{driver.name}</td>
                      <td>{driver.carYear || 'â€”'}</td>
                      <td>{driver.carMake || 'â€”'}</td>
                      <td>{driver.carModel || 'â€”'}</td>
                      <td>{driver.vehicleType || 'â€”'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => user?.role === 'admin' && toggleStatus(driver)}
                          disabled={user?.role !== 'admin'}
                          title={user?.role !== 'admin' ? 'Only admin can change status' : ''}
                          className={`badge ${driver.isActive !== false ? 'badge--green' : 'badge--red'}`}
                          style={{
                            cursor: user?.role === 'admin' ? 'pointer' : 'not-allowed',
                            opacity: user?.role === 'admin' ? 1 : 0.6,
                            border: 'none',
                          }}
                        >
                          {driver.isActive !== false ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(driver)}
                            className="btn btn--secondary btn--sm"
                            title="Edit"
                            style={{ padding: '6px 10px', minWidth: 'auto' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(driver._id)}
                            className="btn btn--secondary btn--sm"
                            title="Delete"
                            style={{ padding: '6px 10px', minWidth: 'auto', borderColor: 'rgba(220, 38, 38, 0.3)', color: 'var(--danger)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Showing <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{(currentPage - 1) * limit + 1}</span> to <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{Math.min(currentPage * limit, totalRecords)}</span> of <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{totalRecords}</span>
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
                    const isCurrent = currentPage === pageNum;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => changePage(pageNum)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: isCurrent ? 'var(--accent)' : 'var(--border-dim)',
                            background: isCurrent ? 'var(--accent)' : 'transparent',
                            color: isCurrent ? '#000' : 'var(--text-main)',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} style={{ padding: '0 2px', color: 'var(--text-muted)' }}>...</span>;
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

          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '16px', border: '1px solid var(--border-dim)' }}>
            <div className="card__header" style={{ borderBottom: '1px solid var(--border-dim)' }}>
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '16px' }}>
              <div className="form-group mb-4">
                <label className="form-label">VIP Car #</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.vipCarNum}
                  onChange={(e) => setFormData({ ...formData, vipCarNum: e.target.value })}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Driver Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-grid mb-4">
                <div className="form-group">
                  <label className="form-label">Vehicle Make</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.carMake}
                    onChange={(e) => setFormData({ ...formData, carMake: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Model</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-grid mb-6">
                <div className="form-group">
                  <label className="form-label">Vehicle Year</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.carYear}
                    onChange={(e) => setFormData({ ...formData, carYear: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select
                    className="form-control"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary flex-1">
                  {editingDriver ? 'Save Changes' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )
      }

      <style jsx>{`
        .modal-overlay {
          animation: fadeIn 0.1s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .row-selected {
          background-color: rgba(201, 162, 74, 0.1) !important;
        }
        .data-table tr:hover {
          background-color: var(--bg-section) !important;
        }
        .data-table tr.row-selected:hover {
          background-color: rgba(201, 162, 74, 0.15) !important;
        }
        .form-control:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 2px rgba(201, 162, 74, 0.1);
        }
      `}</style>
    </div>
  );
}
