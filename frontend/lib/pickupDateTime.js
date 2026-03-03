function pad2(value) {
  return String(value).padStart(2, '0');
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function isValidYMD(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && (date.getUTCMonth() + 1) === month && date.getUTCDate() === day;
}

function parseDateInput(value) {
  if (!value) return null;

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;

    let m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const year = toNumber(m[1]);
      const month = toNumber(m[2]);
      const day = toNumber(m[3]);
      return isValidYMD(year, month, day) ? { year, month, day } : null;
    }

    m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
      const month = toNumber(m[1]);
      const day = toNumber(m[2]);
      const year = toNumber(m[3]);
      return isValidYMD(year, month, day) ? { year, month, day } : null;
    }

    return null;
  }

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
  }

  return null;
}

function parseTimeInput(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const m = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!m) return null;

  let hour = toNumber(m[1]);
  const minute = toNumber(m[2]);
  const meridiem = (m[3] || '').toUpperCase();

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (minute < 0 || minute > 59) return null;

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (hour === 12) hour = 0;
    if (meridiem === 'PM') hour += 12;
  } else if (hour < 0 || hour > 23) {
    return null;
  }

  return { hour, minute };
}

function formatParts(year, month, day, hour, minute) {
  if (!isValidYMD(year, month, day)) return '';
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return '';
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return '';
  return `${pad2(month)}/${pad2(day)}/${year} ${pad2(hour)}:${pad2(minute)}`;
}

export function formatPickupDateTimeFromParts(pickupDate, pickupTime) {
  const dateParts = parseDateInput(pickupDate);
  const timeParts = parseTimeInput(pickupTime);
  if (!dateParts || !timeParts) return '';
  return formatParts(dateParts.year, dateParts.month, dateParts.day, timeParts.hour, timeParts.minute);
}

export function formatPickupDateTime(rawValue) {
  if (rawValue === null || rawValue === undefined) return '';

  const asDate = rawValue instanceof Date ? rawValue.toISOString() : String(rawValue);
  const text = asDate.trim();
  if (!text) return '';

  let m = text.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::\d{2})?/);
  if (m) {
    const year = toNumber(m[1]);
    const month = toNumber(m[2]);
    const day = toNumber(m[3]);
    const hour = toNumber(m[4]);
    const minute = toNumber(m[5]);
    return formatParts(year, month, day, hour, minute) || text;
  }

  m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[,\s]+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (m) {
    const month = toNumber(m[1]);
    const day = toNumber(m[2]);
    const year = toNumber(m[3]);
    const parsedTime = parseTimeInput(`${m[4]}:${m[5]} ${m[6] || ''}`.trim());
    if (parsedTime) {
      return formatParts(year, month, day, parsedTime.hour, parsedTime.minute) || text;
    }
  }

  const parsed = new Date(text);
  if (Number.isFinite(parsed.getTime())) {
    return formatParts(
      parsed.getFullYear(),
      parsed.getMonth() + 1,
      parsed.getDate(),
      parsed.getHours(),
      parsed.getMinutes()
    ) || text;
  }

  return text;
}
