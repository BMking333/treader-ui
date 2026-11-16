import React, { useCallback, useEffect, useState } from "react";
import { api } from "../Home";

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
.aw{--a-card:#ffffff;--a-tx:#141b29;--a-mu:#8590a3;--a-ln:#e8ebf0;--a-bd:#c3cad6;--a-soft:#f4f6f9;--a-ink:#141b29;--a-inkx:#ffffff;--a-gr:#0a9f72;--a-rd:#d84d5a;--a-am:#c98a0b;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;color:var(--a-tx);padding:16px 14px 40px;max-width:980px;margin:0 auto}
.cx.dark .aw{--a-card:#14233b;--a-tx:#eaf0f8;--a-mu:#8795ac;--a-ln:#22324f;--a-bd:#3d4f70;--a-soft:#0f1c31;--a-ink:#eaf0f8;--a-inkx:#0d1626}
.aw,.aw *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.aw button{font-family:inherit;cursor:pointer}
.aw h1{margin:0 0 14px;font-size:20px;font-weight:700}

.aw-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:12px}
.aw .aw-tab{display:flex!important;align-items:center;gap:8px;flex:none;height:40px;padding:0 14px!important;border-radius:11px!important;
  border:1.5px solid var(--a-bd)!important;background:var(--a-card)!important;color:var(--a-tx)!important;font-size:13.5px;font-weight:600}
.aw .aw-tab.on{background:var(--a-ink)!important;border-color:var(--a-ink)!important;color:var(--a-inkx)!important}
.aw-tab span{min-width:22px;padding:2px 7px;border-radius:20px;background:var(--a-soft);color:var(--a-tx);font-size:11.5px;font-weight:700;text-align:center}
.aw-tab.on span{background:rgba(255,255,255,.18);color:inherit}

.aw-list{display:grid;gap:12px}
.aw-card{padding:14px 16px;border-radius:16px;background:var(--a-card);border:1px solid var(--a-ln);box-shadow:0 10px 28px -20px rgba(20,27,41,.35)}
.aw-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
.aw-hd b{font-size:15px;font-weight:700;font-variant-numeric:tabular-nums}
.aw-hd em{font-style:normal;font-size:12px;color:var(--a-mu)}
.aw-st{padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:700;color:#fff}
.aw-st.pending{background:var(--a-am)}
.aw-st.approved{background:var(--a-gr)}
.aw-st.rejected{background:var(--a-rd)}
.aw-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;font-size:13px;border-bottom:1px dashed var(--a-bd)}
.aw-row:last-of-type{border-bottom:0}
.aw-row span{color:var(--a-mu);flex:none}
.aw-row b{font-weight:600;text-align:end;word-break:break-all;font-variant-numeric:tabular-nums}
.aw-row b.gr{color:var(--a-gr)}
.aw-addr{display:flex;align-items:center;gap:8px;justify-content:flex-end}
.aw .aw-cp{flex:none;height:26px;padding:0 10px!important;border-radius:8px!important;border:1px solid var(--a-bd)!important;background:var(--a-soft)!important;color:var(--a-tx)!important;font-size:11.5px;font-weight:600}
.aw-acts{display:flex;gap:10px;margin-top:12px}
.aw .aw-btn{flex:1;height:44px;padding:0 14px!important;border:0!important;border-radius:12px!important;font-size:14px;font-weight:700;color:#fff!important}
.aw .aw-btn.ok{background:var(--a-gr)!important}
.aw .aw-btn.no{background:var(--a-rd)!important}
.aw .aw-btn:disabled{opacity:.6}
.aw-empty{padding:40px 10px;text-align:center;color:var(--a-mu);font-size:14px}

.aw-pg{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;font-size:13px;color:var(--a-mu)}
.aw .aw-pgb{height:38px;padding:0 16px!important;border-radius:10px!important;border:1.5px solid var(--a-bd)!important;background:var(--a-card)!important;color:var(--a-tx)!important;font-weight:600}
.aw .aw-pgb:disabled{opacity:.4}

.aw-ov{position:fixed;inset:0;z-index:800;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,14,26,.45);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.aw-md{width:100%;max-width:400px;padding:20px;border-radius:18px;background:var(--a-card);color:var(--a-tx);border:1px solid var(--a-ln);box-shadow:0 28px 60px -22px rgba(0,0,0,.55)}
.aw-md h3{margin:0 0 4px;font-size:16px;font-weight:700}
.aw-md p{margin:0 0 14px;font-size:12.5px;color:var(--a-mu);word-break:break-all}
.aw-md label{display:block;margin:10px 0 6px;font-size:12.5px;font-weight:600;color:var(--a-mu)}
.aw .aw-md input,.aw .aw-md textarea{width:100%;padding:12px 14px;border-radius:12px;border:1.5px solid var(--a-bd);background:var(--a-soft);color:var(--a-tx);font-family:inherit;font-size:14px;outline:0;resize:vertical}
.aw .aw-md input:focus,.aw .aw-md textarea:focus{border-color:var(--a-ink)}
.aw-mb{display:flex;gap:10px;margin-top:16px}
.aw .aw-mb button{flex:1;height:46px;padding:0 14px!important;border:0!important;border-radius:12px!important;font-size:14px;font-weight:700}
.aw .aw-mb .cn{background:var(--a-soft)!important;color:var(--a-tx)!important;border:1.5px solid var(--a-bd)!important}
.aw .aw-mb .ok{background:var(--a-gr)!important;color:#fff!important}
.aw .aw-mb .no{background:var(--a-rd)!important;color:#fff!important}
.aw .aw-mb button:disabled{opacity:.6}

.aw-toast{position:fixed;left:50%;top:22px;z-index:900;transform:translateX(-50%);max-width:90%;padding:12px 18px;border-radius:12px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 14px 30px -14px rgba(0,0,0,.6);animation:awin .2s ease}
.aw-toast.ok{background:var(--a-gr)}
.aw-toast.bad{background:var(--a-rd)}
@keyframes awin{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(8).replace(/\.?0+$/, "") : String(v ?? "");
};

const when = (v) => (v ? new Date(v).toLocaleString() : "-");

export default function AdminWithdrew() {
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

  return (
    <>
      <style>{CSS}</style>
      <div className="aw">
        <h1>Withdraw Requests</h1>

        <div className="aw-tabs">
          {TABS.map((x) => (
            <button key={x.k} type="button" className={"aw-tab" + (tab === x.k ? " on" : "")} onClick={() => changeTab(x.k)}>
              {x.l}<span>{counts[x.k] || 0}</span>
            </button>
          ))}
        </div>

        {loading && data.items.length === 0 && <div className="aw-empty">Loading...</div>}
        {!loading && data.items.length === 0 && <div className="aw-empty">No requests found</div>}

        <div className="aw-list">
          {data.items.map((r) => (
            <div className="aw-card" key={r.id}>
              <div className="aw-hd">
                <b>#{r.id} · {num(r.amount)} {r.coin}</b>
                <span className={"aw-st " + r.status}>{STATUS_L[r.status] || r.status}</span>
              </div>
              <div className="aw-row"><span>User</span><b>{r.user_email || "-"} {r.user_uid ? `(${r.user_uid})` : ""}</b></div>
              <div className="aw-row"><span>Network</span><b>{r.network}</b></div>
              <div className="aw-row">
                <span>Address</span>
                <div className="aw-addr">
                  <b>{r.address}</b>
                  <button type="button" className="aw-cp" onClick={() => copy(r.address)}>Copy</button>
                </div>
              </div>
              <div className="aw-row"><span>Fee</span><b>{num(r.fee)} {r.coin}</b></div>
              <div className="aw-row"><span>User receives</span><b className="gr">{num(r.net_amount)} {r.coin}</b></div>
              <div className="aw-row"><span>Requested</span><b>{when(r.created_at)}</b></div>
              {r.status !== "pending" && <div className="aw-row"><span>Reviewed</span><b>{when(r.reviewed_at)}</b></div>}
              {r.txid && <div className="aw-row"><span>TXID</span><b>{r.txid}</b></div>}
              {r.admin_note && <div className="aw-row"><span>Note</span><b>{r.admin_note}</b></div>}

              {r.status === "pending" && (
                <div className="aw-acts">
                  <button type="button" className="aw-btn ok" onClick={() => openModal("approve", r)}>Approve</button>
                  <button type="button" className="aw-btn no" onClick={() => openModal("reject", r)}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {data.total > SIZE && (
          <div className="aw-pg">
            <button type="button" className="aw-pgb" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
            <span>{page} / {pages}</span>
            <button type="button" className="aw-pgb" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>Next ›</button>
          </div>
        )}

        {modal && (
          <div className="aw-ov" onClick={closeModal}>
            <div className="aw-md" onClick={(e) => e.stopPropagation()}>
              {modal.type === "approve" ? (
                <>
                  <h3>Approve #{modal.row.id}</h3>
                  <p>{num(modal.row.net_amount)} {modal.row.coin} → {modal.row.address}</p>
                  <label>TXID (optional)</label>
                  <input value={txid} onChange={(e) => setTxid(e.target.value)} placeholder="Transaction hash" autoComplete="off" />
                  <label>Note (optional)</label>
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="aw-mb">
                    <button type="button" className="cn" onClick={closeModal}>Cancel</button>
                    <button type="button" className="ok" disabled={busy} onClick={doApprove}>Confirm</button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Reject #{modal.row.id}</h3>
                  <p>{num(modal.row.amount)} {modal.row.coin} will be refunded to the user's balance</p>
                  <label>Reason (required)</label>
                  <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div className="aw-mb">
                    <button type="button" className="cn" onClick={closeModal}>Cancel</button>
                    <button type="button" className="no" disabled={busy} onClick={doReject}>Confirm Reject</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {toast.m && <div className={"aw-toast " + (toast.ok ? "ok" : "bad")} key={toast.n}>{toast.m}</div>}
      </div>
    </>
  );
}
