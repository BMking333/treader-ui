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
   Admin Dashboard
   API: GET /admin/deposits
   Navigation targets (App.jsx go()):
     admin, adminDeposits, adminWithdrawals,
     adminPaymentMethods, adminOptions,
     adminKyc, adminUsers
   ========================================================= */

const CSS = `
.ad-wrap {
  min-height:100vh;
  background:#0b0e11;
  color:#eaecef;
  padding:22px;
  font-family:Inter,Arial,sans-serif;
}
.ad-container {max-width:1450px;margin:auto}
.ad-top {
  display:flex;align-items:center;justify-content:space-between;
  gap:15px;margin-bottom:18px;flex-wrap:wrap;
}
.ad-brand {display:flex;align-items:center;gap:12px}
.ad-brand-icon {
  width:44px;height:44px;border-radius:13px;
  background:linear-gradient(135deg,#1f7acb,#19c5c8);
  display:grid;place-items:center;color:white;
  font-size:22px;font-weight:900;
}
.ad-brand h2 {margin:0;font-size:19px;font-weight:800}
.ad-brand p {margin:4px 0 0;color:#848e9c;font-size:12px}
.ad-top-actions {display:flex;gap:9px;align-items:center;flex-wrap:wrap}
.ad-btn {
  border:1px solid #30363d;background:#181c24;color:#eaecef;
  padding:10px 14px;border-radius:9px;cursor:pointer;
  font-size:13px;font-weight:650;display:inline-flex;
  align-items:center;justify-content:center;gap:8px;transition:.2s;
}
.ad-btn:hover {border-color:#1f7acb;background:#202b38}
.ad-btn:disabled {opacity:.55;cursor:not-allowed}
.ad-btn.primary {background:#1f7acb;border-color:#1f7acb;color:#fff}
.ad-btn.primary:hover {background:#1768ad}
.ad-btn.danger {color:#f6465d;border-color:#63313a}

/* ---------- Top navigation (all admin pages) ---------- */
.ad-nav {
  display:flex;gap:8px;margin-bottom:26px;padding:8px;
  background:#151a22;border:1px solid #252b35;border-radius:13px;
  overflow-x:auto;scrollbar-width:none;
}
.ad-nav::-webkit-scrollbar {display:none}
.ad-nav-btn {
  flex:1 0 auto;min-width:140px;
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:12px 16px;border-radius:9px;border:1px solid transparent;
  background:transparent;color:#aeb7c2;cursor:pointer;
  font-size:13px;font-weight:700;white-space:nowrap;transition:.2s;
}
.ad-nav-btn:hover {background:#1d2531;color:#fff}
.ad-nav-btn.on {
  background:linear-gradient(135deg,#1f7acb,#1768ad);
  color:#fff;border-color:#1f7acb;
}

.ad-heading {margin-bottom:23px}
.ad-heading h1 {font-size:25px;margin:0 0 7px;font-weight:800}
.ad-heading p {color:#848e9c;font-size:13px;margin:0}
.ad-grid {
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
  gap:15px;margin-bottom:24px;
}
.ad-card {
  background:#151a22;border:1px solid #252b35;
  border-radius:14px;padding:19px;min-width:0;
}
.ad-card.click {cursor:pointer;transition:.2s}
.ad-card.click:hover {border-color:#1f7acb;background:#18202b}
.ad-card-head {
  display:flex;justify-content:space-between;
  align-items:center;gap:10px;
}
.ad-card-label {color:#848e9c;font-size:12px;font-weight:600}
.ad-card-icon {
  width:38px;height:38px;border-radius:10px;
  display:grid;place-items:center;background:#1d2b3b;color:#3b9bea;
}
.ad-card-value {margin-top:18px;font-size:28px;font-weight:800;color:#fff}
.ad-card-foot {margin-top:8px;color:#848e9c;font-size:11px}
.ad-main-grid {
  display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr);
  gap:16px;
}
.ad-panel {
  background:#151a22;border:1px solid #252b35;
  border-radius:14px;overflow:hidden;min-width:0;
}
.ad-panel-head {
  padding:18px 19px;border-bottom:1px solid #252b35;
  display:flex;align-items:center;justify-content:space-between;gap:12px;
}
.ad-panel-head h3 {margin:0;font-size:15px;font-weight:750}
.ad-panel-body {padding:18px}
.ad-quick-list {display:grid;gap:11px}
.ad-quick {
  display:flex;align-items:center;gap:13px;padding:14px;
  background:#1b222c;border:1px solid #2b3440;border-radius:11px;
  cursor:pointer;text-align:left;color:#eaecef;width:100%;transition:.2s;
}
.ad-quick:hover {border-color:#1f7acb;background:#202c3a}
.ad-quick-icon {
  width:40px;height:40px;border-radius:10px;
  display:grid;place-items:center;background:#23364a;
  color:#49a8ef;flex-shrink:0;
}
.ad-quick-text {flex:1;min-width:0}
.ad-quick-text b {display:block;font-size:13px}
.ad-quick-text small {
  display:block;margin-top:5px;color:#848e9c;font-size:11px;
}
.ad-arrow {color:#848e9c;font-size:21px}
.ad-status-list {display:grid;gap:17px}
.ad-status-row {
  display:flex;align-items:center;justify-content:space-between;
  gap:10px;font-size:13px;
}
.ad-status-left {display:flex;align-items:center;gap:9px;color:#aeb7c2}
.ad-dot {width:8px;height:8px;border-radius:50%}
.ad-status-value {font-weight:800;color:#fff}
.ad-badge {
  display:inline-block;padding:5px 9px;border-radius:20px;
  font-size:10px;font-weight:800;white-space:nowrap;
}
.ad-badge.ok {background:#123d31;color:#00c087}
.ad-badge.warn {background:#493817;color:#f0b90b}
.ad-badge.bad {background:#4a2028;color:#f6465d}
.ad-table-wrap {overflow-x:auto}
.ad-table {width:100%;border-collapse:collapse;min-width:650px}
.ad-table th {
  padding:13px 18px;color:#848e9c;font-size:11px;
  font-weight:700;text-align:left;border-bottom:1px solid #252b35;
}
.ad-table td {
  padding:14px 18px;font-size:12px;
  border-bottom:1px solid #222831;
}
.ad-table tr:last-child td {border-bottom:0}
.ad-empty {padding:30px 15px;text-align:center;color:#848e9c;font-size:13px}
.ad-error {
  background:#421e25;border:1px solid #73323d;color:#ff8794;
  padding:12px 14px;border-radius:9px;font-size:12px;margin-bottom:18px;
}
.ad-loading {padding:30px;text-align:center;color:#848e9c;font-size:13px}
.ad-profile {
  display:flex;align-items:center;gap:10px;padding:7px 10px;
  background:#181e27;border:1px solid #2b3440;border-radius:10px;
}
.ad-avatar {
  width:34px;height:34px;display:grid;place-items:center;
  background:#1f7acb;border-radius:50%;font-weight:800;
}
.ad-profile-info b {display:block;font-size:12px}
.ad-profile-info small {
  display:block;color:#848e9c;margin-top:3px;font-size:10px;
}
.ad-spin {animation:adspin 1s linear infinite}
@keyframes adspin {to{transform:rotate(360deg)}}
.ad-footer {
  text-align:center;color:#626d7a;font-size:11px;padding:25px 0 5px;
}
@media(max-width:950px) {
  .ad-grid {grid-template-columns:repeat(2,minmax(0,1fr))}
  .ad-main-grid {grid-template-columns:1fr}
}
@media(max-width:550px) {
  .ad-wrap {padding:13px}
  .ad-top {align-items:flex-start}
  .ad-top-actions {width:100%}
  .ad-top-actions .ad-btn {flex:1}
  .ad-profile {width:100%}
  .ad-heading h1 {font-size:22px}
  .ad-grid {gap:9px}
  .ad-card {padding:14px}
  .ad-card-value {font-size:23px}
  .ad-card-icon {width:32px;height:32px}
  .ad-nav-btn {min-width:120px;padding:11px 12px}
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
    desc: "Search users, edit, disable, change password, login as user",
  },
  {
    key: "adminKyc",
    label: "KYC",
    icon: ICON.lock,
    title: "KYC Requests",
    desc: "Review, approve and reject user identity documents",
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

  return (
    <div className="ad-wrap">
      <style>{CSS}</style>

      <div className="ad-container">

        {/* Header */}
        <header className="ad-top">
          <div className="ad-brand">
            <div className="ad-brand-icon">C</div>
            <div>
              <h2>Trading Admin</h2>
              <p>Management Dashboard</p>
            </div>
          </div>

          <div className="ad-top-actions">
            <button
              type="button"
              className="ad-btn"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              <Ic d={ICON.trade} s={16} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <div className="ad-profile">
              <div className="ad-avatar">{initials}</div>
              <div className="ad-profile-info">
                <b>{adminName}</b>
                <small>{adminEmail}</small>
              </div>
            </div>

            <button
              type="button"
              className="ad-btn danger"
              onClick={() => logout?.()}
            >
              <Ic d={ICON.lock} s={15} />
              Logout
            </button>
          </div>
        </header>

        {/* Navigation: all admin pages */}
        <nav className="ad-nav">
          {ADMIN_LINKS.map((link) => (
            <button
              key={link.key}
              type="button"
              className={
                "ad-nav-btn" + (link.key === CURRENT_PAGE ? " on" : "")
              }
              onClick={() => open(link.key)}
            >
              <Ic d={link.icon} s={16} />
              {link.label}
            </button>
          ))}
        </nav>

        {/* Page title */}
        <section className="ad-heading">
          <h1>Dashboard Overview</h1>
          <p>
            Welcome back, {adminName}. Here's your platform overview.
          </p>
        </section>

        {error && (
          <div className="ad-error">
            {error}
            <button
              type="button"
              className="ad-btn"
              style={{ marginLeft: 12 }}
              onClick={() => loadDashboard(true)}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="ad-grid">

          <div className="ad-card click" onClick={goDeposits}>
            <div className="ad-card-head">
              <span className="ad-card-label">
                Total Deposit Requests
              </span>
              <span className="ad-card-icon">
                <Ic d={ICON.doc} s={20} />
              </span>
            </div>
            <div className="ad-card-value">
              {loading ? "—" : stats.total}
            </div>
            <div className="ad-card-foot">
              All deposit submissions
            </div>
          </div>

          <div className="ad-card click" onClick={goDeposits}>
            <div className="ad-card-head">
              <span className="ad-card-label">Pending Requests</span>
              <span
                className="ad-card-icon"
                style={{ color: "#f0b90b", background: "#493817" }}
              >
                <Ic d={ICON.bell} s={20} />
              </span>
            </div>
            <div className="ad-card-value">
              {loading ? "—" : stats.pending}
            </div>
            <div className="ad-card-foot">
              Waiting for admin review
            </div>
          </div>

          <div className="ad-card click" onClick={goDeposits}>
            <div className="ad-card-head">
              <span className="ad-card-label">Approved Requests</span>
              <span
                className="ad-card-icon"
                style={{ color: GREEN, background: "#123d31" }}
              >
                <Ic d={ICON.eye} s={20} />
              </span>
            </div>
            <div className="ad-card-value">
              {loading ? "—" : stats.approved}
            </div>
            <div className="ad-card-foot">
              Successfully approved deposits
            </div>
          </div>

          <div className="ad-card click" onClick={goDeposits}>
            <div className="ad-card-head">
              <span className="ad-card-label">Rejected Requests</span>
              <span
                className="ad-card-icon"
                style={{ color: RED, background: "#4a2028" }}
              >
                <Ic d={ICON.lock} s={20} />
              </span>
            </div>
            <div className="ad-card-value">
              {loading ? "—" : stats.rejected}
            </div>
            <div className="ad-card-foot">
              Rejected deposit submissions
            </div>
          </div>

        </section>

        {/* Main panels */}
        <section className="ad-main-grid">

          {/* Quick actions */}
          <div className="ad-panel">
            <div className="ad-panel-head">
              <h3>Admin Management</h3>
              <span className="ad-badge ok">ADMIN</span>
            </div>

            <div className="ad-panel-body">
              <div className="ad-quick-list">

                {quickLinks.map((link) => (
                  <button
                    key={link.key}
                    type="button"
                    className="ad-quick"
                    onClick={() => open(link.key)}
                  >
                    <span className="ad-quick-icon">
                      <Ic d={link.icon} s={21} />
                    </span>
                    <span className="ad-quick-text">
                      <b>{link.title}</b>
                      <small>{link.desc}</small>
                    </span>
                    <span className="ad-arrow">›</span>
                  </button>
                ))}

                <button
                  type="button"
                  className="ad-quick"
                  onClick={() => loadDashboard(true)}
                >
                  <span className="ad-quick-icon">
                    <Ic d={ICON.trade} s={21} />
                  </span>
                  <span className="ad-quick-text">
                    <b>Refresh Statistics</b>
                    <small>
                      Load the latest deposit request information
                    </small>
                  </span>
                  <span className="ad-arrow">›</span>
                </button>

                <button
                  type="button"
                  className="ad-quick"
                  onClick={() => logout?.()}
                >
                  <span
                    className="ad-quick-icon"
                    style={{ background: "#4a2028", color: "#f6465d" }}
                  >
                    <Ic d={ICON.lock} s={21} />
                  </span>
                  <span className="ad-quick-text">
                    <b>Logout</b>
                    <small>Sign out from the admin panel</small>
                  </span>
                  <span className="ad-arrow">›</span>
                </button>

              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="ad-panel">
            <div className="ad-panel-head">
              <h3>Deposit Summary</h3>
              <span className="ad-badge ok">API DATA</span>
            </div>

            <div className="ad-panel-body">
              <div className="ad-status-list">

                <div className="ad-status-row">
                  <span className="ad-status-left">
                    <i className="ad-dot" style={{ background: "#f0b90b" }} />
                    Pending
                  </span>
                  <b className="ad-status-value">
                    {loading ? "—" : stats.pending}
                  </b>
                </div>

                <div className="ad-status-row">
                  <span className="ad-status-left">
                    <i className="ad-dot" style={{ background: GREEN }} />
                    Approved
                  </span>
                  <b className="ad-status-value">
                    {loading ? "—" : stats.approved}
                  </b>
                </div>

                <div className="ad-status-row">
                  <span className="ad-status-left">
                    <i className="ad-dot" style={{ background: RED }} />
                    Rejected
                  </span>
                  <b className="ad-status-value">
                    {loading ? "—" : stats.rejected}
                  </b>
                </div>

                <div className="ad-status-row">
                  <span className="ad-status-left">
                    <i className="ad-dot" style={{ background: BLUE }} />
                    Total Requests
                  </span>
                  <b className="ad-status-value">
                    {loading ? "—" : stats.total}
                  </b>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #252b35",
                    paddingTop: 16,
                    marginTop: 3,
                  }}
                >
                  <div className="ad-card-label">
                    Total Requested Amount
                  </div>
                  <div
                    style={{
                      fontSize: 23,
                      fontWeight: 800,
                      marginTop: 9,
                    }}
                  >
                    {loading ? "—" : money(stats.totalAmount)}
                  </div>
                  <div className="ad-card-foot">
                    Sum of request amounts returned by the API
                  </div>
                </div>

              </div>
            </div>
          </div>

        </section>

        {/* Recent deposits */}
        <section
          className="ad-panel"
          style={{ marginTop: 17 }}
        >
          <div className="ad-panel-head">
            <h3>Recent Deposit Requests</h3>
            <button
              type="button"
              className="ad-btn"
              onClick={goDeposits}
            >
              View All <span>›</span>
            </button>
          </div>

          {loading ? (
            <div className="ad-loading">
              Loading deposit requests...
            </div>
          ) : recent.length === 0 ? (
            <div className="ad-empty">
              No deposit requests found.
            </div>
          ) : (
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

                    const badge =
                      status === "approved"
                        ? "ok"
                        : status === "rejected"
                          ? "bad"
                          : "warn";

                    return (
                      <tr key={item.id ?? index}>
                        <td>#{item.id ?? "—"}</td>

                        <td>
                          {item.user_email ||
                            item.email ||
                            item.username ||
                            item.user_id ||
                            "—"}
                        </td>

                        <td>{money(amountOf(item))}</td>

                        <td>
                          {item.coin || item.currency || "—"}
                        </td>

                        <td>
                          {dateOf(item.created_at || item.createdAt)}
                        </td>

                        <td>
                          <span className={`ad-badge ${badge}`}>
                            {status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="ad-footer">
          Trading Admin Panel · Secure Management
        </div>

      </div>
    </div>
  );
}
