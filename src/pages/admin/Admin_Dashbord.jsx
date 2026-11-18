import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  BLUE,
  GREEN,
  RED,
  Ic,
  ICON,
} from "../Home";

/* =========================================================
   src/pages/admin/Admin_Dashbord.jsx
   Admin Dashboard  (light theme, charts)
   Sidebar + mobile 3-dot button are rendered by App.jsx (all admin pages)
   APIs:
     GET /admin/stats                      (users + registrations)
     GET /admin/deposits
     GET /admin/withdraws/counts
     GET /admin/withdraws?status=all&page=1&size=5
     GET /admin/payment-methods
   Navigation targets (App.jsx go()):
     admin, adminDeposits, adminWithdrawals,
     adminPaymentMethods, adminOptions,
     adminKyc, adminUsers
   ========================================================= */

const CSS = `
.ad-wrap, .ad-wrap * { box-sizing: border-box; }

.ad-wrap {
  --bg: #f4f6fa;
  --surface: #ffffff;
  --line: #e5e9f0;
  --line-soft: #eef1f6;
  --text: #0f1b30;
  --text-2: #4a5568;
  --muted: #7a8699;
  --primary: #1f7acb;
  --primary-soft: #eaf3fc;
  --ok: #0e9f6e;
  --ok-soft: #e3f6ee;
  --warn: #c98a0a;
  --warn-soft: #fdf3dc;
  --bad: #e0415f;
  --bad-soft: #fdebee;
  --shadow: 0 1px 2px rgba(16,30,54,.04), 0 6px 20px rgba(16,30,54,.05);
  --shadow-hover: 0 2px 4px rgba(16,30,54,.05), 0 12px 28px rgba(16,30,54,.09);

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  overflow-x: clip;
}
.ad-wrap button { font-family: inherit; cursor: pointer; -webkit-appearance: none; appearance: none; }
.ad-wrap button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* ---------- top bar ---------- */
.ad-head {
  position: sticky; top: 0; z-index: 30;
  background: rgba(255,255,255,.92);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
  padding-top: env(safe-area-inset-top, 0px);
}
.ad-head-in {
  max-width: 1240px; margin: 0 auto;
  padding: 12px 24px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 66px;
}
.ad-head-l { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ad-head-l h3 { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: -.2px; }
.ad-head-l small { display: block; margin-top: 2px; font-size: 12px; color: var(--muted); }
.ad-actions { display: flex; align-items: center; gap: 10px; }

.ad-btn {
  min-height: 42px; padding: 0 16px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid var(--line); border-radius: 11px;
  background: var(--surface); color: var(--text);
  font-size: 13px; font-weight: 650; white-space: nowrap;
  transition: border-color .15s, background .15s, transform .1s;
}
.ad-btn:hover { border-color: #c7d3e4; background: #f8fafd; }
.ad-btn:active { transform: scale(.97); }
.ad-btn:disabled { opacity: .55; cursor: not-allowed; }
.ad-btn.sm { min-height: 36px; padding: 0 12px; font-size: 12px; }

.ad-profile {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 14px 5px 5px;
  border: 1px solid var(--line); border-radius: 999px;
  background: var(--surface); min-width: 0;
}
.ad-avatar {
  width: 34px; height: 34px; flex: none; border-radius: 50%;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; display: grid; place-items: center;
  font-size: 14px; font-weight: 800;
}
.ad-pinfo { min-width: 0; line-height: 1.25; }
.ad-pinfo b { display: block; font-size: 12.5px; font-weight: 700; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-pinfo small { display: block; font-size: 11px; color: var(--muted); max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---------- page ---------- */
.ad-page {
  max-width: 1240px; margin: 0 auto;
  padding: 26px 24px calc(34px + env(safe-area-inset-bottom, 0px));
}
.ad-title { margin-bottom: 22px; }
.ad-title h1 { margin: 0 0 6px; font-size: 26px; line-height: 1.2; font-weight: 800; letter-spacing: -.5px; }
.ad-title p { margin: 0; font-size: 14px; color: var(--muted); }

.ad-error {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  margin-bottom: 18px; padding: 13px 16px;
  border: 1px solid #f4c5cd; border-radius: 12px;
  background: var(--bad-soft); color: #b3243f; font-size: 13px;
}

.ad-sec { margin: 26px 0 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ad-sec h2 { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: -.2px; }
.ad-sec small { font-size: 12px; color: var(--muted); }

/* ---------- stat cards ---------- */
.ad-stats {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px; margin-bottom: 6px;
}
.ad-stat {
  position: relative; padding: 20px;
  border: 1px solid var(--line); border-radius: 16px;
  background: var(--surface); box-shadow: var(--shadow);
  text-align: left; color: inherit; min-width: 0;
  transition: box-shadow .18s, transform .18s, border-color .18s;
}
.ad-stat:hover { box-shadow: var(--shadow-hover); border-color: #d3dcea; transform: translateY(-1px); }
.ad-stat:active { transform: scale(.98); }
.ad-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ad-stat-label { font-size: 13px; font-weight: 600; color: var(--text-2); }
.ad-stat-ic { width: 40px; height: 40px; flex: none; border-radius: 12px; display: grid; place-items: center; }
.ad-stat-val { margin-top: 16px; font-size: 32px; line-height: 1; font-weight: 800; letter-spacing: -1px; }
.ad-stat-foot { margin-top: 8px; font-size: 12px; color: var(--muted); }

/* ---------- panels ---------- */
.ad-row2 {
  display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr);
  gap: 16px; align-items: stretch;
}
.ad-row3 {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px; align-items: stretch;
}
.ad-panel {
  border: 1px solid var(--line); border-radius: 16px;
  background: var(--surface); box-shadow: var(--shadow);
  overflow: hidden; min-width: 0;
}
.ad-ph {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 17px 20px; border-bottom: 1px solid var(--line-soft);
}
.ad-ph h3 { margin: 0; font-size: 15.5px; font-weight: 750; letter-spacing: -.1px; }
.ad-ph small { display: block; margin-top: 3px; font-size: 12px; color: var(--muted); font-weight: 400; }
.ad-cb { padding: 18px 20px 20px; }

.ad-pill {
  display: inline-block; padding: 4px 10px; border-radius: 999px;
  font-size: 10.5px; font-weight: 800; letter-spacing: .3px; white-space: nowrap;
}
.ad-pill.ok   { background: var(--ok-soft);   color: var(--ok); }
.ad-pill.warn { background: var(--warn-soft); color: var(--warn); }
.ad-pill.bad  { background: var(--bad-soft);  color: var(--bad); }
.ad-pill.blue { background: var(--primary-soft); color: var(--primary); }

/* ---------- charts ---------- */
.ad-svg { display: block; width: 100%; height: auto; }
.ad-svg text { font-family: inherit; }
.ad-bar { transition: opacity .15s; }
.ad-bar:hover { opacity: .8; }

.ad-donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.ad-donut { position: relative; width: 100%; max-width: 190px; }
.ad-donut-c {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; pointer-events: none;
}
.ad-donut-c b { font-size: 28px; font-weight: 800; letter-spacing: -.8px; line-height: 1; }
.ad-donut-c span { margin-top: 5px; font-size: 11.5px; color: var(--muted); font-weight: 600; }

.ad-legend { width: 100%; display: grid; gap: 2px; }
.ad-lg-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 9px 2px; border-bottom: 1px solid var(--line-soft); font-size: 13px;
}
.ad-lg-row:last-child { border-bottom: 0; }
.ad-lg-l { display: flex; align-items: center; gap: 9px; color: var(--text-2); }
.ad-lg-r { display: flex; align-items: baseline; gap: 8px; }
.ad-lg-r b { font-weight: 800; font-size: 14px; }
.ad-lg-r small { font-size: 11.5px; color: var(--muted); min-width: 36px; text-align: right; }
.ad-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; display: inline-block; }

/* registration summary tiles */
.ad-regs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.ad-reg {
  padding: 14px 16px; border: 1px solid var(--line-soft);
  border-radius: 12px; background: #f8fafd; min-width: 0;
}
.ad-reg small { display: block; font-size: 12px; font-weight: 600; color: var(--muted); }
.ad-reg b { display: block; margin-top: 6px; font-size: 22px; font-weight: 800; letter-spacing: -.5px; font-variant-numeric: tabular-nums; }
.ad-reg.hi { background: var(--primary-soft); border-color: #cfe3f7; }
.ad-reg.hi b { color: var(--primary); }

/* compare bars */
.ad-cmp { display: grid; gap: 18px; }
.ad-cmp-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 13px; font-weight: 700; }
.ad-cmp-h span { color: var(--muted); font-weight: 600; font-size: 12px; }
.ad-cmp-line { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.ad-cmp-tag { width: 24px; flex: none; font-size: 10.5px; font-weight: 800; color: var(--muted); letter-spacing: .3px; }
.ad-cmp-track { flex: 1; height: 11px; border-radius: 999px; background: #eef1f6; overflow: hidden; }
.ad-cmp-fill { height: 100%; border-radius: 999px; transition: width .5s ease; }
.ad-cmp-n { width: 38px; flex: none; text-align: right; font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; }
.ad-cmp-key { display: flex; gap: 16px; margin-top: 18px; font-size: 12px; color: var(--text-2); }
.ad-cmp-key i { display: inline-block; width: 18px; height: 6px; border-radius: 999px; margin-right: 6px; vertical-align: middle; }

/* system summary */
.ad-sumgrid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 22px; align-items: stretch; }
.ad-sum-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 13px 4px; border-bottom: 1px solid var(--line-soft); font-size: 13.5px;
}
.ad-sum-l { display: flex; align-items: center; gap: 10px; color: var(--text-2); }
.ad-sum-row b { font-weight: 800; font-size: 14.5px; font-variant-numeric: tabular-nums; }
.ad-total {
  padding: 20px; border-radius: 14px;
  background: linear-gradient(135deg, #eaf6fb, #e8f0fc);
  display: flex; flex-direction: column; justify-content: center;
}
.ad-total span { display: block; font-size: 12px; font-weight: 600; color: var(--text-2); }
.ad-total b { display: block; margin-top: 8px; font-size: 28px; font-weight: 800; letter-spacing: -.6px; word-break: break-word; }
.ad-total small { display: block; margin-top: 8px; font-size: 11.5px; color: var(--muted); }

/* tables */
.ad-recent { margin-top: 16px; }
.ad-table-wrap { overflow-x: auto; }
.ad-table { width: 100%; border-collapse: collapse; }
.ad-table th {
  padding: 12px 20px; text-align: left;
  font-size: 11px; font-weight: 700; letter-spacing: .4px;
  color: var(--muted); background: #f8fafd;
  border-bottom: 1px solid var(--line-soft); white-space: nowrap;
}
.ad-table td { padding: 14px 20px; font-size: 13px; border-bottom: 1px solid var(--line-soft); vertical-align: middle; }
.ad-table tbody tr:last-child td { border-bottom: 0; }
.ad-table tbody tr:hover td { background: #fafbfe; }
.ad-mono { font-variant-numeric: tabular-nums; }
.ad-user { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ad-cards { display: none; }
.ad-dep { padding: 14px 16px; border-bottom: 1px solid var(--line-soft); }
.ad-dep:last-child { border-bottom: 0; }
.ad-dep-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ad-dep-id { font-size: 13px; font-weight: 750; }
.ad-dep-user { margin-top: 6px; font-size: 12.5px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-dep-bot { margin-top: 10px; display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
.ad-dep-amt { font-size: 17px; font-weight: 800; letter-spacing: -.3px; }
.ad-dep-amt small { margin-left: 6px; font-size: 12px; font-weight: 600; color: var(--muted); }
.ad-dep-date { font-size: 11.5px; color: var(--muted); text-align: right; }

.ad-empty { padding: 36px 16px; text-align: center; color: var(--muted); font-size: 13.5px; }
.ad-foot { padding: 28px 0 0; text-align: center; font-size: 12px; color: #9aa5b8; }

/* skeleton */
.ad-sk {
  display: inline-block; width: 46px; height: 28px; border-radius: 8px;
  background: linear-gradient(90deg, #eef1f6, #f6f8fb, #eef1f6);
  background-size: 200% 100%; animation: adsk 1.2s ease-in-out infinite;
}
.ad-sk.chart { display: block; width: 100%; height: 230px; border-radius: 12px; }
@keyframes adsk { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ---------- responsive ---------- */
@media (max-width: 1280px) {
  .ad-row3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 1100px) {
  .ad-row2 { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .ad-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ad-sumgrid { grid-template-columns: 1fr; }
  .ad-regs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 680px) {
  .ad-head-in { padding: 10px 14px; gap: 10px; min-height: 62px; }
  .ad-head-l small { display: none; }
  .ad-actions { gap: 8px; }
  .ad-btn.refresh span.t { display: none; }
  .ad-btn.refresh { width: 42px; padding: 0; }
  .ad-profile .ad-pinfo { display: none; }
  .ad-profile { padding: 4px; }

  .ad-page { padding: 18px 14px calc(28px + env(safe-area-inset-bottom, 0px)); }
  .ad-title { margin-bottom: 14px; }
  .ad-title h1 { font-size: 22px; }
  .ad-title p { font-size: 13px; }
  .ad-sec { margin: 22px 0 10px; }

  .ad-stats { gap: 10px; }
  .ad-stat { padding: 14px; border-radius: 14px; }
  .ad-stat-label { font-size: 12px; }
  .ad-stat-ic { width: 34px; height: 34px; border-radius: 10px; }
  .ad-stat-val { margin-top: 12px; font-size: 26px; }
  .ad-stat-foot { font-size: 11px; }

  .ad-row2, .ad-row3 { grid-template-columns: 1fr; gap: 12px; }
  .ad-ph { padding: 14px 16px; }
  .ad-ph h3 { font-size: 15px; }
  .ad-cb { padding: 14px 14px 16px; }
  .ad-regs { gap: 10px; }
  .ad-reg { padding: 12px 14px; }
  .ad-reg b { font-size: 20px; }

  .ad-recent { margin-top: 12px; }
  .ad-table-wrap { display: none; }
  .ad-cards { display: block; }
}
@media (max-width: 360px) {
  .ad-stat-val { font-size: 23px; }
  .ad-stat-foot { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ad-wrap * { animation: none !important; transition: none !important; }
}
`;

