import React, { useCallback, useEffect, useState } from "react";
import { api } from "../Home";

/* =========================================================
   src/pages/admin/Admin_Withdrew.jsx
   Withdraw Requests  (light theme, mobile + desktop)
   ========================================================= */

const SIZE = 20;
const TOAST_MS = 2600;

const TABS = [
  { k: "all", l: "All" },
  { k: "pending", l: "Pending" },
  { k: "approved", l: "Approved" },
  { k: "rejected", l: "Rejected" },
];

const STATUS_L = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

const ERR = {
  alreadyReviewed: "This request has already been reviewed",
  notFound: "Request not found",
  rejectionReasonRequired: "Please enter a reason for rejection",
  forbidden: "You do not have permission",
  frozenMismatch: "Frozen balance does not match",
  badStatus: "Invalid status",
};

const CSS = `
.aw, .aw * { box-sizing: border-box; }

.aw {
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

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Bengali", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  overflow-x: hidden;
}
.aw button, .aw input, .aw textarea { font-family: inherit; }
.aw button { cursor: pointer; -webkit-appearance: none; appearance: none; }

.aw-in {
  max-width: 1320px;
  margin: 0 auto;
  padding: 22px 24px calc(34px + env(safe-area-inset-bottom, 0px));
}

/* ---------- header ---------- */
.aw-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
  margin-bottom: 20px;
  padding-top: env(safe-area-inset-top, 0px);
}
.aw-heading { display: flex; align-items: center; gap: 13px; min-width: 0; }
.aw-mark {
  width: 46px; height: 46px; flex: none;
  display: grid; place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; font-size: 22px; font-weight: 800;
  box-shadow: 0 6px 16px rgba(40,125,225,.30);
}
.aw-title { margin: 0; font-size: 24px; line-height: 1.2; font-weight: 800; letter-spacing: -.5px; }
.aw-sub { margin-top: 5px; font-size: 13px; color: var(--muted); }
.aw-hbtns { display: flex; gap: 10px; }

/* ---------- buttons ---------- */
.aw-btn {
  min-height: 42px;
  padding: 0 18px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px; font-weight: 650;
  white-space: nowrap;
  transition: border-color .15s, background .15s, transform .1s, opacity .15s;
}
.aw-btn:hover { border-color: #c7d3e4; background: #f8fafd; }
.aw-btn:active { transform: scale(.97); }
.aw-btn:disabled { opacity: .55; cursor: not-allowed; }
.aw-btn.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.aw-btn.primary:hover { background: #1768ad; border-color: #1768ad; }
.aw-btn.approve { background: var(--ok-soft); border-color: #bfe8d6; color: var(--ok); }
.aw-btn.approve:hover { background: #d3f0e4; }
.aw-btn.reject { background: var(--bad-soft); border-color: #f4c5cd; color: var(--bad); }
.aw-btn.reject:hover { background: #fadde2; }
.aw-btn.solid-ok { background: var(--ok); border-color: var(--ok); color: #fff; }
.aw-btn.solid-ok:hover { background: #0b8a5f; }
.aw-btn.solid-bad { background: var(--bad); border-color: var(--bad); color: #fff; }
.aw-btn.solid-bad:hover { background: #c9334f; }
.aw-btn.sm { min-height: 36px; padding: 0 14px; font-size: 12px; }

/* ---------- stats ---------- */
.aw-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.aw-stat {
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
}
.aw-stat-top { display: flex; align-items: center; gap: 8px; }
.aw-dot { width: 9px; height: 9px; border-radius: 50%; }
.aw-stat-label { font-size: 12px; font-weight: 700; letter-spacing: .3px; color: var(--text-2); }
.aw-stat-val { margin-top: 12px; font-size: 30px; line-height: 1; font-weight: 800; letter-spacing: -1px; }

/* ---------- card / toolbar ---------- */
.aw-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.aw-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line-soft);
}
.aw-tb-title { font-size: 15.5px; font-weight: 750; }
.aw-tb-sub { margin-top: 3px; font-size: 12px; color: var(--muted); }

.aw-tabs {
  display: flex; gap: 6px;
  overflow-x: auto; scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.aw-tabs::-webkit-scrollbar { display: none; }
.aw-tab {
  flex: none;
  display: inline-flex; align-items: center; gap: 8px;
  min-height: 38px;
  padding: 0 12px 0 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-2);
  font-size: 12.5px; font-weight: 650;
  white-space: nowrap;
  transition: .15s;
}
.aw-tab:hover { border-color: #c7d3e4; color: var(--text); }
.aw-tab.on { background: var(--primary-soft); border-color: #b9d3ee; color: var(--primary); }
.aw-tab span {
  min-width: 22px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #eef1f6;
  color: var(--text-2);
  font-size: 11px; font-weight: 800;
  text-align: center;
}
.aw-tab.on span { background: #fff; color: var(--primary); }

/* ---------- pills ---------- */
.aw-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10.5px; font-weight: 800; letter-spacing: .3px;
  text-transform: uppercase;
  white-space: nowrap;
}
.aw-pill.pending  { background: var(--warn-soft); color: var(--warn); }
.aw-pill.approved { background: var(--ok-soft);   color: var(--ok); }
.aw-pill.rejected { background: var(--bad-soft);  color: var(--bad); }

/* ---------- table (desktop) ---------- */
.aw-table-wrap { overflow-x: auto; }
.aw-table { width: 100%; min-width: 1000px; border-collapse: collapse; }
.aw-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px; font-weight: 700; letter-spacing: .4px;
  color: var(--muted);
  background: #f8fafd;
  border-bottom: 1px solid var(--line-soft);
  white-space: nowrap;
}
.aw-table td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--line-soft);
  vertical-align: middle;
}
.aw-table tbody tr:last-child td { border-bottom: 0; }
.aw-table tbody tr:hover td { background: #fafbfe; }
.aw-main { font-weight: 700; }
.aw-muted { margin-top: 4px; font-size: 11.5px; color: var(--muted); overflow-wrap: anywhere; }
.aw-num { font-variant-numeric: tabular-nums; }
.aw-green { color: var(--ok); font-weight: 700; }
.aw-addr-cell { display: flex; align-items: center; gap: 8px; max-width: 260px; }
.aw-addr-txt { font-size: 12px; overflow-wrap: anywhere; min-width: 0; }
.aw-acts { display: flex; gap: 6px; }
.aw-cp {
  flex: none;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fafd;
  color: var(--text-2);
  font-size: 11.5px; font-weight: 650;
}
.aw-cp:hover { border-color: #b9d3ee; color: var(--primary); }

/* ---------- mobile cards ---------- */
.aw-list { display: none; }
.aw-item { padding: 16px; border-bottom: 1px solid var(--line-soft); }
.aw-item:last-child { border-bottom: 0; }
.aw-item-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.aw-item-id { font-size: 14px; font-weight: 800; }
.aw-item-amt { margin-top: 10px; font-size: 20px; font-weight: 800; letter-spacing: -.4px; }
.aw-item-user { margin-top: 3px; font-size: 12.5px; color: var(--muted); overflow-wrap: anywhere; }
.aw-kv { margin-top: 12px; display: grid; gap: 9px; }
.aw-kv div { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; font-size: 13px; }
.aw-kv span { color: var(--muted); flex: none; }
.aw-kv b { font-weight: 650; text-align: right; overflow-wrap: anywhere; min-width: 0; }
.aw-kv b.gr { color: var(--ok); }
.aw-kv .addr { display: flex; align-items: center; justify-content: flex-end; gap: 8px; min-width: 0; }
.aw-item-acts { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.aw-item-acts .aw-btn { min-height: 46px; font-size: 14px; }

.aw-empty { padding: 44px 16px; text-align: center; color: var(--muted); font-size: 13.5px; }

/* ---------- pagination ---------- */
.aw-pg {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 16px;
  border-top: 1px solid var(--line-soft);
  font-size: 13px; color: var(--muted);
}

/* ---------- modal ---------- */
.aw-ov {
  position: fixed; inset: 0; z-index: 9000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  background: rgba(15,27,48,.45);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
.aw-md {
  width: 100%; max-width: 440px;
  max-height: 92vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 22px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15,27,48,.28);
}
.aw-md h3 { margin: 0 0 6px; font-size: 19px; letter-spacing: -.3px; }
.aw-md p { margin: 0 0 14px; font-size: 13px; line-height: 1.5; color: var(--muted); overflow-wrap: anywhere; }
.aw-md label { display: block; margin: 12px 0 7px; font-size: 13px; font-weight: 600; color: var(--text-2); }
.aw-md input, .aw-md textarea {
  width: 100%;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f8fafd;
  color: var(--text);
  font-size: 15px;
  outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.aw-md input { height: 48px; }
.aw-md textarea { padding: 12px 14px; resize: vertical; }
.aw-md input:focus, .aw-md textarea:focus {
  border-color: #8dbbe8; background: #fff; box-shadow: 0 0 0 3px rgba(31,122,203,.12);
}
.aw-mb { display: flex; gap: 10px; margin-top: 18px; }
.aw-mb .aw-btn { flex: 1; min-height: 48px; font-size: 14px; }

/* ---------- toast ---------- */
.aw-toast {
  position: fixed; left: 50%; top: calc(18px + env(safe-area-inset-top, 0px)); z-index: 9500;
  transform: translateX(-50%);
  max-width: 90%;
  padding: 12px 20px;
  border-radius: 12px;
  color: #fff;
  font-size: 13.5px; font-weight: 650;
  box-shadow: 0 14px 30px -14px rgba(0,0,0,.45);
  animation: awin .2s ease;
}
.aw-toast.ok  { background: var(--ok); }
.aw-toast.bad { background: var(--bad); }
@keyframes awin { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }

/* ---------- tablet ---------- */
@media (max-width: 1000px) {
  .aw-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .aw-in { padding: 18px 16px calc(30px + env(safe-area-inset-bottom, 0px)); }
}

/* ---------- mobile ---------- */
@media (max-width: 760px) {
  .aw-table-wrap { display: none; }
  .aw-list { display: block; }

  .aw-title { font-size: 21px; }
  .aw-sub { font-size: 12px; }
  .aw-hbtns { width: 100%; }
  .aw-hbtns .aw-btn { flex: 1; }

  .aw-stats { gap: 8px; }
  .aw-stat { padding: 13px 12px; border-radius: 14px; }
  .aw-stat-label { font-size: 11px; }
  .aw-stat-val { margin-top: 9px; font-size: 24px; }

  .aw-toolbar { padding: 14px; }
  .aw-tabs { width: 100%; }
}

@media (max-width: 560px) {
  .aw-in { padding: 14px 12px calc(28px + env(safe-area-inset-bottom, 0px)); }
  .aw-ov { align-items: flex-end; padding: 0; }
  .aw-md {
    max-width: none;
    max-height: 94vh;
    padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0;
  }
  .aw-md input, .aw-md textarea { font-size: 16px; } /* prevents iOS zoom on focus */
  .aw-mb { flex-direction: column-reverse; }
}

@media (prefers-reduced-motion: reduce) {
  .aw * { transition: none !important; animation: none !important; }
}
`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(8).replace(/\.?0+$/, "") : String(v ?? "");
};

