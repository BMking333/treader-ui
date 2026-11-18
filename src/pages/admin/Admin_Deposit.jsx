import React, { useCallback, useEffect, useState } from "react";
import { api } from "../Home";

/* =========================================================
   src/pages/admin/Admin_Deposit.jsx
   Crypto Deposit Center  (light theme, mobile + desktop)
   - Payment proof is shown as a screenshot (thumbnail + full-screen viewer)
   ========================================================= */

function unwrap(res) {
  if (res?.data !== undefined) return res.data;
  if (res?.result !== undefined) return res.result;
  return res;
}

function fmt(value) {
  const n = Number(value || 0);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { maximumFractionDigits: 8 })
    : "0";
}

function dateFmt(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

// This screen intentionally displays crypto deposits only.
// Prefer explicit payment-method metadata; never treat a BDT/bank/mobile-wallet
// deposit as crypto merely because the credited wallet asset is a crypto coin.
const CRYPTO_CODES = new Set([
  "BTC", "ETH", "USDT", "USDC", "TRX", "BNB", "SOL", "XRP",
  "LTC", "DOGE", "ADA", "TON", "DOT", "BCH", "MATIC", "POL",
  "AVAX", "LINK", "ETC", "XLM", "APT", "ARB", "OP"
]);

function isCryptoDeposit(item) {
  const method = item?.payment_method || {};
  const methodText = [
    item?.payment_method_type,
    item?.payment_method_name,
    item?.method_type,
    item?.method_name,
    item?.payment_type,
    method?.type,
    method?.name,
    method?.code
  ].filter(Boolean).join(" ").toLowerCase();

  // Explicitly exclude local fiat rails, even if a credited asset is crypto.
  if (/bkash|b-kash|nagad|rocket|upay|bank|mobile wallet|mobile banking|mfs/.test(methodText)) {
    return false;
  }

  if (/crypto|cryptocurrency|blockchain|on.?chain|usdt|usdc|bitcoin|ethereum|tron|binance|btc|eth/.test(methodText)) {
    return true;
  }

  const currency = String(item?.currency || "").trim().toUpperCase();
  const coin = String(item?.coin || "").trim().toUpperCase();

  // The paid currency is the decisive field. A fiat payment credited as USDT
  // must not appear in this crypto-only review queue.
  if (CRYPTO_CODES.has(currency)) return true;
  if (currency && !CRYPTO_CODES.has(currency)) return false;

  // Some APIs store the paid crypto asset in `coin` and omit `currency`.
  return !currency && CRYPTO_CODES.has(coin);
}

function paymentLabel(item) {
  const method = item?.payment_method || {};
  return (
    item?.payment_method_name ||
    method?.name ||
    item?.payment_method_type ||
    method?.type ||
    "Crypto Transfer"
  );
}

/* ---------- screenshot thumbnail ---------- */
function ProofThumb({ url, onOpen, size = "sm" }) {
  const [failed, setFailed] = useState(false);

  if (!url) {
    return <span className="adp-noproof">No proof</span>;
  }

  if (failed) {
    return <span className="adp-noproof">Screenshot unavailable</span>;
  }

  return (
    <button
      type="button"
      className={"adp-thumb " + size}
      onClick={() => onOpen(url)}
      aria-label="View payment screenshot"
    >
      <img
        src={url}
        alt="Payment screenshot"
        loading="lazy"
        onError={() => setFailed(true)}
        draggable={false}
      />
      <span className="adp-thumb-tag">View</span>
    </button>
  );
}

/* ---------- full-screen screenshot viewer ---------- */
function Lightbox({ url, onClose }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="adp-lb" onClick={onClose} role="dialog" aria-modal="true">
      <button
        type="button"
        className="adp-lb-x"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      {/* Tap anywhere (including the screenshot itself) to hide */}
      <div className="adp-lb-body">
        {failed ? (
          <div className="adp-lb-fail">Screenshot could not be loaded.</div>
        ) : (
          <img
            src={url}
            alt="Payment screenshot"
            onError={() => setFailed(true)}
            draggable={false}
          />
        )}
      </div>

      <div className="adp-lb-hint">Tap to close</div>
    </div>
  );
}