const CURRENT_PAGE = "admin";
const CHART_DAYS = 10;

const C_PENDING = "#e0a416";
const C_APPROVED = GREEN || "#0e9f6e";
const C_REJECTED = RED || "#e0415f";
const C_BLUE = BLUE || "#1f7acb";
const C_GREY = "#a3adbd";

const EMPTY_STATS = {
  users: 0,
  active: 0,
  banned: 0,
  verified: 0,
  pending_kyc: 0,
  rejected_kyc: 0,
  admins: 0,
  registrations: {
    total: 0,
    today: 0,
    yesterday: 0,
    this_week: 0,
    this_month: 0,
    last_3_months: 0,
    last_6_months: 0,
    last_1_year: 0,
  },
  timezone: "",
};

/* crypto methods filter (same rule as the Payment Methods page) */
const CRYPTO_COINS = ["USDT", "BTC", "USDC", "ETH", "DOGE", "XRP", "SOL", "PYUSD"];

const isCryptoMethod = (item) => {
  const type = String(item?.method_type || "").toLowerCase();
  const coin = String(item?.coin || "").toUpperCase();
  const currency = String(item?.currency || "").toUpperCase();
  const network = String(item?.network || "").trim();
  return (
    type === "crypto" &&
    (CRYPTO_COINS.includes(coin) || CRYPTO_COINS.includes(currency)) &&
    Boolean(network || item?.address)
  );
};