const when = (v) => (v ? new Date(v).toLocaleString() : "-");

export default function AdminWithdrew({ go } = {}) {
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ total: 0, items: [] });
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ m: "", ok: false, n: 0 });
  const [modal, setModal] = useState(null);
  const [txid, setTxid] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const flash = (m, ok = false) => setToast({ m, ok, n: Date.now() });
  const errText = (e) => ERR[e && e.message] || (e && e.message) || "Error";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([
        api(`/admin/withdraws?status=${tab}&page=${page}&size=${SIZE}`),
        api("/admin/withdraws/counts"),
      ]);
      setData({ total: d.total || 0, items: d.items || [] });
      setCounts(c);
    } catch (e) {
      flash(errText(e), false);
    }
    setLoading(false);
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast.m) return undefined;
    const id = setTimeout(() => setToast((x) => ({ ...x, m: "" })), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast.n, toast.m]);

  // lock page scroll while the modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (modal) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modal]);

  const changeTab = (k) => { setTab(k); setPage(1); };

  const openModal = (type, row) => {
    setTxid(""); setNote(""); setReason("");
    setModal({ type, row });
  };

  const closeModal = () => { if (!busy) setModal(null); };

  const doApprove = async () => {
    if (busy || !modal) return;
    setBusy(true);
    try {
      await api(`/admin/withdraws/${modal.row.id}/approve`, { method: "POST", body: { txid: txid.trim() || null, note: note.trim() || null } });
      setModal(null);
      flash("Approved", true);
      await load();
    } catch (e) { flash(errText(e), false); }
    setBusy(false);
  };

  const doReject = async () => {
    if (busy || !modal) return;
    if (!reason.trim()) return flash(ERR.rejectionReasonRequired, false);
    setBusy(true);
    try {
      await api(`/admin/withdraws/${modal.row.id}/reject`, { method: "POST", body: { reason: reason.trim() } });
      setModal(null);
      flash("Rejected", true);
      await load();
    } catch (e) { flash(errText(e), false); }
    setBusy(false);
  };

  const copy = async (s) => {
    try { await navigator.clipboard.writeText(s); flash("Copied", true); } catch (e) { flash("Copy failed", false); }
  };

  const pages = Math.max(1, Math.ceil(data.total / SIZE));

  const statCards = [
    { k: "pending", l: "PENDING", c: "#e0a416" },
    { k: "approved", l: "APPROVED", c: "#0e9f6e" },
    { k: "rejected", l: "REJECTED", c: "#e0415f" },
    { k: "all", l: "TOTAL", c: "#1f7acb" },
  ];

  return (
    <div className="aw">
      <style>{CSS}</style>

      <div className="aw-in">

        {/* Header */}
        <header className="aw-head">
          <div className="aw-heading">
            <div className="aw-mark">↗</div>
            <div>
              <h1 className="aw-title">Withdraw Requests</h1>
              <div className="aw-sub">
                Review, approve or reject user withdrawal requests.
              </div>
            </div>
          </div>

          <div className="aw-hbtns">
            {go && (
              <button
                type="button"
                className="aw-btn"
                onClick={() => go("admin")}
              >
                ‹ Dashboard
              </button>
            )}
            <button
              type="button"
              className="aw-btn primary"
              onClick={load}
              disabled={loading}
            >
              ↻ {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="aw-stats">
          {statCards.map((s) => (
            <div className="aw-stat" key={s.k}>
              <div className="aw-stat-top">
                <i className="aw-dot" style={{ background: s.c }} />
                <span className="aw-stat-label">{s.l}</span>
              </div>
              <div className="aw-stat-val">{counts[s.k] || 0}</div>
            </div>
          ))}
        </div>

        {/* List */}
        <section className="aw-card">
          <div className="aw-toolbar">
            <div>
              <div className="aw-tb-title">Withdrawals</div>
              <div className="aw-tb-sub">{data.total} request(s) in this filter</div>
            </div>

            <div className="aw-tabs">
              {TABS.map((x) => (
                <button
                  key={x.k}
                  type="button"
                  className={"aw-tab" + (tab === x.k ? " on" : "")}
                  onClick={() => changeTab(x.k)}
                >
                  {x.l}
                  <span>{counts[x.k] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {loading && data.items.length === 0 && (
            <div className="aw-empty">Loading...</div>
          )}
          {!loading && data.items.length === 0 && (
            <div className="aw-empty">No requests found</div>
          )}

          {data.items.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="aw-table-wrap">
                <table className="aw-table">
                  <thead>
                    <tr>
                      <th>REQUEST</th>
                      <th>USER</th>
                      <th>AMOUNT</th>
                      <th>NETWORK / ADDRESS</th>
                      <th>FEE</th>
                      <th>USER RECEIVES</th>
                      <th>STATUS</th>
                      <th>DATE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="aw-main">#{r.id}</div>
                        </td>

                        <td>
                          <div className="aw-main" style={{ overflowWrap: "anywhere" }}>
                            {r.user_email || "-"}
                          </div>
                          {r.user_uid ? (
                            <div className="aw-muted">UID {r.user_uid}</div>
                          ) : null}
                        </td>

                        <td className="aw-num">
                          <div className="aw-main">{num(r.amount)} {r.coin}</div>
                        </td>

                        <td>
                          <div className="aw-main">{r.network}</div>
                          <div className="aw-addr-cell" style={{ marginTop: 4 }}>
                            <span className="aw-addr-txt">{r.address}</span>
                            <button
                              type="button"
                              className="aw-cp"
                              onClick={() => copy(r.address)}
                            >
                              Copy
                            </button>
                          </div>
                          {r.txid && (
                            <div className="aw-muted">TXID: {r.txid}</div>
                          )}
                        </td>

                        <td className="aw-num">{num(r.fee)} {r.coin}</td>

                        <td className="aw-num aw-green">
                          {num(r.net_amount)} {r.coin}
                        </td>

                        <td>
                          <span className={"aw-pill " + r.status}>
                            {STATUS_L[r.status] || r.status}
                          </span>
                        </td>

                        <td>
                          <div>{when(r.created_at)}</div>
                          {r.status !== "pending" && (
                            <div className="aw-muted">
                              Reviewed: {when(r.reviewed_at)}
                            </div>
                          )}
                        </td>

                        <td>
                          {r.status === "pending" ? (
                            <div className="aw-acts">
                              <button
                                type="button"
                                className="aw-btn sm approve"
                                onClick={() => openModal("approve", r)}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="aw-btn sm reject"
                                onClick={() => openModal("reject", r)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="aw-muted">
                              {r.admin_note || "Reviewed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="aw-list">
                {data.items.map((r) => (
                  <div className="aw-item" key={r.id}>
                    <div className="aw-item-top">
                      <span className="aw-item-id">#{r.id}</span>
                      <span className={"aw-pill " + r.status}>
                        {STATUS_L[r.status] || r.status}
                      </span>
                    </div>

                    <div className="aw-item-amt aw-num">
                      {num(r.amount)} {r.coin}
                    </div>
                    <div className="aw-item-user">
                      {r.user_email || "-"} {r.user_uid ? `(${r.user_uid})` : ""}
                    </div>

                    <div className="aw-kv">
                      <div>
                        <span>Network</span>
                        <b>{r.network}</b>
                      </div>
                      <div>
                        <span>Address</span>
                        <div className="addr">
                          <b>{r.address}</b>
                          <button
                            type="button"
                            className="aw-cp"
                            onClick={() => copy(r.address)}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div>
                        <span>Fee</span>
                        <b>{num(r.fee)} {r.coin}</b>
                      </div>
                      <div>
                        <span>User receives</span>
                        <b className="gr">{num(r.net_amount)} {r.coin}</b>
                      </div>
                      <div>
                        <span>Requested</span>
                        <b>{when(r.created_at)}</b>
                      </div>
                      {r.status !== "pending" && (
                        <div>
                          <span>Reviewed</span>
                          <b>{when(r.reviewed_at)}</b>
                        </div>
                      )}
                      {r.txid && (
                        <div>
                          <span>TXID</span>
                          <b>{r.txid}</b>
                        </div>
                      )}
                      {r.admin_note && (
                        <div>
                          <span>Note</span>
                          <b>{r.admin_note}</b>
                        </div>
                      )}
                    </div>

                    {r.status === "pending" && (
                      <div className="aw-item-acts">
                        <button
                          type="button"
                          className="aw-btn approve"
                          onClick={() => openModal("approve", r)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="aw-btn reject"
                          onClick={() => openModal("reject", r)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {data.total > SIZE && (
            <div className="aw-pg">
              <button
                type="button"
                className="aw-btn sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹ Prev
              </button>
              <span>{page} / {pages}</span>
              <button
                type="button"
                className="aw-btn sm"
                disabled={page >= pages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next ›
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Approve / Reject modal */}
      {modal && (
        <div className="aw-ov" onClick={closeModal}>
          <div className="aw-md" onClick={(e) => e.stopPropagation()}>
            {modal.type === "approve" ? (
              <>
                <h3>Approve #{modal.row.id}</h3>
                <p>
                  {num(modal.row.net_amount)} {modal.row.coin} → {modal.row.address}
                </p>

                <label htmlFor="aw-txid">TXID (optional)</label>
                <input
                  id="aw-txid"
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  placeholder="Transaction hash"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />

                <label htmlFor="aw-note">Note (optional)</label>
                <textarea
                  id="aw-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <div className="aw-mb">
                  <button type="button" className="aw-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="aw-btn solid-ok"
                    disabled={busy}
                    onClick={doApprove}
                  >
                    {busy ? "Processing..." : "Confirm"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Reject #{modal.row.id}</h3>
                <p>
                  {num(modal.row.amount)} {modal.row.coin} will be refunded to the user's balance
                </p>

                <label htmlFor="aw-reason">Reason (required)</label>
                <textarea
                  id="aw-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />

                <div className="aw-mb">
                  <button type="button" className="aw-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="aw-btn solid-bad"
                    disabled={busy}
                    onClick={doReject}
                  >
                    {busy ? "Processing..." : "Confirm Reject"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast.m && (
        <div className={"aw-toast " + (toast.ok ? "ok" : "bad")} key={toast.n}>
          {toast.m}
        </div>
      )}
    </div>
  );
}
