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
   Admin Dashboard  (light theme, mobile + desktop responsive)
   API: GET /admin/deposits
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
  --primary-dark: #1768ad;
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
  overflow-x: hidden;
}

.ad-wrap button { font-family: inherit; cursor: pointer; -webkit-appearance: none; appearance: none; }

/* ---------- sticky header ---------- */
.ad-head {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(255,255,255,.92);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
  padding-top: env(safe-area-inset-top, 0px);
}
.ad-head-in {
  max-width: 1320px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.ad-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ad-brand-icon {
  width: 42px; height: 42px; flex: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff;
  display: grid; place-items: center;
  font-size: 20px; font-weight: 800;
  box-shadow: 0 6px 16px rgba(40,125,225,.30);
}
.ad-brand h2 { margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -.2px; }
.ad-brand p { margin: 2px 0 0; font-size: 12px; color: var(--muted); }

.ad-actions { display: flex; align-items: center; gap: 10px; }

.ad-btn {
  min-height: 42px;
  padding: 0 16px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px; font-weight: 650;
  white-space: nowrap;
  transition: border-color .15s, background .15s, transform .1s;
}
.ad-btn:hover { border-color: #c7d3e4; background: #f8fafd; }
.ad-btn:active { transform: scale(.97); }
.ad-btn:disabled { opacity: .55; cursor: not-allowed; }
.ad-btn.ghost-danger { color: var(--bad); }
.ad-btn.ghost-danger:hover { background: var(--bad-soft); border-color: #f4c5cd; }
.ad-btn.sm { min-height: 36px; padding: 0 12px; font-size: 12px; }

.ad-profile {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 14px 5px 5px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  min-width: 0;
}
.ad-avatar {
  width: 34px; height: 34px; flex: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff;
  display: grid; place-items: center;
  font-size: 14px; font-weight: 800;
}
.ad-pinfo { min-width: 0; line-height: 1.25; }
.ad-pinfo b { display: block; font-size: 12.5px; font-weight: 700; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-pinfo small { display: block; font-size: 11px; color: var(--muted); max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---------- nav tabs ---------- */
.ad-nav-wrap { border-top: 1px solid var(--line-soft); background: var(--surface); }
.ad-nav {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex; gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.ad-nav::-webkit-scrollbar { display: none; }
.ad-tab {
  flex: none;
  display: inline-flex; align-items: center; gap: 8px;
  min-height: 48px;
  padding: 0 16px;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--text-2);
  font-size: 13.5px; font-weight: 650;
  white-space: nowrap;
  transition: color .15s, border-color .15s, background .15s;
}
.ad-tab:hover { color: var(--text); background: #f6f8fc; }
.ad-tab.on { color: var(--primary); border-bottom-color: var(--primary); }

/* ---------- page ---------- */
.ad-page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 26px 24px calc(34px + env(safe-area-inset-bottom, 0px));
}
.ad-title { margin-bottom: 22px; }
.ad-title h1 { margin: 0 0 6px; font-size: 26px; line-height: 1.2; font-weight: 800; letter-spacing: -.5px; }
.ad-title p { margin: 0; font-size: 14px; color: var(--muted); }

.ad-error {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  margin-bottom: 18px;
  padding: 13px 16px;
  border: 1px solid #f4c5cd;
  border-radius: 12px;
  background: var(--bad-soft);
  color: #b3243f;
  font-size: 13px;
}

/* ---------- stat cards ---------- */
.ad-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.ad-stat {
  position: relative;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
  text-align: left;
  color: inherit;
  min-width: 0;
  transition: box-shadow .18s, transform .18s, border-color .18s;
}
.ad-stat:hover { box-shadow: var(--shadow-hover); border-color: #d3dcea; transform: translateY(-1px); }
.ad-stat:active { transform: scale(.98); }
.ad-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ad-stat-label { font-size: 13px; font-weight: 600; color: var(--text-2); }
.ad-stat-ic {
  width: 40px; height: 40px; flex: none;
  border-radius: 12px;
  display: grid; place-items: center;
}
.ad-stat-val { margin-top: 16px; font-size: 32px; line-height: 1; font-weight: 800; letter-spacing: -1px; }
.ad-stat-foot { margin-top: 8px; font-size: 12px; color: var(--muted); }

/* ---------- panels ---------- */
.ad-grid2 {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr);
  gap: 16px;
  align-items: start;
}
.ad-panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
  overflow: hidden;
  min-width: 0;
}
.ad-ph {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 17px 20px;
  border-bottom: 1px solid var(--line-soft);
}
.ad-ph h3 { margin: 0; font-size: 15.5px; font-weight: 750; letter-spacing: -.1px; }
.ad-pb { padding: 16px; }

.ad-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10.5px; font-weight: 800; letter-spacing: .3px;
  white-space: nowrap;
}
.ad-pill.ok   { background: var(--ok-soft);   color: var(--ok); }
.ad-pill.warn { background: var(--warn-soft); color: var(--warn); }
.ad-pill.bad  { background: var(--bad-soft);  color: var(--bad); }
.ad-pill.blue { background: var(--primary-soft); color: var(--primary); }

/* quick actions */
.ad-quick-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.ad-quick {
  display: flex; align-items: center; gap: 12px;
  width: 100%;
  min-height: 68px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: #fbfcfe;
  color: var(--text);
  text-align: left;
  transition: border-color .15s, background .15s, transform .1s;
}
.ad-quick:hover { border-color: #b9d3ee; background: var(--primary-soft); }
.ad-quick:active { transform: scale(.98); }
.ad-quick-ic {
  width: 40px; height: 40px; flex: none;
  border-radius: 11px;
  background: var(--primary-soft);
  color: var(--primary);
  display: grid; place-items: center;
}
.ad-quick-tx { flex: 1; min-width: 0; }
.ad-quick-tx b { display: block; font-size: 13.5px; font-weight: 700; }
.ad-quick-tx small {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 3px;
  font-size: 11.5px; line-height: 1.4;
  color: var(--muted);
}
.ad-chev { flex: none; color: #a3adbd; font-size: 22px; line-height: 1; }
.ad-quick.danger .ad-quick-ic { background: var(--bad-soft); color: var(--bad); }
.ad-quick.danger:hover { background: var(--bad-soft); border-color: #f4c5cd; }

/* summary */
.ad-sum { display: grid; gap: 4px; }
.ad-sum-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 13px 4px;
  border-bottom: 1px solid var(--line-soft);
  font-size: 13.5px;
}
.ad-sum-l { display: flex; align-items: center; gap: 10px; color: var(--text-2); }
.ad-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
.ad-sum-row b { font-weight: 800; font-size: 14.5px; }
.ad-total {
  margin-top: 12px;
  padding: 16px;
  border-radius: 13px;
  background: linear-gradient(135deg, #eaf6fb, #e8f0fc);
}
.ad-total span { display: block; font-size: 12px; font-weight: 600; color: var(--text-2); }
.ad-total b { display: block; margin-top: 6px; font-size: 26px; font-weight: 800; letter-spacing: -.6px; }
.ad-total small { display: block; margin-top: 6px; font-size: 11.5px; color: var(--muted); }

/* recent deposits */
.ad-recent { margin-top: 16px; }
.ad-table-wrap { overflow-x: auto; }
.ad-table { width: 100%; border-collapse: collapse; }
.ad-table th {
  padding: 12px 20px;
  text-align: left;
  font-size: 11px; font-weight: 700; letter-spacing: .4px;
  color: var(--muted);
  background: #f8fafd;
  border-bottom: 1px solid var(--line-soft);
  white-space: nowrap;
}
.ad-table td {
  padding: 14px 20px;
  font-size: 13px;
  border-bottom: 1px solid var(--line-soft);
  vertical-align: middle;
}
.ad-table tbody tr:last-child td { border-bottom: 0; }
.ad-table tbody tr:hover td { background: #fafbfe; }
.ad-mono { font-variant-numeric: tabular-nums; }
.ad-user { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* mobile list version of recent deposits */
.ad-cards { display: none; }
.ad-dep {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line-soft);
}
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

.ad-spin { animation: adspin 1s linear infinite; }
@keyframes adspin { to { transform: rotate(360deg); } }

/* skeleton */
.ad-sk {
  display: inline-block; width: 46px; height: 28px; border-radius: 8px;
  background: linear-gradient(90deg, #eef1f6, #f6f8fb, #eef1f6);
  background-size: 200% 100%;
  animation: adsk 1.2s ease-in-out infinite;
}
@keyframes adsk { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ---------- tablet ---------- */
@media (max-width: 1050px) {
  .ad-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ad-grid2 { grid-template-columns: 1fr; }
}

/* ---------- mobile ---------- */
@media (max-width: 680px) {
  .ad-head-in { padding: 10px 14px; gap: 10px; }
  .ad-brand-icon { width: 38px; height: 38px; font-size: 18px; border-radius: 11px; }
  .ad-brand h2 { font-size: 15.5px; }
  .ad-brand p { display: none; }

  .ad-actions { gap: 8px; }
  .ad-btn.refresh span.t { display: none; }
  .ad-btn.refresh { width: 42px; padding: 0; }
  .ad-btn.logout span.t { display: none; }
  .ad-btn.logout { width: 42px; padding: 0; }
  .ad-pinfo { display: none; }
  .ad-profile { padding: 4px; }

  .ad-nav { padding: 0 8px; gap: 2px; }
  .ad-tab { padding: 0 13px; min-height: 46px; font-size: 13px; }

  .ad-page { padding: 18px 14px calc(28px + env(safe-area-inset-bottom, 0px)); }
  .ad-title { margin-bottom: 16px; }
  .ad-title h1 { font-size: 22px; }
  .ad-title p { font-size: 13px; }

  .ad-stats { gap: 10px; margin-bottom: 14px; }
  .ad-stat { padding: 14px; border-radius: 14px; }
  .ad-stat-label { font-size: 12px; }
  .ad-stat-ic { width: 34px; height: 34px; border-radius: 10px; }
  .ad-stat-val { margin-top: 12px; font-size: 26px; }
  .ad-stat-foot { font-size: 11px; }

  .ad-grid2 { gap: 12px; }
  .ad-ph { padding: 14px 16px; }
  .ad-ph h3 { font-size: 15px; }
  .ad-pb { padding: 12px; }
  .ad-quick-list { grid-template-columns: 1fr; }

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

/* All admin pages (used by the top nav + quick actions) */
const ADMIN_LINKS = [
  {
    key: "admin",
    label: "Dashboard",
    icon: ICON.trade,
    title: "Dashboard",
    desc: "Platform overview and statistics",
  },
  {
    key: "adminUsers",
    label: "Users",
    icon: ICON.eye,
    title: "User List",
    desc: "Search, edit, disable users and change passwords",
  },
  {
    key: "adminKyc",
    label: "KYC",
    icon: ICON.lock,
    title: "KYC Requests",
    desc: "Review, approve and reject identity documents",
  },
  {
    key: "adminDeposits",
    label: "Deposits",
    icon: ICON.doc,
    title: "Deposit Requests",
    desc: "Review, approve and reject user deposits",
  },
  {
    key: "adminWithdrawals",
    label: "Withdrawals",
    icon: ICON.card,
    title: "Withdrawal Requests",
    desc: "Review, approve and reject user withdrawals",
  },
  {
    key: "adminPaymentMethods",
    label: "Payment Methods",
    icon: ICON.card,
    title: "Payment Methods",
    desc: "Manage crypto, bKash, Nagad and bank methods",
  },
  {
    key: "adminOptions",
    label: "Options",
    icon: ICON.eye,
    title: "Options",
    desc: "Manage trading options and platform settings",
  },
];

const CURRENT_PAGE = "admin";

const getRows = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.deposits)) return data.deposits;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const statusOf = (item) =>
  String(item?.status || "pending").toLowerCase();

const amountOf = (item) =>
  Number(
    item?.amount ??
    item?.requested_amount ??
    item?.amount_bdt ??
    0
  );

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
  if (err?.message === "unauthorized") {
    return "Admin authorization failed. Please login again.";
  }
  if (err?.message === "neterr") {
    return "Network error. Please check your internet connection.";
  }
  return err?.message || "Could not load dashboard data. Please check the API.";
};

const badgeOf = (status) =>
  status === "approved" ? "ok" : status === "rejected" ? "bad" : "warn";

export default function Admin_Dashbord({ me, go, logout }) {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const adminName =
    me?.full_name ||
    me?.name ||
    me?.username ||
    me?.email ||
    "Administrator";

  const adminEmail = me?.email || "Admin Account";

  const initials =
    String(adminName).trim().charAt(0).toUpperCase() || "A";

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const result = await api("/admin/deposits");
      setDeposits(getRows(result));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const pending = deposits.filter((x) => statusOf(x) === "pending");
    const approved = deposits.filter((x) => statusOf(x) === "approved");
    const rejected = deposits.filter((x) => statusOf(x) === "rejected");

    const totalAmount = deposits.reduce(
      (sum, item) => sum + amountOf(item),
      0
    );

    return {
      total: deposits.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      totalAmount,
    };
  }, [deposits]);

  const recent = useMemo(() => {
    return [...deposits]
      .sort((a, b) => {
        const dateA = new Date(
          a.created_at || a.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b.created_at || b.createdAt || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [deposits]);

  const open = (key) => {
    if (key === CURRENT_PAGE) {
      loadDashboard(true);
      return;
    }
    if (go) go(key);
  };

  const goDeposits = () => open("adminDeposits");

  const quickLinks = ADMIN_LINKS.filter((l) => l.key !== CURRENT_PAGE);

  const val = (n) => (loading ? <i className="ad-sk" /> : n);

  const cards = [
    {
      label: "Total Requests",
      value: stats.total,
      foot: "All deposit submissions",
      icon: ICON.doc,
      color: BLUE,
      bg: "#eaf3fc",
    },
    {
      label: "Pending",
      value: stats.pending,
      foot: "Waiting for review",
      icon: ICON.bell,
      color: "#c98a0a",
      bg: "#fdf3dc",
    },
    {
      label: "Approved",
      value: stats.approved,
      foot: "Successfully approved",
      icon: ICON.eye,
      color: GREEN,
      bg: "#e3f6ee",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      foot: "Rejected submissions",
      icon: ICON.lock,
      color: RED,
      bg: "#fdebee",
    },
  ];

  return (
    <div className="ad-wrap">
      <style>{CSS}</style>

      {/* Sticky header + navigation */}
      <header className="ad-head">
        <div className="ad-head-in">
          <div className="ad-brand">
            <div className="ad-brand-icon">C</div>
            <div>
              <h2>Trading Admin</h2>
              <p>Management Dashboard</p>
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
              <span className="t">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            <div className="ad-profile">
              <div className="ad-avatar">{initials}</div>
              <div className="ad-pinfo">
                <b>{adminName}</b>
                <small>{adminEmail}</small>
              </div>
            </div>

            <button
              type="button"
              className="ad-btn ghost-danger logout"
              onClick={() => logout?.()}
              aria-label="Logout"
            >
              <Ic d={ICON.lock} s={15} />
              <span className="t">Logout</span>
            </button>
          </div>
        </div>

        <div className="ad-nav-wrap">
          <nav className="ad-nav">
            {ADMIN_LINKS.map((link) => (
              <button
                key={link.key}
                type="button"
                className={"ad-tab" + (link.key === CURRENT_PAGE ? " on" : "")}
                onClick={() => open(link.key)}
              >
                <Ic d={link.icon} s={16} />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="ad-page">

        {/* Page title */}
        <section className="ad-title">
          <h1>Dashboard Overview</h1>
          <p>Welcome back, {adminName}. Here's your platform overview.</p>
        </section>

        {error && (
          <div className="ad-error">
            <span>{error}</span>
            <button
              type="button"
              className="ad-btn sm"
              onClick={() => loadDashboard(true)}
            >
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
              onClick={goDeposits}
            >
              <div className="ad-stat-top">
                <span className="ad-stat-label">{c.label}</span>
                <span
                  className="ad-stat-ic"
                  style={{ color: c.color, background: c.bg }}
                >
                  <Ic d={c.icon} s={19} />
                </span>
              </div>
              <div className="ad-stat-val">{val(c.value)}</div>
              <div className="ad-stat-foot">{c.foot}</div>
            </button>
          ))}
        </section>

        {/* Main panels */}
        <section className="ad-grid2">

          {/* Quick actions */}
          <div className="ad-panel">
            <div className="ad-ph">
              <h3>Admin Management</h3>
              <span className="ad-pill ok">ADMIN</span>
            </div>

            <div className="ad-pb">
              <div className="ad-quick-list">

                {quickLinks.map((link) => (
                  <button
                    key={link.key}
                    type="button"
                    className="ad-quick"
                    onClick={() => open(link.key)}
                  >
                    <span className="ad-quick-ic">
                      <Ic d={link.icon} s={20} />
                    </span>
                    <span className="ad-quick-tx">
                      <b>{link.title}</b>
                      <small>{link.desc}</small>
                    </span>
                    <span className="ad-chev">›</span>
                  </button>
                ))}

                <button
                  type="button"
                  className="ad-quick"
                  onClick={() => loadDashboard(true)}
                >
                  <span className="ad-quick-ic">
                    <Ic d={ICON.trade} s={20} />
                  </span>
                  <span className="ad-quick-tx">
                    <b>Refresh Statistics</b>
                    <small>Load the latest deposit request data</small>
                  </span>
                  <span className="ad-chev">›</span>
                </button>

                <button
                  type="button"
                  className="ad-quick danger"
                  onClick={() => logout?.()}
                >
                  <span className="ad-quick-ic">
                    <Ic d={ICON.lock} s={20} />
                  </span>
                  <span className="ad-quick-tx">
                    <b>Logout</b>
                    <small>Sign out from the admin panel</small>
                  </span>
                  <span className="ad-chev">›</span>
                </button>

              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="ad-panel">
            <div className="ad-ph">
              <h3>Deposit Summary</h3>
              <span className="ad-pill blue">LIVE DATA</span>
            </div>

            <div className="ad-pb">
              <div className="ad-sum">

                <div className="ad-sum-row">
                  <span className="ad-sum-l">
                    <i className="ad-dot" style={{ background: "#e0a416" }} />
                    Pending
                  </span>
                  <b>{val(stats.pending)}</b>
                </div>

                <div className="ad-sum-row">
                  <span className="ad-sum-l">
                    <i className="ad-dot" style={{ background: GREEN }} />
                    Approved
                  </span>
                  <b>{val(stats.approved)}</b>
                </div>

                <div className="ad-sum-row">
                  <span className="ad-sum-l">
                    <i className="ad-dot" style={{ background: RED }} />
                    Rejected
                  </span>
                  <b>{val(stats.rejected)}</b>
                </div>

                <div className="ad-sum-row" style={{ borderBottom: 0 }}>
                  <span className="ad-sum-l">
                    <i className="ad-dot" style={{ background: BLUE }} />
                    Total Requests
                  </span>
                  <b>{val(stats.total)}</b>
                </div>

              </div>

              <div className="ad-total">
                <span>Total Requested Amount</span>
                <b className="ad-mono">
                  {loading ? "—" : money(stats.totalAmount)}
                </b>
                <small>Sum of request amounts returned by the API</small>
              </div>
            </div>
          </div>

        </section>

        {/* Recent deposits */}
        <section className="ad-panel ad-recent">
          <div className="ad-ph">
            <h3>Recent Deposit Requests</h3>
            <button
              type="button"
              className="ad-btn sm"
              onClick={goDeposits}
            >
              View All <span>›</span>
            </button>
          </div>

          {loading ? (
            <div className="ad-empty">Loading deposit requests...</div>
          ) : recent.length === 0 ? (
            <div className="ad-empty">No deposit requests found.</div>
          ) : (
            <>
              {/* Desktop / tablet: table */}
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
                    {recent.map((item, index) => {
                      const status = statusOf(item);

                      return (
                        <tr key={item.id ?? index}>
                          <td className="ad-mono">#{item.id ?? "—"}</td>

                          <td>
                            <div className="ad-user">
                              {item.user_email ||
                                item.email ||
                                item.username ||
                                item.user_id ||
                                "—"}
                            </div>
                          </td>

                          <td className="ad-mono">
                            <b>{money(amountOf(item))}</b>
                          </td>

                          <td>{item.coin || item.currency || "—"}</td>

                          <td>{dateOf(item.created_at || item.createdAt)}</td>

                          <td>
                            <span className={`ad-pill ${badgeOf(status)}`}>
                              {status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile: card list */}
              <div className="ad-cards">
                {recent.map((item, index) => {
                  const status = statusOf(item);

                  return (
                    <div className="ad-dep" key={item.id ?? index}>
                      <div className="ad-dep-top">
                        <span className="ad-dep-id">#{item.id ?? "—"}</span>
                        <span className={`ad-pill ${badgeOf(status)}`}>
                          {status.toUpperCase()}
                        </span>
                      </div>

                      <div className="ad-dep-user">
                        {item.user_email ||
                          item.email ||
                          item.username ||
                          item.user_id ||
                          "—"}
                      </div>

                      <div className="ad-dep-bot">
                        <span className="ad-dep-amt ad-mono">
                          {money(amountOf(item))}
                          <small>{item.coin || item.currency || ""}</small>
                        </span>
                        <span className="ad-dep-date">
                          {dateOf(item.created_at || item.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <div className="ad-foot">
          Trading Admin Panel · Secure Management
        </div>

      </main>
    </div>
  );
}
