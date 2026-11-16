
import React, { useCallback, useEffect, useState } from "react";
import { api } from "../Home";

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

export default function Admin_Deposit() {
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

  return (
    <div className="adp">
      <style>{`
        .adp {
          --bg:#080d18; --panel:#101827; --panel2:#0c1422;
          --line:rgba(148,163,184,.15); --text:#edf4ff;
          --muted:#8fa1ba; --blue:#72a7ff; --green:#42d6a0;
          min-height:100%; padding:clamp(15px,2.5vw,30px);
          color:var(--text); background:
            radial-gradient(ellipse at 8% 0%,rgba(37,99,235,.13),transparent 34%),
            radial-gradient(ellipse at 100% 15%,rgba(16,185,129,.07),transparent 28%),
            var(--bg);
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
        }
        .adp * { box-sizing:border-box; }
        .adp-head {
          display:flex; justify-content:space-between; align-items:center;
          flex-wrap:wrap; gap:16px; margin-bottom:25px;
        }
        .adp-heading { display:flex; align-items:center; gap:14px; }
        .adp-mark {
          width:48px;height:48px;display:grid;place-items:center;border-radius:15px;
          color:#b9d5ff;background:linear-gradient(145deg,#1b3e70,#14233c);
          border:1px solid rgba(114,167,255,.28);
          box-shadow:0 10px 28px rgba(0,0,0,.22);font-size:22px;
        }
        .adp-title {font-size:clamp(21px,2.4vw,28px);font-weight:850;letter-spacing:-.7px;margin:0;}
        .adp-sub {font-size:12px;color:var(--muted);margin-top:6px;}
        .adp-secure {
          display:inline-flex;align-items:center;gap:7px;margin-top:10px;
          color:#71dfb4;font-size:10px;font-weight:800;letter-spacing:.8px;
          text-transform:uppercase;
        }
        .adp-secure-dot {width:7px;height:7px;border-radius:50%;background:#42d6a0;box-shadow:0 0 12px #42d6a0;}
        .adp-card,.adp-stat {
          background:linear-gradient(145deg,rgba(18,29,47,.97),rgba(13,22,37,.97));
          border:1px solid var(--line);border-radius:17px;
          box-shadow:0 14px 36px rgba(0,0,0,.16);
        }
        .adp-card {padding:clamp(13px,2vw,21px);margin-bottom:18px;}
        .adp-stats {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-bottom:18px;}
        .adp-stat {padding:17px 18px;position:relative;overflow:hidden;}
        .adp-stat:after {content:"";position:absolute;width:85px;height:85px;right:-30px;top:-35px;border-radius:50%;background:rgba(96,165,250,.07);}
        .adp-stat-label {color:var(--muted);font-size:10px;font-weight:800;letter-spacing:1px;}
        .adp-stat-value {font-size:27px;font-weight:850;letter-spacing:-.8px;margin-top:9px;}
        .adp-tabs {display:flex;gap:7px;flex-wrap:wrap;}
        .adp-tab {
          padding:9px 13px;border:1px solid var(--line);border-radius:10px;
          background:#0b1423;color:#9aabc2;cursor:pointer;font-size:11px;font-weight:750;
          transition:.18s ease;
        }
        .adp-tab:hover {border-color:rgba(114,167,255,.45);color:#e7f1ff;}
        .adp-tab.active {color:#dceaff;background:linear-gradient(135deg,#1b477e,#17345b);border-color:#3979c9;box-shadow:0 5px 16px rgba(37,99,235,.15);}
        .adp-toolbar {display:flex;justify-content:space-between;align-items:center;gap:13px;flex-wrap:wrap;margin-bottom:16px;}
        .adp-toolbar-title {font-size:14px;font-weight:800;}
        .adp-toolbar-sub {font-size:11px;color:var(--muted);margin-top:4px;}
        .adp-input {
          width:100%;max-width:330px;background:#091321;color:var(--text);
          border:1px solid var(--line);border-radius:11px;padding:11px 13px;
          outline:none;font-size:12px;transition:.18s ease;
        }
        .adp-input:focus,.adp-textarea:focus {border-color:#528ee4;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
        .adp-table-wrap {overflow-x:auto;border:1px solid var(--line);border-radius:12px;}
        .adp-table {width:100%;min-width:980px;border-collapse:collapse;background:rgba(7,14,25,.35);}
        .adp-table th {text-align:left;color:#8fa2bd;font-size:9px;letter-spacing:.9px;font-weight:850;padding:14px 13px;background:#0b1524;border-bottom:1px solid var(--line);white-space:nowrap;}
        .adp-table td {font-size:11px;padding:14px 13px;border-bottom:1px solid rgba(148,163,184,.09);vertical-align:middle;}
        .adp-table tbody tr {transition:background .15s ease;}
        .adp-table tbody tr:hover {background:rgba(59,130,246,.055);}
        .adp-table tbody tr:last-child td {border-bottom:0;}
        .adp-main {font-weight:800;color:#e5efff;}
        .adp-muted {color:var(--muted);margin-top:5px;font-size:10px;overflow-wrap:anywhere;}
        .adp-pill {display:inline-flex;align-items:center;gap:6px;border-radius:30px;padding:6px 9px;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.5px;}
        .adp-pending {background:rgba(234,179,8,.12);color:#f4d36f;border:1px solid rgba(234,179,8,.18);}
        .adp-approved {background:rgba(16,185,129,.12);color:#69e5ae;border:1px solid rgba(16,185,129,.2);}
        .adp-rejected {background:rgba(244,63,94,.12);color:#ff9ba8;border:1px solid rgba(244,63,94,.2);}
        .adp-btn {border:1px solid transparent;border-radius:9px;padding:9px 12px;font-size:10px;font-weight:850;cursor:pointer;transition:.18s ease;white-space:nowrap;}
        .adp-btn:disabled {opacity:.5;cursor:not-allowed;}
        .adp-approve {background:rgba(16,185,129,.14);color:#70e6b5;border-color:rgba(16,185,129,.22);}
        .adp-approve:hover {background:rgba(16,185,129,.23);}
        .adp-reject {background:rgba(244,63,94,.13);color:#ff9eaa;border-color:rgba(244,63,94,.2);}
        .adp-reject:hover {background:rgba(244,63,94,.22);}
        .adp-proof {background:linear-gradient(135deg,#245ba0,#194274);color:#e2efff;border-color:rgba(114,167,255,.25);}
        .adp-proof:hover {filter:brightness(1.13);transform:translateY(-1px);}
        .adp-empty {padding:38px 18px;text-align:center;color:var(--muted);font-size:12px;}
        .adp-alert {padding:12px 14px;border-radius:11px;font-size:12px;margin-bottom:14px;border:1px solid transparent;}
        .adp-error {background:rgba(244,63,94,.1);color:#ffabb4;border-color:rgba(244,63,94,.2);}
        .adp-success {background:rgba(16,185,129,.1);color:#7be8ba;border-color:rgba(16,185,129,.2);}
        .adp-modal-bg {position:fixed;inset:0;z-index:9999;display:flex;justify-content:center;align-items:center;padding:16px;background:rgba(2,6,15,.82);backdrop-filter:blur(8px);}
        .adp-modal {width:100%;max-width:540px;max-height:90vh;overflow:auto;background:linear-gradient(145deg,#142136,#0d1728);border:1px solid rgba(148,163,184,.2);border-radius:19px;padding:23px;box-shadow:0 25px 80px rgba(0,0,0,.5);}
        .adp-modal h3 {margin:0 0 18px;font-size:19px;letter-spacing:-.4px;}
        .adp-details {display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:17px;}
        .adp-detail {background:#0a1423;border:1px solid var(--line);padding:12px;border-radius:11px;min-width:0;}
        .adp-detail small {color:var(--muted);display:block;margin-bottom:7px;font-size:10px;}
        .adp-detail strong {font-size:12px;overflow-wrap:anywhere;}
        .adp-textarea {width:100%;min-height:94px;resize:vertical;background:#091321;color:var(--text);border:1px solid var(--line);border-radius:11px;padding:12px;outline:none;font-size:12px;}
        .adp-modal-actions {display:flex;gap:9px;margin-top:16px;}
        .adp-modal-actions button {flex:1;padding:12px;}
        .adp-cancel {background:#26364d;color:#e7efff;border-color:rgba(148,163,184,.12);}
        .adp-proof-link {color:#8dbaff;text-decoration:none;font-size:11px;font-weight:750;}
        .adp-proof-link:hover {text-decoration:underline;}
        .adp-coin {display:inline-flex;align-items:center;gap:7px;}
        .adp-coin-icon {width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:rgba(96,165,250,.12);color:#9fc6ff;font-size:11px;font-weight:900;}
        @media(max-width:650px) {
          .adp {padding:13px;}
          .adp-stats {gap:8px;}
          .adp-stat {padding:12px;}
          .adp-stat-value {font-size:21px;}
          .adp-details {grid-template-columns:1fr;}
          .adp-heading {align-items:flex-start;}
          .adp-mark {width:42px;height:42px;border-radius:13px;}
        }
      `}</style>

      <div className="adp-head">
        <div className="adp-heading">
          <div className="adp-mark">₿</div>
          <div>
            <h1 className="adp-title">Crypto Deposit Center</h1>
            <div className="adp-sub">
              Review on-chain payment requests and manage wallet credits
            </div>
            <div className="adp-secure"><span className="adp-secure-dot" /> Crypto payments only</div>
          </div>
        </div>
        <button className="adp-btn adp-proof" onClick={loadDeposits}>
          ↻ &nbsp; Refresh Data
        </button>
      </div>

      {error && !selected && (
        <div className="adp-alert adp-error">{error}</div>
      )}

      {success && (
        <div className="adp-alert adp-success">{success}</div>
      )}

      <div className="adp-stats">
        <div className="adp-stat">
          <div className="adp-stat-label">PENDING</div>
          <div className="adp-stat-value">{counts.pending}</div>
        </div>
        <div className="adp-stat">
          <div className="adp-stat-label">APPROVED</div>
          <div className="adp-stat-value">{counts.approved}</div>
        </div>
        <div className="adp-stat">
          <div className="adp-stat-label">REJECTED</div>
          <div className="adp-stat-value">{counts.rejected}</div>
        </div>
      </div>

      <section className="adp-card">
        <div className="adp-toolbar">
          <div>
            <div className="adp-toolbar-title">Deposit Requests</div>
            <div className="adp-toolbar-sub">Only supported cryptocurrency payment requests are shown</div>
          </div>
          <div className="adp-tabs">
            {[
              ["pending", "Pending"],
              ["approved", "Approved"],
              ["rejected", "Rejected"],
              ["all", "All Deposits"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`adp-tab ${status === value ? "active" : ""}`}
                onClick={() => setStatus(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            className="adp-input"
            placeholder="Search ID, User ID, TXID, Coin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="adp-empty">Loading deposit requests...</div>
        ) : (
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
                        <span className="adp-coin-icon">{String(item.currency || item.coin || "₿").slice(0, 1)}</span>
                        <div>
                          <div className="adp-main">{paymentLabel(item)}</div>
                          <div className="adp-muted">{item.currency || item.coin || "Crypto asset"}</div>
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
                      <div
                        className="adp-main"
                        title={item.txid}
                        style={{ maxWidth: 140, overflowWrap: "anywhere" }}
                      >
                        {item.txid}
                      </div>
                      {item.proof_url && (
                        <div style={{ marginTop: 5 }}>
                          <a
                            className="adp-proof-link"
                            href={item.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Proof ↗
                          </a>
                        </div>
                      )}
                    </td>

                    <td>
                      <span className={`adp-pill adp-${item.status}`}>
                        {item.status}
                      </span>
                    </td>

                    <td>{dateFmt(item.created_at)}</td>

                    <td>
                      {item.status === "pending" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="adp-btn adp-approve"
                            onClick={() => openReview(item, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            className="adp-btn adp-reject"
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

                {!filtered.length && (
                  <tr>
                    <td colSpan="9" className="adp-empty">
                      No crypto deposit requests found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div className="adp-modal-bg" onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeReview();
        }}>
          <div className="adp-modal">
            <h3>
              {reviewAction === "approve" ? "Approve Deposit" : "Reject Deposit"}
              {" "}#{selected.id}
            </h3>

            {error && (
              <div className="adp-alert adp-error">{error}</div>
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
                <strong>{selected.txid}</strong>
              </div>

              <div className="adp-detail">
                <small>Sender Information</small>
                <strong>{selected.sender_info || "—"}</strong>
              </div>
            </div>

            {selected.proof_url && (
              <p>
                <a
                  className="adp-proof-link"
                  href={selected.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Payment Proof ↗
                </a>
              </p>
            )}

            <label style={{
              display: "block",
              fontSize: 12,
              color: "#91a0b8",
              marginBottom: 8,
            }}>
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

            <div className="adp-modal-actions">
              <button
                className={`adp-btn ${
                  reviewAction === "approve" ? "adp-approve" : "adp-reject"
                }`}
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
                className="adp-btn adp-cancel"
                onClick={closeReview}
                disabled={processing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}