const CSS = `
.adp, .adp * { box-sizing: border-box; }

.adp {
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  overflow-x: hidden;
}
.adp button, .adp input, .adp textarea { font-family: inherit; }
.adp button { cursor: pointer; -webkit-appearance: none; appearance: none; }

.adp-in {
  max-width: 1320px;
  margin: 0 auto;
  padding: 22px 24px calc(34px + env(safe-area-inset-bottom, 0px));
}

/* ---------- header ---------- */
.adp-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
  margin-bottom: 20px;
  padding-top: env(safe-area-inset-top, 0px);
}
.adp-heading { display: flex; align-items: center; gap: 13px; min-width: 0; }
.adp-mark {
  width: 46px; height: 46px; flex: none;
  display: grid; place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; font-size: 22px; font-weight: 800;
  box-shadow: 0 6px 16px rgba(40,125,225,.30);
}
.adp-title { margin: 0; font-size: 24px; line-height: 1.2; font-weight: 800; letter-spacing: -.5px; }
.adp-sub { margin-top: 5px; font-size: 13px; color: var(--muted); }
.adp-hbtns { display: flex; gap: 10px; }

.adp-btn {
  min-height: 42px;
  padding: 0 16px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px; font-weight: 650;
  white-space: nowrap;
  transition: border-color .15s, background .15s, transform .1s, opacity .15s;
}
.adp-btn:hover { border-color: #c7d3e4; background: #f8fafd; }
.adp-btn:active { transform: scale(.97); }
.adp-btn:disabled { opacity: .55; cursor: not-allowed; }
.adp-btn.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.adp-btn.primary:hover { background: #1768ad; border-color: #1768ad; }
.adp-btn.approve { background: var(--ok-soft); border-color: #bfe8d6; color: var(--ok); }
.adp-btn.approve:hover { background: #d3f0e4; }
.adp-btn.reject { background: var(--bad-soft); border-color: #f4c5cd; color: var(--bad); }
.adp-btn.reject:hover { background: #fadde2; }
.adp-btn.sm { min-height: 36px; padding: 0 13px; font-size: 12px; }

/* ---------- alerts ---------- */
.adp-alert {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 13px;
}
.adp-alert.error   { background: var(--bad-soft); border-color: #f4c5cd; color: #b3243f; }
.adp-alert.success { background: var(--ok-soft);  border-color: #bfe8d6; color: #087a54; }

/* ---------- stats ---------- */
.adp-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.adp-stat {
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
}
.adp-stat-top { display: flex; align-items: center; gap: 8px; }
.adp-stat-dot { width: 9px; height: 9px; border-radius: 50%; }
.adp-stat-label { font-size: 12px; font-weight: 700; letter-spacing: .3px; color: var(--text-2); }
.adp-stat-val { margin-top: 12px; font-size: 30px; line-height: 1; font-weight: 800; letter-spacing: -1px; }

/* ---------- card / toolbar ---------- */
.adp-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.adp-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line-soft);
}
.adp-tb-title { font-size: 15.5px; font-weight: 750; }
.adp-tb-sub { margin-top: 3px; font-size: 12px; color: var(--muted); }

.adp-tabs {
  display: flex; gap: 6px;
  overflow-x: auto; scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.adp-tabs::-webkit-scrollbar { display: none; }
.adp-tab {
  flex: none;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-2);
  font-size: 12.5px; font-weight: 650;
  white-space: nowrap;
  transition: .15s;
}
.adp-tab:hover { border-color: #c7d3e4; color: var(--text); }
.adp-tab.on { background: var(--primary-soft); border-color: #b9d3ee; color: var(--primary); }

.adp-search-row { padding: 14px 20px 0; }
.adp-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: #f8fafd;
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.adp-input::placeholder { color: #9aa7bd; }
.adp-input:focus { border-color: #8dbbe8; background: #fff; box-shadow: 0 0 0 3px rgba(31,122,203,.12); }

/* ---------- pills ---------- */
.adp-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10.5px; font-weight: 800; letter-spacing: .3px;
  text-transform: uppercase;
  white-space: nowrap;
}
.adp-pill.pending  { background: var(--warn-soft); color: var(--warn); }
.adp-pill.approved { background: var(--ok-soft);   color: var(--ok); }
.adp-pill.rejected { background: var(--bad-soft);  color: var(--bad); }

/* ---------- table (desktop) ---------- */
.adp-table-wrap { overflow-x: auto; margin-top: 14px; }
.adp-table { width: 100%; min-width: 1020px; border-collapse: collapse; }
.adp-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px; font-weight: 700; letter-spacing: .4px;
  color: var(--muted);
  background: #f8fafd;
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
  white-space: nowrap;
}
.adp-table td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--line-soft);
  vertical-align: middle;
}
.adp-table tbody tr:last-child td { border-bottom: 0; }
.adp-table tbody tr:hover td { background: #fafbfe; }
.adp-main { font-weight: 700; color: var(--text); }
.adp-muted { margin-top: 4px; font-size: 11.5px; color: var(--muted); overflow-wrap: anywhere; }
.adp-tx { max-width: 150px; overflow-wrap: anywhere; font-size: 12px; font-weight: 600; }
.adp-coin { display: flex; align-items: center; gap: 10px; }
.adp-coin-ic {
  width: 32px; height: 32px; flex: none;
  border-radius: 50%;
  display: grid; place-items: center;
  background: var(--primary-soft); color: var(--primary);
  font-size: 12px; font-weight: 800;
}
.adp-acts { display: flex; gap: 6px; }

/* ---------- screenshot thumbnail ---------- */
.adp-thumb {
  position: relative;
  display: block;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f1f4f9;
  overflow: hidden;
  transition: border-color .15s, transform .1s;
}
.adp-thumb:hover { border-color: #8dbbe8; }
.adp-thumb:active { transform: scale(.97); }
.adp-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.adp-thumb.sm { width: 64px; height: 64px; }
.adp-thumb.md { width: 88px; height: 88px; }
.adp-thumb.lg { width: 100%; height: auto; max-height: 260px; border-radius: 12px; }
.adp-thumb.lg img { height: auto; max-height: 260px; object-fit: contain; background: #f1f4f9; }
.adp-thumb-tag {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 3px 0;
  background: rgba(15,27,48,.62);
  color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: .3px;
  text-align: center;
}
.adp-noproof { font-size: 12px; color: var(--muted); }

/* ---------- mobile cards ---------- */
.adp-list { display: none; }
.adp-item { padding: 16px; border-bottom: 1px solid var(--line-soft); }
.adp-item:last-child { border-bottom: 0; }
.adp-item-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.adp-item-id { font-size: 14px; font-weight: 800; }
.adp-item-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.adp-item-amt { font-size: 18px; font-weight: 800; letter-spacing: -.3px; }
.adp-item-sub { margin-top: 3px; font-size: 12px; color: var(--muted); }

.adp-kv { margin-top: 12px; display: grid; gap: 8px; }
.adp-kv div { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; }
.adp-kv span { color: var(--muted); flex: none; }
.adp-kv b { font-weight: 650; text-align: right; overflow-wrap: anywhere; min-width: 0; }

.adp-proof-row { margin-top: 14px; display: flex; align-items: center; gap: 12px; }
.adp-proof-row small { font-size: 12px; color: var(--muted); }

.adp-item-acts { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.adp-item-acts .adp-btn { min-height: 46px; font-size: 14px; }
.adp-note { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: #f8fafd; font-size: 12.5px; color: var(--text-2); }

.adp-empty { padding: 40px 16px; text-align: center; color: var(--muted); font-size: 13.5px; }

/* ---------- review modal ---------- */
.adp-mbg {
  position: fixed; inset: 0; z-index: 9000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  background: rgba(15,27,48,.45);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
.adp-modal {
  width: 100%; max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 22px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15,27,48,.28);
}
.adp-modal h3 { margin: 0 0 16px; font-size: 19px; letter-spacing: -.3px; }
.adp-details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.adp-detail {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: #f8fafd;
}
.adp-detail small { display: block; margin-bottom: 6px; font-size: 11px; color: var(--muted); }
.adp-detail strong { font-size: 13px; overflow-wrap: anywhere; }
.adp-mproof { margin-bottom: 16px; }
.adp-mproof > small { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: var(--text-2); }
.adp-mproof .hint { margin-top: 6px; font-size: 11.5px; color: var(--muted); }
.adp-label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--text-2); }
.adp-textarea {
  width: 100%; min-height: 92px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f8fafd;
  color: var(--text);
  font-size: 14px;
  resize: vertical;
  outline: none;
}
.adp-textarea:focus { border-color: #8dbbe8; background: #fff; box-shadow: 0 0 0 3px rgba(31,122,203,.12); }
.adp-mact { display: flex; gap: 10px; margin-top: 16px; }
.adp-mact .adp-btn { flex: 1; min-height: 48px; font-size: 14px; }

/* ---------- screenshot viewer ---------- */
.adp-lb {
  position: fixed; inset: 0; z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  padding: calc(56px + env(safe-area-inset-top, 0px)) 14px calc(20px + env(safe-area-inset-bottom, 0px));
  background: rgba(10,18,32,.88);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}
.adp-lb-x {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: 14px;
  width: 44px; height: 44px;
  display: grid; place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255,255,255,.16);
  color: #fff;
  font-size: 18px;
}
.adp-lb-x:active { transform: scale(.94); }
.adp-lb-body {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.adp-lb-body img {
  max-width: 100%; max-height: 100%;
  object-fit: contain;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0,0,0,.45);
}
.adp-lb-body img { cursor: zoom-out; }
.adp-lb-hint {
  position: absolute;
  left: 0; right: 0;
  bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,.6);
  pointer-events: none;
}
.adp-lb-fail { color: #e5ebf5; font-size: 14px; }

/* ---------- tablet ---------- */
@media (max-width: 900px) {
  .adp-in { padding: 18px 16px calc(30px + env(safe-area-inset-bottom, 0px)); }
}

/* ---------- mobile ---------- */
@media (max-width: 760px) {
  .adp-table-wrap { display: none; }
  .adp-list { display: block; margin-top: 14px; border-top: 1px solid var(--line-soft); }

  .adp-title { font-size: 21px; }
  .adp-sub { font-size: 12px; }
  .adp-hbtns { width: 100%; }
  .adp-hbtns .adp-btn { flex: 1; }

  .adp-stats { gap: 8px; }
  .adp-stat { padding: 13px 12px; border-radius: 14px; }
  .adp-stat-label { font-size: 11px; }
  .adp-stat-val { margin-top: 9px; font-size: 24px; }

  .adp-toolbar { padding: 14px 14px 12px; }
  .adp-tabs { width: 100%; }
  .adp-search-row { padding: 0 14px; }
}

@media (max-width: 560px) {
  .adp-in { padding: 14px 12px calc(28px + env(safe-area-inset-bottom, 0px)); }
  .adp-mbg { align-items: flex-end; padding: 0; }
  .adp-modal {
    max-width: none;
    max-height: 94vh;
    padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0;
  }
  .adp-details { grid-template-columns: 1fr; }
  .adp-mact { flex-direction: column-reverse; }
}

@media (prefers-reduced-motion: reduce) {
  .adp * { transition: none !important; }
}
`;

