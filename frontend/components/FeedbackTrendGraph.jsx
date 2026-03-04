'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

const POLL_INTERVAL_MS = 30000;
const PAGE_SIZE = 100;
const CHART_WIDTH = 1000;
const CHART_HEIGHT = 320;
const PAD_TOP = 20;
const PAD_RIGHT = 20;
const PAD_BOTTOM = 52;
const PAD_LEFT = 56;

function toDateKey(date, granularity) {
  if (granularity === 'month') {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
}

function parseKeyToDate(key, granularity) {
  if (granularity === 'month') return new Date(`${key}-01T00:00:00.000Z`);
  return new Date(`${key}T00:00:00.000Z`);
}

function isNegativeFeedback(item) {
  const driverNegative = typeof item.driverRating === 'number' && item.driverRating < 5;
  const vehicleNegative = typeof item.vehicleRating === 'number' && item.vehicleRating < 5;
  return driverNegative || vehicleNegative;
}

function getGranularity(list) {
  if (list.length < 2) return 'day';
  const times = list
    .map((item) => {
      const t = new Date(item.submittedAt).getTime();
      return Number.isFinite(t) ? t : null;
    })
    .filter((t) => t != null)
    .sort((a, b) => a - b);

  if (times.length < 2) return 'day';
  const spanDays = (times[times.length - 1] - times[0]) / 86400000;
  return spanDays > 120 ? 'month' : 'day';
}

function buildTrendPoints(list) {
  const granularity = getGranularity(list);
  const grouped = new Map();

  list.forEach((item) => {
    const date = new Date(item.submittedAt);
    if (Number.isNaN(date.getTime())) return;
    const key = toDateKey(date, granularity);

    const current = grouped.get(key) || { negative: 0 };
    if (isNegativeFeedback(item)) current.negative += 1;
    grouped.set(key, current);
  });

  const sortedKeys = [...grouped.keys()].sort((a, b) => parseKeyToDate(a, granularity) - parseKeyToDate(b, granularity));
  const formatter = new Intl.DateTimeFormat('en-US', granularity === 'month'
    ? { month: 'short', year: '2-digit' }
    : { month: 'short', day: 'numeric' });

  let cumulativeNegative = 0;
  return sortedKeys.map((key) => {
    const current = grouped.get(key);
    cumulativeNegative += current.negative;
    return {
      key,
      label: formatter.format(parseKeyToDate(key, granularity)),
      negative: cumulativeNegative,
    };
  });
}

function getNiceMax(value) {
  if (value <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  if (normalized <= 1.5) return 1.5 * magnitude;
  if (normalized <= 3) return 3 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function buildSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const controlX = (prev.x + curr.x) / 2;
    path += ` C ${controlX} ${prev.y}, ${controlX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return path;
}

async function fetchAllFeedback() {
  const list = [];
  let page = 1;
  let pages = 1;

  do {
    let data;
    try {
      data = await api.get(`/api/feedback?filter=negative&compact=1&page=${page}&limit=${PAGE_SIZE}`);
    } catch {
      // Stop pagination on transient API failures and keep already collected points.
      break;
    }
    if (Array.isArray(data?.list)) {
      list.push(...data.list);
    }
    pages = data?.pagination?.pages || 1;
    page += 1;
  } while (page <= pages);

  return list;
}

export default function FeedbackTrendGraph() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const list = await fetchAllFeedback();
      setFeedbackList(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timer;
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await loadData();
    };

    run();
    timer = setInterval(run, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mounted = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadData]);

  const { points, xTicks, yTicks, yMax } = useMemo(() => {
    const trendPoints = buildTrendPoints(feedbackList);
    const innerWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
    const innerHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
    const maxValue = trendPoints.length > 0
      ? Math.max(...trendPoints.map((item) => item.negative))
      : 0;
    const normalizedMax = getNiceMax(maxValue || 1);

    const allPoints = trendPoints.map((item, index) => {
      const x = trendPoints.length === 1
        ? PAD_LEFT + innerWidth / 2
        : PAD_LEFT + (index / (trendPoints.length - 1)) * innerWidth;
      const negativeY = PAD_TOP + innerHeight - (item.negative / normalizedMax) * innerHeight;
      return {
        x,
        label: item.label,
        negativeY,
      };
    });

    const ticks = 4;
    const nextYTicks = Array.from({ length: ticks + 1 }, (_, idx) => {
      const ratio = idx / ticks;
      const value = Math.round((1 - ratio) * normalizedMax);
      return {
        value,
        y: PAD_TOP + ratio * innerHeight,
      };
    });

    const stride = allPoints.length > 10 ? Math.ceil(allPoints.length / 6) : 1;
    const nextXTicks = allPoints.filter((_, idx) => idx % stride === 0 || idx === allPoints.length - 1);

    return {
      points: allPoints,
      xTicks: nextXTicks,
      yTicks: nextYTicks,
      yMax: normalizedMax,
    };
  }, [feedbackList]);

  const negativePath = useMemo(
    () => buildSmoothPath(points.map((point) => ({ x: point.x, y: point.negativeY }))),
    [points],
  );

  return (
    <section className="feedback-trend-card" aria-label="Negative feedback trend graph">
      <div className="feedback-trend-card__head">
        <h2>Negative Feedback Trend</h2>
        <p>Cumulative negative feedback growth over time</p>
      </div>

      {loading ? (
        <p className="feedback-trend-card__empty">Loading trend data...</p>
      ) : points.length === 0 ? (
        <p className="feedback-trend-card__empty">No negative feedback data available yet.</p>
      ) : (
        <div className="feedback-trend-chart-wrap">
          <svg
            className="feedback-trend-chart"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            role="img"
            aria-label={`Line chart showing cumulative negative feedback up to ${yMax}`}
          >
            <rect
              x={PAD_LEFT}
              y={PAD_TOP}
              width={CHART_WIDTH - PAD_LEFT - PAD_RIGHT}
              height={CHART_HEIGHT - PAD_TOP - PAD_BOTTOM}
              fill="transparent"
            />

            {yTicks.map((tick) => (
              <g key={tick.y}>
                <line
                  x1={PAD_LEFT}
                  y1={tick.y}
                  x2={CHART_WIDTH - PAD_RIGHT}
                  y2={tick.y}
                  stroke="#f4dede"
                  strokeWidth="1"
                />
                <text
                  x={PAD_LEFT - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  className="feedback-trend-chart__axis-label"
                >
                  {tick.value}
                </text>
              </g>
            ))}

            {/* Subtle red gradient area under the line */}
            <defs>
              <linearGradient id="negativeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Filled area */}
            {points.length > 0 && (
              <path
                d={`${negativePath} L ${points[points.length - 1].x} ${PAD_TOP + CHART_HEIGHT - PAD_TOP - PAD_BOTTOM} L ${points[0].x} ${PAD_TOP + CHART_HEIGHT - PAD_TOP - PAD_BOTTOM} Z`}
                fill="url(#negativeAreaGrad)"
              />
            )}

            <path d={negativePath} fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {xTicks.map((tick) => (
              <text
                key={`${tick.x}-${tick.label}`}
                x={tick.x}
                y={CHART_HEIGHT - 18}
                textAnchor="middle"
                className="feedback-trend-chart__axis-label"
              >
                {tick.label}
              </text>
            ))}
          </svg>

          <div className="feedback-trend-legend" aria-hidden="true">
            <span><i className="feedback-trend-legend__dot feedback-trend-legend__dot--negative" />Negative Feedback (cumulative)</span>
          </div>
        </div>
      )}
    </section>
  );
}
