
import React, { useCallback, useEffect, useState } from "react";
import { api } from "./Home";

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

      setDeposits(Array.isArray(data) ? data : data?.items || []);
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
          --bg:#0b1020; --card:#121a2b; --border:#26334a;
          --text:#edf3ff; --muted:#91a0b8;
          min-height:100%; background:var(--bg);
          color:var(--text); padding:22px;
          font-family:Inter,Arial,sans-serif;
        }
        .adp * { box-sizing:border-box; }
        .adp-head {
          display:flex; justify-content:space-between;
          align-items:center; flex-wrap:wrap; gap:12px;
          margin-bottom:20px;
        }
        .adp-title { font-size:23px; font-weight:800; margin:0; }
        .adp-sub { font-size:13px; color:var(--muted); margin-top:6px; }
        .adp-card {
          background:var(--card); border:1px solid var(--border);
          border-radius:14px; padding:18px; margin-bottom:17px;
        }
        .adp-stats {
          display:grid; grid-template-columns:repeat(3,minmax(0,1fr));
          gap:12px; margin-bottom:18px;
        }
        .adp-stat {
          background:var(--card); border:1px solid var(--border);
          border-radius:12px; padding:16px;
        }
        .adp-stat-label { color:var(--muted); font-size:11px; font-weight:700; }
        .adp-stat-value { font-size:25px; font-weight:850; margin-top:9px; }
        .adp-tabs { display:flex; gap:8px; flex-wrap:wrap; }
        .adp-tab {
          padding:9px 14px; border:1px solid var(--border);
          border-radius:9px; background:#0c1424;
          color:var(--muted); cursor:pointer;
          font-size:12px; font-weight:750;
        }
        .adp-tab.active { color:white; background:#17366c; border-color:#397df6; }
        .adp-toolbar {
          display:flex; justify-content:space-between;
          align-items:center; gap:12px; flex-wrap:wrap;
          margin-bottom:15px;
        }
        .adp-input {
          width:100%; max-width:330px;
          background:#0c1424; color:var(--text);
          border:1px solid var(--border);
          border-radius:9px; padding:11px 12px;
          outline:none; font-size:13px;
        }
        .adp-table-wrap { overflow-x:auto; }
        .adp-table { width:100%; min-width:950px; border-collapse:collapse; }
        .adp-table th {
          text-align:left; color:var(--muted);
          font-size:10px; letter-spacing:.5px;
          padding:12px; border-bottom:1px solid var(--border);
        }
        .adp-table td {
          font-size:12px; padding:13px 12px;
          border-bottom:1px solid var(--border);
          vertical-align:middle;
        }
        .adp-main { font-weight:800; }
        .adp-muted { color:var(--muted); margin-top:4px; font-size:11px; }
        .adp-pill {
          display:inline-block; border-radius:30px;
          padding:5px 9px; font-size:10px; font-weight:850;
          text-transform:uppercase;
        }
        .adp-pending { background:#3b321b; color:#f2d36e; }
        .adp-approved { background:#12372d; color:#69e5ae; }
        .adp-rejected { background:#3a1c28; color:#ff9ba1; }
        .adp-btn {
          border:0; border-radius:7px; padding:8px 11px;
          font-size:11px; font-weight:800; cursor:pointer;
        }
        .adp-approve { background:#123d30; color:#65e3a8; }
        .adp-reject { background:#44202b; color:#ff9ba1; }
        .adp-proof { background:#203d70; color:#b8d2ff; }
        .adp-empty { padding:35px; text-align:center; color:var(--muted); }
        .adp-alert {
          padding:11px 13px; border-radius:9px;
          font-size:13px; margin-bottom:14px;
        }
        .adp-error { background:#3a1c28; color:#ff9ba1; }
        .adp-success { background:#12372d; color:#69e5ae; }
        .adp-modal-bg {
          position:fixed; inset:0; z-index:9999;
          display:flex; justify-content:center; align-items:center;
          padding:16px; background:rgba(0,0,0,.76);
        }
        .adp-modal {
          width:100%; max-width:520px; max-height:90vh;
          overflow:auto; background:#121a2b;
          border:1px solid var(--border); border-radius:15px;
          padding:21px;
        }
        .adp-modal h3 { margin:0 0 16px; font-size:18px; }
        .adp-details {
          display:grid; grid-template-columns:1fr 1fr; gap:12px;
          margin-bottom:16px;
        }
        .adp-detail {
          background:#0c1424; border:1px solid var(--border);
          padding:11px; border-radius:9px; min-width:0;
        }
        .adp-detail small { color:var(--muted); display:block; margin-bottom:6px; }
        .adp-detail strong { font-size:12px; overflow-wrap:anywhere; }
        .adp-textarea {
          width:100%; min-height:90px; resize:vertical;
          background:#0c1424; color:var(--text);
          border:1px solid var(--border); border-radius:9px;
          padding:12px; outline:none; font-size:13px;
        }
        .adp-modal-actions { display:flex; gap:9px; margin-top:15px; }
        .adp-modal-actions button { flex:1; padding:11px; }
        .adp-cancel { background:#253149; color:#fff; }
        .adp-proof-link { color:#8ab8ff; text-decoration:none; }
        @media(max-width:650px) {
          .adp { padding:13px; }
          .adp-title { font-size:20px; }
          .adp-stats { gap:7px; }
          .adp-stat { padding:11px; }
          .adp-stat-value { font-size:20px; }
          .adp-details { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="adp-head">
        <div>
          <h1 className="adp-title">Deposit Management</h1>
          <div className="adp-sub">
            Review user deposits and manage wallet credits
          </div>
        </div>

        <button className="adp-btn adp-proof" onClick={loadDeposits}>
          ↻ Refresh
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
                      <div className="adp-main">{item.coin}</div>
                      <div className="adp-muted">{item.currency}</div>
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
                      No deposit requests found.
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
                <strong>#{selected.payment_method_id}</strong>
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
