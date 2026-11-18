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
   Admin Dashboard  (light theme, sidebar, mobile drawer, charts)
   APIs:
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
  --side-w: 268px;
  --shadow: 0 1px 2px rgba(16,30,54,.04), 0 6px 20px rgba(16,30,54,.05);
  --shadow-hover: 0 2px 4px rgba(16,30,54,.05), 0 12px 28px rgba(16,30,54,.09);

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  overflow-x: hidden;
}
.ad-wrap button { font-family: inherit; cursor: pointer; -webkit-appearance: none; appearance: none; }
.ad-wrap button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* ---------- sidebar ---------- */
.ad-side {
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 60;
  width: var(--side-w);
  display: flex; flex-direction: column;
  background: #0f1b30;
  color: #cbd5e6;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.ad-side-top {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 18px 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.ad-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ad-brand-icon {
  width: 42px; height: 42px; flex: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; display: grid; place-items: center;
  font-size: 20px; font-weight: 800;
  box-shadow: 0 6px 16px rgba(40,125,225,.35);
}
.ad-brand h2 { margin: 0; font-size: 16.5px; font-weight: 800; letter-spacing: -.2px; color: #fff; }
.ad-brand p { margin: 2px 0 0; font-size: 11.5px; color: #8a97ad; }
.ad-side-close {
  display: none; width: 36px; height: 36px; flex: none;
  border: 0; border-radius: 10px;
  background: rgba(255,255,255,.08); color: #fff;
  font-size: 18px; line-height: 1;
}

.ad-side-scroll { flex: 1; overflow-y: auto; padding: 14px 12px; }
.ad-side-scroll::-webkit-scrollbar { width: 6px; }
.ad-side-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 6px; }
.ad-side-label { padding: 8px 10px 8px; font-size: 11.5px; color: #78859b; font-weight: 600; }

.ad-nav-item {
  width: 100%; display: flex; align-items: center; gap: 12px;
  min-height: 46px; padding: 0 12px; margin-bottom: 3px;
  border: 0; border-radius: 11px;
  background: transparent; color: #cbd5e6;
  font-size: 13.5px; font-weight: 600; text-align: left;
  transition: background .15s, color .15s;
}
.ad-nav-item:hover { background: rgba(255,255,255,.07); color: #fff; }
.ad-nav-item.on {
  background: linear-gradient(135deg, rgba(31,186,208,.22), rgba(42,125,225,.28));
  color: #fff;
  box-shadow: inset 3px 0 0 #3aa0f0;
}
.ad-nav-ic {
  width: 32px; height: 32px; flex: none; border-radius: 9px;
  background: rgba(255,255,255,.06);
  display: grid; place-items: center;
}
.ad-nav-item.on .ad-nav-ic { background: rgba(255,255,255,.14); }
.ad-nav-tx { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-badge {
  flex: none; min-width: 22px; height: 22px; padding: 0 7px;
  border-radius: 999px; background: #e0a416; color: #1b1300;
  font-size: 11.5px; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center;
}

.ad-side-foot {
  padding: 12px; border-top: 1px solid rgba(255,255,255,.07);
}
.ad-side-user {
  display: flex; align-items: center; gap: 10px;
  padding: 8px; border-radius: 12px; background: rgba(255,255,255,.05);
  margin-bottom: 10px; min-width: 0;
}
.ad-avatar {
  width: 36px; height: 36px; flex: none; border-radius: 50%;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; display: grid; place-items: center;
  font-size: 14px; font-weight: 800;
}
.ad-pinfo { min-width: 0; line-height: 1.25; }
.ad-pinfo b { display: block; font-size: 12.5px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-pinfo small { display: block; font-size: 11px; color: #8a97ad; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-logout {
  width: 100%; min-height: 42px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid rgba(255,107,129,.35); border-radius: 11px;
  background: rgba(224,65,95,.12); color: #ff8ea1;
  font-size: 13px; font-weight: 700;
  transition: background .15s;
}
.ad-logout:hover { background: rgba(224,65,95,.22); }

.ad-overlay {
  display: none; position: fixed; inset: 0; z-index: 55;
  background: rgba(10,18,32,.5);
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
}

/* ---------- main area ---------- */
.ad-main { margin-left: var(--side-w); min-width: 0; }

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
.ad-menu-btn {
  display: none; width: 42px; height: 42px; flex: none;
  border: 1px solid var(--line); border-radius: 11px;
  background: var(--surface); color: var(--text);
  place-items: center;
}
.ad-menu-btn:active { transform: scale(.95); }
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
.ad-profile .ad-pinfo b { color: var(--text); max-width: 170px; }
.ad-profile .ad-pinfo small { color: var(--muted); max-width: 170px; }
.ad-profile .ad-avatar { width: 34px; height: 34px; }

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
.ad-pb { padding: 16px; }
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

/* ---------- tablet ---------- */
@media (max-width: 1280px) {
  .ad-row3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 1100px) {
  .ad-row2 { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .ad-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ad-sumgrid { grid-template-columns: 1fr; }
}

/* ---------- mobile / drawer (sidebar hidden, 3-dot opens it) ---------- */
@media (max-width: 960px) {
  .ad-side {
    transform: translateX(-102%);
    transition: transform .26s ease;
    box-shadow: none;
    width: min(300px, 86vw);
  }
  .ad-side.open { transform: translateX(0); box-shadow: 8px 0 40px rgba(10,18,32,.35); }
  .ad-side-close { display: grid; place-items: center; }
  .ad-overlay.open { display: block; }
  .ad-main { margin-left: 0; }
  .ad-menu-btn { display: grid; }
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
  .ad-pb { padding: 12px; }
  .ad-cb { padding: 14px 14px 16px; }

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

/* All admin pages (sidebar) */
const ADMIN_LINKS = [
  { key: "admin", label: "Dashboard", icon: ICON.trade },
  { key: "adminUsers", label: "Users", icon: ICON.eye },
  { key: "adminKyc", label: "KYC", icon: ICON.lock },
  { key: "adminDeposits", label: "Deposits", icon: ICON.doc },
  { key: "adminWithdrawals", label: "Withdrawals", icon: ICON.card },
  { key: "adminPaymentMethods", label: "Payment Methods", icon: ICON.card },
  { key: "adminOptions", label: "Options", icon: ICON.eye },
];

const CURRENT_PAGE = "admin";
const CHART_DAYS = 10;

const C_PENDING = "#e0a416";
const C_APPROVED = GREEN || "#0e9f6e";
const C_REJECTED = RED || "#e0415f";
const C_BLUE = BLUE || "#1f7acb";

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

function ActivityChart({ days }) {
  const W = 680;
  const H = 240;
  const pl = 34;
  const pr = 10;
  const pt = 18;
  const pb = 38;
  const iw = W - pl - pr;
  const ih = H - pt - pb;

  const maxCount = Math.max(0, ...days.map((d) => d.count));
  const step = Math.max(1, Math.ceil(maxCount / 4));
  const yMax = step * 4;

  const slot = iw / days.length;
  const bw = Math.min(34, slot * 0.6);

  return (
    <svg className="ad-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Deposit requests in the last ${days.length} days`}>
      <defs>
        <linearGradient id="adbar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a7de1" />
          <stop offset="100%" stopColor="#1fbad0" />
        </linearGradient>
        <linearGradient id="adbarToday" x1="0" y1="0" x2="0" y2="1">
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

      {days.map((d, i) => {
        const h = yMax > 0 ? (d.count / yMax) * ih : 0;
        const x = pl + slot * i + (slot - bw) / 2;
        const y = pt + ih - h;
        return (
          <g key={d.key}>
            <rect
              className="ad-bar"
              x={x}
              y={d.count > 0 ? y : pt + ih - 2}
              width={bw}
              height={d.count > 0 ? h : 2}
              rx="6"
              fill={d.count > 0 ? (d.today ? "url(#adbarToday)" : "url(#adbar)") : "#e3e8f0"}
            >
              <title>{`${d.full}: ${d.count} request(s), ${money(d.amount)}`}</title>
            </rect>
            {d.count > 0 && (
              <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#0f1b30">
                {d.count}
              </text>
            )}
            <text
              x={x + bw / 2}
              y={H - 19}
              textAnchor="middle"
              fontSize="11.5"
              fill={d.today ? "#7c4dd8" : "#4a5568"}
              fontWeight={d.today ? "800" : "600"}
            >
              {d.label}
            </text>
            <text x={x + bw / 2} y={H - 5} textAnchor="middle" fontSize="10" fill="#9aa5b8">
              {d.sub}
            </text>
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sideOpen, setSideOpen] = useState(false);

  const adminName =
    me?.full_name || me?.name || me?.username || me?.email || "Administrator";
  const adminEmail = me?.email || "Admin Account";
  const initials = String(adminName).trim().charAt(0).toUpperCase() || "A";

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    const [dep, wc, wl, pm] = await Promise.allSettled([
      api("/admin/deposits"),
      api("/admin/withdraws/counts"),
      api("/admin/withdraws?status=all&page=1&size=5"),
      api("/admin/payment-methods"),
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

  /* close drawer with Escape, lock page scroll while it is open (mobile) */
  useEffect(() => {
    if (!sideOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setSideOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sideOpen]);

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
        today: i === 0,
        label: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
        sub: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        full: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        count: 0,
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
        slot.count += 1;
        slot.amount += amountOf(x);
      }
    });
    return out;
  }, [deposits]);

  const periodTotal = days.reduce((s, d) => s + d.count, 0);

  /* ---------- navigation ---------- */

  const open = (key) => {
    setSideOpen(false);
    if (key === CURRENT_PAGE) {
      loadDashboard(true);
      return;
    }
    if (go) go(key);
  };

  const badgeFor = (key) => {
    if (loading) return 0;
    if (key === "adminDeposits") return dep.pending;
    if (key === "adminWithdrawals") return wdCounts.pending;
    return 0;
  };

  const val = (n) => (loading ? <i className="ad-sk" /> : n);

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
    { label: "Disabled", value: pmStats.disabled, color: "#a3adbd" },
  ];

  return (
    <div className="ad-wrap">
      <style>{CSS}</style>

      {/* Mobile overlay */}
      <div
        className={"ad-overlay" + (sideOpen ? " open" : "")}
        onClick={() => setSideOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar (always visible on desktop, drawer on mobile) */}
      <aside className={"ad-side" + (sideOpen ? " open" : "")} aria-label="Admin navigation">
        <div className="ad-side-top">
          <div className="ad-brand">
            <div className="ad-brand-icon">C</div>
            <div>
              <h2>Trading Admin</h2>
              <p>Management Dashboard</p>
            </div>
          </div>
          <button
            type="button"
            className="ad-side-close"
            onClick={() => setSideOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="ad-side-scroll">
          <div className="ad-side-label">Menu</div>
          <nav>
            {ADMIN_LINKS.map((link) => {
              const badge = badgeFor(link.key);
              return (
                <button
                  key={link.key}
                  type="button"
                  className={"ad-nav-item" + (link.key === CURRENT_PAGE ? " on" : "")}
                  onClick={() => open(link.key)}
                >
                  <span className="ad-nav-ic"><Ic d={link.icon} s={17} /></span>
                  <span className="ad-nav-tx">{link.label}</span>
                  {badge > 0 && <span className="ad-badge">{badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="ad-side-foot">
          <div className="ad-side-user">
            <div className="ad-avatar">{initials}</div>
            <div className="ad-pinfo">
              <b>{adminName}</b>
              <small>{adminEmail}</small>
            </div>
          </div>
          <button type="button" className="ad-logout" onClick={() => logout?.()}>
            <Ic d={ICON.lock} s={15} />
            Logout
          </button>
        </div>
      </aside>

      <div className="ad-main">
        {/* Sticky top bar */}
        <header className="ad-head">
          <div className="ad-head-in">
            <div className="ad-head-l">
              <button
                type="button"
                className="ad-menu-btn"
                onClick={() => setSideOpen((v) => !v)}
                aria-label={sideOpen ? "Hide menu" : "Open menu"}
                aria-expanded={sideOpen}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
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

          {/* Statistics */}
          <section className="ad-stats">
            {cards.map((c) => (
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
            ))}
          </section>

          {/* Charts */}
          <div className="ad-sec">
            <h2>Statistics & Charts</h2>
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
                {loading ? <i className="ad-sk chart" /> : <ActivityChart days={days} />}
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