export default function Admin_Deposit({ go } = {}) {
  const [deposits, setDeposits] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [selected, setSelected] = useState(null);
  const [reviewAction, setReviewAction] = useState("");
  const [note, setNote] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [viewer, setViewer] = useState("");

  const loadDeposits = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = status === "all"
        ? ""
        : `?status=${encodeURIComponent(status)}`;

      const res = await api(`/admin/deposits${query}`);
      const data = unwrap(res);

      const rows = Array.isArray(data) ? data : data?.items || [];
      setDeposits(rows.filter(isCryptoDeposit));
    } catch (err) {
      setError(err?.message || "Unable to load deposits.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  // lock page scroll while a modal / viewer is open
  useEffect(() => {
    const lock = !!selected || !!viewer;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected, viewer]);

  const closeViewer = useCallback(() => setViewer(""), []);

  const openReview = (item, action) => {
    setSelected(item);
    setReviewAction(action);
    setNote("");
    setError("");
    setSuccess("");
  };

  const closeReview = () => {
    if (processing) return;
    setSelected(null);
    setReviewAction("");
    setNote("");
  };

  const submitReview = async () => {
    if (!selected || !reviewAction) return;

    if (reviewAction === "reject" && !note.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }

    const confirmed = window.confirm(
      reviewAction === "approve"
        ? `Approve Deposit #${selected.id} and credit ${fmt(selected.credit_amount)} ${selected.coin}?`
        : `Reject Deposit #${selected.id}?`
    );

    if (!confirmed) return;

    setProcessing(true);
    setError("");

    try {
      await api(
        `/admin/deposits/${selected.id}/${reviewAction}`,
        {
          method: "POST",
          body: { note: note.trim() || null },
        }
      );

      setSuccess(
        reviewAction === "approve"
          ? `Deposit #${selected.id} approved successfully.`
          : `Deposit #${selected.id} rejected successfully.`
      );

      setSelected(null);
      setReviewAction("");
      setNote("");

      await loadDeposits();
    } catch (err) {
      setError(err?.message || "Deposit review failed.");
    } finally {
      setProcessing(false);
    }
  };

  const filtered = deposits.filter((item) => {
    const query = search.toLowerCase();

    return [
      item.id,
      item.user_id,
      item.coin,
      item.currency,
      item.txid,
      item.sender_info,
      item.status,
    ].join(" ").toLowerCase().includes(query);
  });

  const counts = {
    pending: deposits.filter((x) => x.status === "pending").length,
    approved: deposits.filter((x) => x.status === "approved").length,
    rejected: deposits.filter((x) => x.status === "rejected").length,
  };

  const tabs = [
    ["pending", "Pending"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
    ["all", "All Deposits"],
  ];

  return (
    <div className="adp">
      <style>{CSS}</style>

      <div className="adp-in">

        {/* Header */}
        <div className="adp-head">
          <div className="adp-heading">
            <div className="adp-mark">₿</div>
            <div>
              <h1 className="adp-title">Crypto Deposit Center</h1>
              <div className="adp-sub">
                Review on-chain payment requests and manage wallet credits
              </div>
            </div>
          </div>

          <div className="adp-hbtns">
            {go && (
              <button
                type="button"
                className="adp-btn"
                onClick={() => go("admin")}
              >
                ‹ Dashboard
              </button>
            )}
            <button
              type="button"
              className="adp-btn primary"
              onClick={loadDeposits}
              disabled={loading}
            >
              ↻ {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && !selected && (
          <div className="adp-alert error">{error}</div>
        )}

        {success && (
          <div className="adp-alert success">{success}</div>
        )}

        {/* Stats */}
        <div className="adp-stats">
          <div className="adp-stat">
            <div className="adp-stat-top">
              <i className="adp-stat-dot" style={{ background: "#e0a416" }} />
              <span className="adp-stat-label">PENDING</span>
            </div>
            <div className="adp-stat-val">{counts.pending}</div>
          </div>
          <div className="adp-stat">
            <div className="adp-stat-top">
              <i className="adp-stat-dot" style={{ background: "#0e9f6e" }} />
              <span className="adp-stat-label">APPROVED</span>
            </div>
            <div className="adp-stat-val">{counts.approved}</div>
          </div>
          <div className="adp-stat">
            <div className="adp-stat-top">
              <i className="adp-stat-dot" style={{ background: "#e0415f" }} />
              <span className="adp-stat-label">REJECTED</span>
            </div>
            <div className="adp-stat-val">{counts.rejected}</div>
          </div>
        </div>

        {/* List */}
        <section className="adp-card">
          <div className="adp-toolbar">
            <div>
              <div className="adp-tb-title">Deposit Requests</div>
              <div className="adp-tb-sub">
                Only supported cryptocurrency payment requests are shown
              </div>
            </div>

            <div className="adp-tabs">
              {tabs.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={"adp-tab" + (status === value ? " on" : "")}
                  onClick={() => setStatus(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="adp-search-row">
            <input
              className="adp-input"
              placeholder="Search ID, User ID, TXID, Coin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="adp-empty">Loading deposit requests...</div>
          ) : !filtered.length ? (
            <div className="adp-empty">
              No crypto deposit requests found for this filter.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="adp-table-wrap">
                <table className="adp-table">
                  <thead>
                    <tr>
                      <th>REQUEST</th>
                      <th>USER</th>
                      <th>PAYMENT</th>
                      <th>AMOUNT PAID</th>
                      <th>WALLET CREDIT</th>
                      <th>TXID</th>
                      <th>PROOF</th>
                      <th>STATUS</th>
                      <th>DATE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="adp-main">#{item.id}</div>
                          <div className="adp-muted">
                            Method #{item.payment_method_id}
                          </div>
                        </td>

                        <td>
                          <div className="adp-main">User #{item.user_id}</div>
                          <div className="adp-muted">
                            {item.sender_info || "—"}
                          </div>
                        </td>

                        <td>
                          <div className="adp-coin">
                            <span className="adp-coin-ic">
                              {String(item.currency || item.coin || "₿").slice(0, 1)}
                            </span>
                            <div>
                              <div className="adp-main">{paymentLabel(item)}</div>
                              <div className="adp-muted">
                                {item.currency || item.coin || "Crypto asset"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="adp-main">
                            {fmt(item.amount)} {item.currency}
                          </div>
                          <div className="adp-muted">
                            Rate: {fmt(item.rate_used)}
                          </div>
                        </td>

                        <td>
                          <div className="adp-main">
                            {fmt(item.credit_amount)} {item.coin}
                          </div>
                        </td>

                        <td>
                          <div className="adp-tx" title={item.txid}>
                            {item.txid || "—"}
                          </div>
                        </td>

                        <td>
                          <ProofThumb
                            url={item.proof_url}
                            onOpen={setViewer}
                            size="sm"
                          />
                        </td>

                        <td>
                          <span className={`adp-pill ${item.status}`}>
                            {item.status}
                          </span>
                        </td>

                        <td>{dateFmt(item.created_at)}</td>

                        <td>
                          {item.status === "pending" ? (
                            <div className="adp-acts">
                              <button
                                type="button"
                                className="adp-btn sm approve"
                                onClick={() => openReview(item, "approve")}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="adp-btn sm reject"
                                onClick={() => openReview(item, "reject")}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="adp-muted">
                              {item.admin_note || "Reviewed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="adp-list">
                {filtered.map((item) => (
                  <div className="adp-item" key={item.id}>
                    <div className="adp-item-top">
                      <span className="adp-item-id">#{item.id}</span>
                      <span className={`adp-pill ${item.status}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="adp-item-row">
                      <span className="adp-coin-ic" style={{ width: 40, height: 40, fontSize: 15 }}>
                        {String(item.currency || item.coin || "₿").slice(0, 1)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="adp-item-amt">
                          {fmt(item.amount)} {item.currency}
                        </div>
                        <div className="adp-item-sub">
                          {paymentLabel(item)} · User #{item.user_id}
                        </div>
                      </div>
                    </div>

                    <div className="adp-kv">
                      <div>
                        <span>Wallet credit</span>
                        <b>{fmt(item.credit_amount)} {item.coin}</b>
                      </div>
                      <div>
                        <span>Rate</span>
                        <b>{fmt(item.rate_used)}</b>
                      </div>
                      <div>
                        <span>TXID</span>
                        <b>{item.txid || "—"}</b>
                      </div>
                      <div>
                        <span>Sender</span>
                        <b>{item.sender_info || "—"}</b>
                      </div>
                      <div>
                        <span>Date</span>
                        <b>{dateFmt(item.created_at)}</b>
                      </div>
                    </div>

                    <div className="adp-proof-row">
                      <ProofThumb
                        url={item.proof_url}
                        onOpen={setViewer}
                        size="md"
                      />
                      {item.proof_url && <small>Tap screenshot to enlarge</small>}
                    </div>

                    {item.status === "pending" ? (
                      <div className="adp-item-acts">
                        <button
                          type="button"
                          className="adp-btn approve"
                          onClick={() => openReview(item, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="adp-btn reject"
                          onClick={() => openReview(item, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      item.admin_note && (
                        <div className="adp-note">{item.admin_note}</div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Review modal */}
      {selected && (
        <div
          className="adp-mbg"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeReview();
          }}
        >
          <div className="adp-modal">
            <h3>
              {reviewAction === "approve" ? "Approve Deposit" : "Reject Deposit"}
              {" "}#{selected.id}
            </h3>

            {error && (
              <div className="adp-alert error">{error}</div>
            )}

            <div className="adp-details">
              <div className="adp-detail">
                <small>User ID</small>
                <strong>#{selected.user_id}</strong>
              </div>

              <div className="adp-detail">
                <small>Payment Method</small>
                <strong>{paymentLabel(selected)}</strong>
              </div>

              <div className="adp-detail">
                <small>Amount Paid</small>
                <strong>{fmt(selected.amount)} {selected.currency}</strong>
              </div>

              <div className="adp-detail">
                <small>Wallet Credit</small>
                <strong>{fmt(selected.credit_amount)} {selected.coin}</strong>
              </div>

              <div className="adp-detail">
                <small>Transaction ID</small>
                <strong>{selected.txid || "—"}</strong>
              </div>

              <div className="adp-detail">
                <small>Sender Information</small>
                <strong>{selected.sender_info || "—"}</strong>
              </div>
            </div>

            {selected.proof_url && (
              <div className="adp-mproof">
                <small>Payment Screenshot</small>
                <ProofThumb
                  url={selected.proof_url}
                  onOpen={setViewer}
                  size="lg"
                />
                <div className="hint">Tap the screenshot to view full size</div>
              </div>
            )}

            <label className="adp-label">
              {reviewAction === "reject"
                ? "Rejection Reason (Required)"
                : "Admin Note (Optional)"}
            </label>

            <textarea
              className="adp-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                reviewAction === "reject"
                  ? "Explain why this deposit is rejected..."
                  : "Optional admin note..."
              }
            />

            <div className="adp-mact">
              <button
                type="button"
                className={
                  "adp-btn " + (reviewAction === "approve" ? "approve" : "reject")
                }
                onClick={submitReview}
                disabled={processing}
              >
                {processing
                  ? "Processing..."
                  : reviewAction === "approve"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </button>

              <button
                type="button"
                className="adp-btn"
                onClick={closeReview}
                disabled={processing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen screenshot viewer */}
      {viewer && <Lightbox url={viewer} onClose={closeViewer} />}
    </div>
  );
}