const getRows = (data) => {
  if (data?.data !== undefined) data = data.data;
  else if (data?.result !== undefined) data = data.result;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.deposits)) return data.deposits;
  if (Array.isArray(data?.methods)) return data.methods;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const statusOf = (item) =>
  String(item?.status || "pending").toLowerCase();

const amountOf = (item) =>
  Number(item?.amount ?? item?.requested_amount ?? item?.amount_bdt ?? 0);

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const num = (value) => Number(value || 0).toLocaleString("en-US");

const dateOf = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const getErrorMessage = (err) => {
  if (err?.message === "unauthorized") return "Admin authorization failed. Please login again.";
  if (err?.message === "neterr") return "Network error. Please check your internet connection.";
  return err?.message || "Could not load data. Please check the API.";
};

const badgeOf = (status) =>
  status === "approved" ? "ok" : status === "rejected" ? "bad" : "warn";

const pct = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0);

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ---------------------------------------------------------
   Charts (plain SVG, no external library)
--------------------------------------------------------- */

function Donut({ data, centerTop, centerSub, loading }) {
  const size = 190;
  const thick = 24;
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((s, x) => s + x.value, 0);

  let acc = 0;
  const arcs = total > 0
    ? data
        .filter((x) => x.value > 0)
        .map((x) => {
          const len = (x.value / total) * c;
          const arc = { ...x, len, off: acc };
          acc += len;
          return arc;
        })
    : [];

  return (
    <div className="ad-donut-wrap">
      <div className="ad-donut">
        <svg className="ad-svg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution chart">
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f6" strokeWidth={thick} />
            {arcs.map((a) => (
              <circle
                key={a.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={a.color}
                strokeWidth={thick}
                strokeDasharray={`${Math.max(a.len - 2, 0)} ${c - Math.max(a.len - 2, 0)}`}
                strokeDashoffset={-a.off}
                strokeLinecap="butt"
              />
            ))}
          </g>
        </svg>
        <div className="ad-donut-c">
          <b>{loading ? "—" : centerTop}</b>
          <span>{centerSub}</span>
        </div>
      </div>

      <div className="ad-legend">
        {data.map((x) => (
          <div className="ad-lg-row" key={x.label}>
            <span className="ad-lg-l">
              <i className="ad-dot" style={{ background: x.color }} />
              {x.label}
            </span>
            <span className="ad-lg-r">
              <b>{loading ? "—" : x.value}</b>
              <small>{loading ? "" : `${pct(x.value, total)}%`}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Generic vertical bar chart: items = [{ key, label, sub?, full, value, highlight? }] */
function BarChart({ items, ariaLabel, unit = "request(s)", gradId = "adbar" }) {
  const W = 680;
  const H = 240;
  const pl = 34;
  const pr = 10;
  const pt = 18;
  const pb = 38;
  const iw = W - pl - pr;
  const ih = H - pt - pb;

  const maxCount = Math.max(0, ...items.map((d) => d.value));
  const step = Math.max(1, Math.ceil(maxCount / 4));
  const yMax = step * 4;

  const slot = iw / items.length;
  const bw = Math.min(34, slot * 0.6);

  return (
    <svg className="ad-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a7de1" />
          <stop offset="100%" stopColor="#1fbad0" />
        </linearGradient>
        <linearGradient id={gradId + "Hi"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c4dd8" />
          <stop offset="100%" stopColor="#2a7de1" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3, 4].map((i) => {
        const y = pt + ih - (ih / 4) * i;
        return (
          <g key={i}>
            <line x1={pl} x2={W - pr} y1={y} y2={y} stroke="#eef1f6" strokeWidth="1" />
            <text x={pl - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9aa5b8">
              {step * i}
            </text>
          </g>
        );
      })}

      {items.map((d, i) => {
        const h = yMax > 0 ? (d.value / yMax) * ih : 0;
        const x = pl + slot * i + (slot - bw) / 2;
        const y = pt + ih - h;
        return (
          <g key={d.key}>
            <rect
              className="ad-bar"
              x={x}
              y={d.value > 0 ? y : pt + ih - 2}
              width={bw}
              height={d.value > 0 ? h : 2}
              rx="6"
              fill={d.value > 0 ? `url(#${d.highlight ? gradId + "Hi" : gradId})` : "#e3e8f0"}
            >
              <title>{`${d.full}: ${d.value} ${unit}${d.extra ? ", " + d.extra : ""}`}</title>
            </rect>
            {d.value > 0 && (
              <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#0f1b30">
                {d.value}
              </text>
            )}
            <text
              x={x + bw / 2}
              y={d.sub ? H - 19 : H - 12}
              textAnchor="middle"
              fontSize="11.5"
              fill={d.highlight ? "#7c4dd8" : "#4a5568"}
              fontWeight={d.highlight ? "800" : "600"}
            >
              {d.label}
            </text>
            {d.sub && (
              <text x={x + bw / 2} y={H - 5} textAnchor="middle" fontSize="10" fill="#9aa5b8">
                {d.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Compare({ dep, wd, loading }) {
  const rows = [
    { k: "pending", l: "Pending", c: C_PENDING },
    { k: "approved", l: "Approved", c: C_APPROVED },
    { k: "rejected", l: "Rejected", c: C_REJECTED },
  ];
  const max = Math.max(1, ...rows.flatMap((r) => [dep[r.k] || 0, wd[r.k] || 0]));

  return (
    <div>
      <div className="ad-cmp">
        {rows.map((r) => (
          <div key={r.k}>
            <div className="ad-cmp-h">
              {r.l}
              <span>
                {loading ? "" : `${(dep[r.k] || 0) + (wd[r.k] || 0)} total`}
              </span>
            </div>

            <div className="ad-cmp-line">
              <span className="ad-cmp-tag">DEP</span>
              <div className="ad-cmp-track">
                <div
                  className="ad-cmp-fill"
                  style={{ width: `${((dep[r.k] || 0) / max) * 100}%`, background: r.c }}
                />
              </div>
              <span className="ad-cmp-n">{loading ? "—" : dep[r.k] || 0}</span>
            </div>

            <div className="ad-cmp-line">
              <span className="ad-cmp-tag">WD</span>
              <div className="ad-cmp-track">
                <div
                  className="ad-cmp-fill"
                  style={{ width: `${((wd[r.k] || 0) / max) * 100}%`, background: r.c, opacity: 0.55 }}
                />
              </div>
              <span className="ad-cmp-n">{loading ? "—" : wd[r.k] || 0}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ad-cmp-key">
        <span><i style={{ background: "#1f7acb" }} />DEP = Deposits</span>
        <span><i style={{ background: "#1f7acb", opacity: 0.55 }} />WD = Withdrawals</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Recent requests table / card list
--------------------------------------------------------- */

function RecentList({ rows, loading, onAll, title, subtitle }) {
  return (
    <section className="ad-panel ad-recent">
      <div className="ad-ph">
        <h3>
          {title}
          <small>{subtitle}</small>
        </h3>
        <button type="button" className="ad-btn sm" onClick={onAll}>
          View All <span>›</span>
        </button>
      </div>

      {loading ? (
        <div className="ad-empty">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="ad-empty">No requests found.</div>
      ) : (
        <>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>REQUEST ID</th>
                  <th>USER</th>
                  <th>AMOUNT</th>
                  <th>COIN</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, index) => {
                  const status = statusOf(item);
                  return (
                    <tr key={item.id ?? index}>
                      <td className="ad-mono">#{item.id ?? "—"}</td>
                      <td>
                        <div className="ad-user">
                          {item.user_email || item.email || item.username || item.user_id || "—"}
                        </div>
                      </td>
                      <td className="ad-mono"><b>{money(amountOf(item))}</b></td>
                      <td>{item.coin || item.currency || "—"}</td>
                      <td>{dateOf(item.created_at || item.createdAt)}</td>
                      <td>
                        <span className={`ad-pill ${badgeOf(status)}`}>{status.toUpperCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="ad-cards">
            {rows.map((item, index) => {
              const status = statusOf(item);
              return (
                <div className="ad-dep" key={item.id ?? index}>
                  <div className="ad-dep-top">
                    <span className="ad-dep-id">#{item.id ?? "—"}</span>
                    <span className={`ad-pill ${badgeOf(status)}`}>{status.toUpperCase()}</span>
                  </div>
                  <div className="ad-dep-user">
                    {item.user_email || item.email || item.username || item.user_id || "—"}
                  </div>
                  <div className="ad-dep-bot">
                    <span className="ad-dep-amt ad-mono">
                      {money(amountOf(item))}
                      <small>{item.coin || item.currency || ""}</small>
                    </span>
                    <span className="ad-dep-date">{dateOf(item.created_at || item.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------
   Page
--------------------------------------------------------- */

export default function Admin_Dashbord({ me, go, logout }) {
  const [deposits, setDeposits] = useState([]);
  const [wdCounts, setWdCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [wdRecent, setWdRecent] = useState([]);
  const [methods, setMethods] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const adminName =
    me?.full_name || me?.name || me?.username || me?.email || "Administrator";
  const adminEmail = me?.email || "Admin Account";
  const initials = String(adminName).trim().charAt(0).toUpperCase() || "A";

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    const [dep, wc, wl, pm, st] = await Promise.allSettled([
      api("/admin/deposits"),
      api("/admin/withdraws/counts"),
      api("/admin/withdraws?status=all&page=1&size=5"),
      api("/admin/payment-methods"),
      api("/admin/stats"),
    ]);

    const failed = [];

    if (dep.status === "fulfilled") setDeposits(getRows(dep.value));
    else failed.push(["Deposits", dep.reason]);

    if (wc.status === "fulfilled") {
      const c = wc.value?.data ?? wc.value ?? {};
      setWdCounts({
        all: Number(c.all || 0),
        pending: Number(c.pending || 0),
        approved: Number(c.approved || 0),
        rejected: Number(c.rejected || 0),
      });
    } else {
      failed.push(["Withdrawals", wc.reason]);
    }

    if (wl.status === "fulfilled") setWdRecent(getRows(wl.value).slice(0, 5));
    else failed.push(["Recent withdrawals", wl.reason]);

    if (pm.status === "fulfilled") setMethods(getRows(pm.value).filter(isCryptoMethod));
    else failed.push(["Payment methods", pm.reason]);

    if (st.status === "fulfilled") {
      const s = st.value?.data ?? st.value ?? {};
      setStats({
        ...EMPTY_STATS,
        ...s,
        registrations: { ...EMPTY_STATS.registrations, ...(s.registrations || {}) },
      });
    } else {
      failed.push(["Users", st.reason]);
    }

    if (failed.length) {
      setError(
        `${failed.map((f) => f[0]).join(", ")} could not be loaded. ${getErrorMessage(failed[0][1])}`
      );
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ---------- derived stats ---------- */

  const dep = useMemo(() => {
    const pending = deposits.filter((x) => statusOf(x) === "pending").length;
    const approved = deposits.filter((x) => statusOf(x) === "approved").length;
    const rejected = deposits.filter((x) => statusOf(x) === "rejected").length;
    const totalAmount = deposits.reduce((s, x) => s + amountOf(x), 0);
    const approvedAmount = deposits
      .filter((x) => statusOf(x) === "approved")
      .reduce((s, x) => s + amountOf(x), 0);
    return { total: deposits.length, pending, approved, rejected, totalAmount, approvedAmount };
  }, [deposits]);

  const pmStats = useMemo(() => {
    const active = methods.filter((x) => x.is_active).length;
    return { total: methods.length, active, disabled: methods.length - active };
  }, [methods]);

  const recentDeposits = useMemo(() => {
    return [...deposits]
      .sort((a, b) => {
        const A = new Date(a.created_at || a.createdAt || 0).getTime();
        const B = new Date(b.created_at || b.createdAt || 0).getTime();
        return B - A;
      })
      .slice(0, 5);
  }, [deposits]);

  /* last 10 days, including today */
  const days = useMemo(() => {
    const out = [];
    const today = new Date();
    for (let i = CHART_DAYS - 1; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      out.push({
        key: dayKey(d),
        highlight: i === 0,
        label: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
        sub: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        full: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        value: 0,
        amount: 0,
      });
    }
    const map = Object.fromEntries(out.map((d) => [d.key, d]));
    deposits.forEach((x) => {
      const raw = x.created_at || x.createdAt;
      if (!raw) return;
      const dt = new Date(raw);
      if (Number.isNaN(dt.getTime())) return;
      const slot = map[dayKey(dt)];
      if (slot) {
        slot.value += 1;
        slot.amount += amountOf(x);
      }
    });
    return out.map((d) => ({ ...d, extra: money(d.amount) }));
  }, [deposits]);

  const periodTotal = days.reduce((s, d) => s + d.value, 0);

  /* ---------- users & registrations ---------- */

  const reg = stats.registrations;

  const regPeriods = [
    { key: "today", label: "Today", full: "Registered today", value: reg.today, highlight: true },
    { key: "yesterday", label: "Yesterday", full: "Registered yesterday", value: reg.yesterday },
    { key: "week", label: "This week", full: "Registered this week", value: reg.this_week },
    { key: "month", label: "This month", full: "Registered this month", value: reg.this_month },
    { key: "m3", label: "3 months", full: "Registered in the last 3 months", value: reg.last_3_months },
    { key: "m6", label: "6 months", full: "Registered in the last 6 months", value: reg.last_6_months },
    { key: "y1", label: "1 year", full: "Registered in the last 1 year", value: reg.last_1_year },
  ];

  const notSubmitted = Math.max(
    0,
    stats.users - stats.verified - stats.pending_kyc - stats.rejected_kyc
  );

  const verifyData = [
    { label: "Verified", value: stats.verified, color: C_APPROVED },
    { label: "KYC pending", value: stats.pending_kyc, color: C_PENDING },
    { label: "KYC rejected", value: stats.rejected_kyc, color: C_REJECTED },
    { label: "Not submitted", value: notSubmitted, color: C_GREY },
  ];

  const accountData = [
    { label: "Active", value: stats.active, color: C_APPROVED },
    { label: "Banned", value: stats.banned, color: C_REJECTED },
  ];

  /* ---------- navigation ---------- */

  const open = (key) => {
    if (key === CURRENT_PAGE) {
      loadDashboard(true);
      return;
    }
    if (go) go(key);
  };

  const val = (n) => (loading ? <i className="ad-sk" /> : n);

  const userCards = [
    {
      label: "Total Users",
      value: num(stats.users),
      foot: `${num(stats.active)} active · ${num(stats.banned)} banned`,
      icon: ICON.user || ICON.doc,
      color: C_BLUE,
      bg: "#eaf3fc",
      to: "adminUsers",
    },
    {
      label: "Verified Users",
      value: num(stats.verified),
      foot: `${pct(stats.verified, stats.users)}% of all users`,
      icon: ICON.lock,
      color: C_APPROVED,
      bg: "#e3f6ee",
      to: "adminUsers",
    },
    {
      label: "Pending KYC",
      value: num(stats.pending_kyc),
      foot: "Waiting for admin review",
      icon: ICON.bell,
      color: "#c98a0a",
      bg: "#fdf3dc",
      to: "adminKyc",
    },
  ];

  const cards = [
    {
      label: "Total Deposits",
      value: dep.total,
      foot: `${dep.approved} approved · ${dep.rejected} rejected`,
      icon: ICON.doc,
      color: C_BLUE,
      bg: "#eaf3fc",
      to: "adminDeposits",
    },
    {
      label: "Pending Deposits",
      value: dep.pending,
      foot: "Waiting for admin review",
      icon: ICON.bell,
      color: "#c98a0a",
      bg: "#fdf3dc",
      to: "adminDeposits",
    },
    {
      label: "Total Withdrawals",
      value: wdCounts.all,
      foot: `${wdCounts.approved} approved · ${wdCounts.rejected} rejected`,
      icon: ICON.card,
      color: "#7c4dd8",
      bg: "#f0eafc",
      to: "adminWithdrawals",
    },
    {
      label: "Pending Withdrawals",
      value: wdCounts.pending,
      foot: "Waiting for admin review",
      icon: ICON.bell,
      color: C_REJECTED,
      bg: "#fdebee",
      to: "adminWithdrawals",
    },
    {
      label: "Payment Methods",
      value: pmStats.total,
      foot: `${pmStats.active} active · ${pmStats.disabled} disabled`,
      icon: ICON.lock,
      color: "#0e8fa3",
      bg: "#e2f5f8",
      to: "adminPaymentMethods",
    },
    {
      label: "Approved Deposit Amount",
      value: money(dep.approvedAmount),
      foot: "Sum of approved deposits",
      icon: ICON.trade,
      color: C_APPROVED,
      bg: "#e3f6ee",
      to: "adminDeposits",
      small: true,
    },
  ];

  const depData = [
    { label: "Pending", value: dep.pending, color: C_PENDING },
    { label: "Approved", value: dep.approved, color: C_APPROVED },
    { label: "Rejected", value: dep.rejected, color: C_REJECTED },
  ];

  const wdData = [
    { label: "Pending", value: wdCounts.pending, color: C_PENDING },
    { label: "Approved", value: wdCounts.approved, color: C_APPROVED },
    { label: "Rejected", value: wdCounts.rejected, color: C_REJECTED },
  ];

  const pmData = [
    { label: "Active", value: pmStats.active, color: C_APPROVED },
    { label: "Disabled", value: pmStats.disabled, color: C_GREY },
  ];

  const StatCard = (c) => (
    <button
      key={c.label}
      type="button"
      className="ad-stat"
      onClick={() => open(c.to)}
    >
      <div className="ad-stat-top">
        <span className="ad-stat-label">{c.label}</span>
        <span className="ad-stat-ic" style={{ color: c.color, background: c.bg }}>
          <Ic d={c.icon} s={19} />
        </span>
      </div>
      <div className="ad-stat-val" style={c.small ? { fontSize: 24 } : undefined}>
        {val(c.value)}
      </div>
      <div className="ad-stat-foot">{c.foot}</div>
    </button>
  );

  return (
    <div className="ad-wrap">
      <style>{CSS}</style>

      <div className="ad-body">
        {/* Sticky top bar */}
        <header className="ad-head">
          <div className="ad-head-in">
            <div className="ad-head-l">
              <div>
                <h3>Dashboard</h3>
                <small>Management overview</small>
              </div>
            </div>

            <div className="ad-actions">
              <button
                type="button"
                className="ad-btn refresh"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                aria-label="Refresh"
              >
                <Ic d={ICON.trade} s={16} />
                <span className="t">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <div className="ad-profile">
                <div className="ad-avatar">{initials}</div>
                <div className="ad-pinfo">
                  <b>{adminName}</b>
                  <small>{adminEmail}</small>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="ad-page">
          <section className="ad-title">
            <h1>Dashboard Overview</h1>
            <p>Welcome back, {adminName}. Here's your platform overview.</p>
          </section>

          {error && (
            <div className="ad-error">
              <span>{error}</span>
              <button type="button" className="ad-btn sm" onClick={() => loadDashboard(true)}>
                Try Again
              </button>
            </div>
          )}

          {/* ===== Users & registrations ===== */}
          <div className="ad-sec" style={{ marginTop: 0 }}>
            <h2>Users &amp; Registrations</h2>
            <small>{stats.timezone ? `Time zone: ${stats.timezone}` : "Live data"}</small>
          </div>

          <section className="ad-stats">{userCards.map(StatCard)}</section>

          <section className="ad-panel" style={{ marginTop: 16 }}>
            <div className="ad-ph">
              <h3>
                New Registrations
                <small>Users who signed up in each period</small>
              </h3>
              <span className="ad-pill blue">
                {loading ? "—" : `${num(reg.total || stats.users)} TOTAL`}
              </span>
            </div>
            <div className="ad-cb">
              <div className="ad-regs">
                <div className="ad-reg hi">
                  <small>Total registered</small>
                  <b>{loading ? "—" : num(reg.total || stats.users)}</b>
                </div>
                <div className="ad-reg">
                  <small>Today</small>
                  <b>{loading ? "—" : num(reg.today)}</b>
                </div>
                <div className="ad-reg">
                  <small>Yesterday</small>
                  <b>{loading ? "—" : num(reg.yesterday)}</b>
                </div>
                <div className="ad-reg">
                  <small>This week</small>
                  <b>{loading ? "—" : num(reg.this_week)}</b>
                </div>
                <div className="ad-reg">
                  <small>This month</small>
                  <b>{loading ? "—" : num(reg.this_month)}</b>
                </div>
                <div className="ad-reg">
                  <small>Last 3 months</small>
                  <b>{loading ? "—" : num(reg.last_3_months)}</b>
                </div>
                <div className="ad-reg">
                  <small>Last 6 months</small>
                  <b>{loading ? "—" : num(reg.last_6_months)}</b>
                </div>
                <div className="ad-reg">
                  <small>Last 1 year</small>
                  <b>{loading ? "—" : num(reg.last_1_year)}</b>
                </div>
              </div>
            </div>
          </section>

          <section className="ad-row2" style={{ marginTop: 16 }}>
            <div className="ad-panel">
              <div className="ad-ph">
                <h3>
                  Registration Chart
                  <small>New users by period (week, month and longer periods include earlier days)</small>
                </h3>
              </div>
              <div className="ad-cb">
                {loading ? (
                  <i className="ad-sk chart" />
                ) : (
                  <BarChart
                    items={regPeriods}
                    ariaLabel="New user registrations by period"
                    unit="new user(s)"
                    gradId="adreg"
                  />
                )}
              </div>
            </div>

            <div className="ad-panel">
              <div className="ad-ph">
                <h3>
                  User Verification
                  <small>KYC status of all users</small>
                </h3>
              </div>
              <div className="ad-cb">
                <Donut data={verifyData} centerTop={num(stats.users)} centerSub="Users" loading={loading} />
              </div>
            </div>
          </section>

          <section className="ad-row3" style={{ marginTop: 16 }}>
            <div className="ad-panel">
              <div className="ad-ph">
                <h3>
                  Account Status
                  <small>Active and banned users</small>
                </h3>
              </div>
              <div className="ad-cb">
                <Donut data={accountData} centerTop={num(stats.users)} centerSub="Users" loading={loading} />
              </div>
            </div>

            <div className="ad-panel" style={{ gridColumn: "span 2" }}>
              <div className="ad-ph">
                <h3>
                  User Summary
                  <small>Quick numbers</small>
                </h3>
                <span className="ad-pill blue">LIVE DATA</span>
              </div>
              <div className="ad-cb">
                <div className="ad-sum-row">
                  <span className="ad-sum-l"><i className="ad-dot" style={{ background: C_BLUE }} />Total users</span>
                  <b>{loading ? <i className="ad-sk" /> : num(stats.users)}</b>
                </div>
                <div className="ad-sum-row">
                  <span className="ad-sum-l"><i className="ad-dot" style={{ background: C_APPROVED }} />Verified users</span>
                  <b>{loading ? <i className="ad-sk" /> : num(stats.verified)}</b>
                </div>
                <div className="ad-sum-row">
                  <span className="ad-sum-l"><i className="ad-dot" style={{ background: C_PENDING }} />KYC pending</span>
                  <b>{loading ? <i className="ad-sk" /> : num(stats.pending_kyc)}</b>
                </div>
                <div className="ad-sum-row">
                  <span className="ad-sum-l"><i className="ad-dot" style={{ background: C_REJECTED }} />KYC rejected</span>
                  <b>{loading ? <i className="ad-sk" /> : num(stats.rejected_kyc)}</b>
                </div>
                <div className="ad-sum-row" style={{ borderBottom: 0 }}>
                  <span className="ad-sum-l"><i className="ad-dot" style={{ background: "#7c4dd8" }} />Admins</span>
                  <b>{loading ? <i className="ad-sk" /> : num(stats.admins)}</b>
                </div>
              </div>
            </div>
          </section>

          {/* ===== Statistics ===== */}
          <div className="ad-sec">
            <h2>Deposits &amp; Withdrawals</h2>
            <small>Live data</small>
          </div>

          <section className="ad-stats">{cards.map(StatCard)}</section>

          {/* Charts */}
          <div className="ad-sec">
            <h2>Statistics &amp; Charts</h2>
            <small>Live data</small>
          </div>

          <section className="ad-row2">
            <div className="ad-panel">
              <div className="ad-ph">
                <h3>
                  Deposit Activity
                  <small>Requests received in the last {CHART_DAYS} days (including today)</small>
                </h3>
                <span className="ad-pill blue">
                  {loading ? "—" : `${periodTotal} IN ${CHART_DAYS} DAYS`}
                </span>
              </div>
              <div className="ad-cb">
                {loading ? (
                  <i className="ad-sk chart" />
                ) : (
                  <BarChart
                    items={days}
                    ariaLabel={`Deposit requests in the last ${days.length} days`}
                    gradId="addep"
                  />
                )}
              </div>
            </div>

            <div className="ad-panel">
              <div className="ad-ph">
                <h3>
                  Deposit Status
                  <small>Share of all deposit requests</small>
                </h3>
              </div>
              <div className="ad-cb">
                <Donut data={depData} centerTop={dep.total} centerSub="Deposits" loading={loading} />
              </div>
            </div>
          </section>

          <section className="ad-row3" style={{ marginTop: 16 }}>
            <div className="ad-panel">
              <div className="ad-ph">
                <h3>
                  Withdrawal Status
                  <small>Share of all withdrawals</small>
                </h3>
              </div>
              <div className="ad-cb">
                <Donut data={wdData} centerTop={wdCounts.all} centerSub="Withdrawals" loading={loading} />
              </div>
            </div>

            <div className="ad-panel">
              <div className="ad-ph">
                <h3>
                  Deposits vs Withdrawals
                  <small>Requests by status</small>
                </h3>
              </div>
              <div className="ad-cb">
                <Compare dep={dep} wd={wdCounts} loading={loading} />
              </div>
            </div>

            <div className="ad-panel">
              <div className="ad-ph">
                <h3>
                  Payment Methods
                  <small>Crypto wallets configured</small>
                </h3>
              </div>
              <div className="ad-cb">
                <Donut data={pmData} centerTop={pmStats.total} centerSub="Methods" loading={loading} />
              </div>
            </div>
          </section>

          {/* System overview */}
          <div className="ad-sec">
            <h2>Overview</h2>
            <small>System summary</small>
          </div>

          <section className="ad-panel">
            <div className="ad-ph">
              <h3>System Summary</h3>
              <span className="ad-pill blue">LIVE DATA</span>
            </div>

            <div className="ad-cb">
              <div className="ad-sumgrid">
                <div>
                  <div className="ad-sum-row">
                    <span className="ad-sum-l"><i className="ad-dot" style={{ background: C_PENDING }} />Pending deposits</span>
                    <b>{val(dep.pending)}</b>
                  </div>
                  <div className="ad-sum-row">
                    <span className="ad-sum-l"><i className="ad-dot" style={{ background: "#7c4dd8" }} />Pending withdrawals</span>
                    <b>{val(wdCounts.pending)}</b>
                  </div>
                  <div className="ad-sum-row">
                    <span className="ad-sum-l"><i className="ad-dot" style={{ background: C_APPROVED }} />Active payment methods</span>
                    <b>{val(pmStats.active)}</b>
                  </div>
                  <div className="ad-sum-row" style={{ borderBottom: 0 }}>
                    <span className="ad-sum-l"><i className="ad-dot" style={{ background: C_BLUE }} />Deposit approval rate</span>
                    <b>{loading ? <i className="ad-sk" /> : `${pct(dep.approved, dep.approved + dep.rejected)}%`}</b>
                  </div>
                </div>

                <div className="ad-total">
                  <span>Total Requested Deposit Amount</span>
                  <b className="ad-mono">{loading ? "—" : money(dep.totalAmount)}</b>
                  <small>Sum of request amounts returned by the API</small>
                </div>
              </div>
            </div>
          </section>

          {/* Recent requests */}
          <div className="ad-sec">
            <h2>Recent Activity</h2>
            <small>Latest requests</small>
          </div>

          <RecentList
            rows={recentDeposits}
            loading={loading}
            onAll={() => open("adminDeposits")}
            title="Recent Deposit Requests"
            subtitle="Newest 5 deposits"
          />

          <RecentList
            rows={wdRecent}
            loading={loading}
            onAll={() => open("adminWithdrawals")}
            title="Recent Withdrawal Requests"
            subtitle="Newest 5 withdrawals"
          />

          <div className="ad-foot">Trading Admin Panel · Secure Management</div>
        </main>
      </div>
    </div>
  );
}
