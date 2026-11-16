import React, { useCallback, useEffect, useState } from "react";
import { api, BLUE, GREEN, RED } from "../Home";

/* =========================================================
   Admin_kyclist  —  /v2/admin-dashbord/kyc
   Backend: GET /admin/kyc?status=&page=&size=
            POST /admin/kyc/{id}/approve
            POST /admin/kyc/{id}/reject  { reason }
            GET  /admin/users/{user_id}
========================================================= */

const SIZE = 20;

// backend e status value onno rokom hole (jemon "verified") ekhane bodlan
const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "", label: "All" },
];

const IMG_KEY = /(image|img|photo|front|back|selfie|picture|file|path|url)/i;

const isImgVal = (k, v) =>
  typeof v === "string" &&
  v.length > 1 &&
  (/^(https?:)?\/\//.test(v) || v.startsWith("/") || /\.(png|jpe?g|webp|gif)$/i.test(v)) &&
  (IMG_KEY.test(k) || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(v));

const fmtDate = (v) => {
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString();
};

const errText = (e) => e?.message || e?.detail || "Error";

export default function Admin_Kyclist({ me, go, logout }) {
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState(null); // doc
  const [user, setUser] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState("");

  const flash = (t, s) => {
    setMsg({ t, s });
    setTimeout(() => setMsg(null), 3500);
  };

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ status: tab, page, size: SIZE });
    api("/admin/kyc?" + p.toString())
      .then((r) => setItems(Array.isArray(r) ? r : r?.items || []))
      .catch((e) => flash("bad", errText(e)))
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  // doc open holei user er info anbo
  useEffect(() => {
    setUser(null);
    setReason("");
    if (!open?.user_id) return;
    api("/admin/users/" + open.user_id)
      .then(setUser)
      .catch(() => {});
  }, [open?.id]);

  const close = () => {
    setOpen(null);
    setZoom("");
  };

  const approve = async () => {
    if (!window.confirm("Approve this KYC?")) return;
    setBusy(true);
    try {
      await api("/admin/kyc/" + open.id + "/approve", { method: "POST" });
      flash("ok", "KYC approved");
      close();
      load();
    } catch (e) {
      flash("bad", errText(e));
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!reason.trim()) return flash("bad", "Write a reject reason");
    setBusy(true);
    try {
      await api("/admin/kyc/" + open.id + "/reject", {
        method: "POST",
        body: { reason: reason.trim() },
      });
      flash("ok", "KYC rejected");
      close();
      load();
    } catch (e) {
      flash("bad", errText(e));
    } finally {
      setBusy(false);
    }
  };

  const statusOf = (d) => String(d.status || "").toLowerCase();
  const stClass = (s) =>
    s === "approved" || s === "verified" ? "ok" : s === "rejected" ? "no" : "pe";

  const entries = open
    ? Object.entries(open).filter(([k]) => !["id", "user_id", "status"].includes(k))
    : [];
  const imgs = entries.filter(([k, v]) => isImgVal(k, v));
  const rest = entries.filter(([k, v]) => !isImgVal(k, v) && v !== null && v !== "" && typeof v !== "object");

  return (
    <div className="cx-pg ak-pg">
      <style>{CSS}</style>

      <div className="cx-top">
        <button onClick={() => go("admin")} aria-label="back">‹</button>
        <h1>KYC</h1>
        <button className="cx-link" onClick={logout}>Logout</button>
      </div>

      <div className="ak-nav">
        <button className="on">KYC</button>
        <button onClick={() => go("adminUsers")}>Users</button>
      </div>

      <div className="ak-tabs">
        {TABS.map((t) => (
          <button
            key={t.label}
            className={tab === t.key ? "on" : ""}
            onClick={() => { setPage(1); setTab(t.key); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div className={"cx-msg" + (msg.t === "bad" ? " bad" : "")}>{msg.s}</div>}

      <div className="ak-list">
        {loading && !items.length && <div className="cx-empty">Loading…</div>}
        {!loading && !items.length && <div className="cx-empty">No KYC requests</div>}

        {items.map((d) => (
          <button key={d.id} className="ak-row" onClick={() => setOpen(d)}>
            <span className="ak-main">
              <b>KYC #{d.id}</b>
              <small>
                User #{d.user_id}
                {d.created_at ? " · " + fmtDate(d.created_at) : ""}
              </small>
            </span>
            <i className={"ak-st " + stClass(statusOf(d))}>{d.status || "-"}</i>
          </button>
        ))}
      </div>

      <div className="ak-pager">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
        <span>Page {page}</span>
        <button disabled={items.length < SIZE} onClick={() => setPage(page + 1)}>Next ›</button>
      </div>

      {open && (
        <div className="cx-over end" onClick={close}>
          <div className="ak-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ak-sh">
              <b>KYC #{open.id}</b>
              <button onClick={close}>✕</button>
            </div>

            <div className="ak-kv"><span>Status</span><b>{open.status}</b></div>
            <div className="ak-kv"><span>User ID</span><b>{open.user_id}</b></div>
            {user && (
              <>
                <div className="ak-kv"><span>Email</span><b className="sel">{user.email}</b></div>
                <div className="ak-kv"><span>UID</span><b className="sel">{user.uid}</b></div>
                {user.full_name && <div className="ak-kv"><span>Name</span><b>{user.full_name}</b></div>}
              </>
            )}
            {rest.map(([k, v]) => (
              <div className="ak-kv" key={k}>
                <span>{k}</span>
                <b className="sel">{/(_at|date)$/i.test(k) ? fmtDate(v) : String(v)}</b>
              </div>
            ))}

            {imgs.length > 0 && (
              <div className="ak-imgs">
                {imgs.map(([k, v]) => (
                  <figure key={k} onClick={() => setZoom(v)}>
                    <img src={v} alt={k} />
                    <figcaption>{k}</figcaption>
                  </figure>
                ))}
              </div>
            )}

            {statusOf(open) === "pending" && (
              <div className="ak-act">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reject reason (required to reject)"
                  rows={2}
                />
                <div className="two">
                  <button className="r" disabled={busy} onClick={reject}>Reject</button>
                  <button className="g" disabled={busy} onClick={approve}>Approve</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {zoom && (
        <div className="cx-over ak-zoom" style={{ zIndex: 95, alignItems: "center", justifyContent: "center" }} onClick={() => setZoom("")}>
          <img src={zoom} alt="" />
        </div>
      )}
    </div>
  );
}

const CSS = `
.ak-pg{padding-bottom:30px}
.ak-nav{display:flex;gap:8px;padding:10px 14px 0}
.ak-nav button{flex:1;text-align:center;padding:10px 0;border-radius:10px;border:1px solid #d5d9e4;font-size:15px}
.ak-nav button.on{background:${BLUE};border-color:${BLUE};color:#fff}
.ak-tabs{display:flex;overflow-x:auto;scrollbar-width:none;padding:8px 10px 0;border-bottom:1px solid #e5e6ec}
.ak-tabs button{padding:12px 16px;font-size:16px;white-space:nowrap;color:#666;border-bottom:3px solid transparent}
.ak-tabs button.on{color:#000;border-color:${BLUE};font-weight:600}
.ak-row{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;padding:14px;border-bottom:1px solid #e5e6ec}
.ak-row:active{background:#f3f4f8}
.ak-main b{display:block;font-size:16px;font-weight:600}
.ak-main small{font-size:12px;margin-top:2px}
.ak-st{font-style:normal;font-size:12px;padding:4px 10px;border-radius:12px;text-transform:capitalize;flex:none}
.ak-st.pe{background:rgba(245,166,35,.18);color:#b87408}
.ak-st.ok{background:rgba(14,203,129,.15);color:#0a9b63}
.ak-st.no{background:rgba(229,72,77,.15);color:${RED}}
.ak-pager{display:flex;justify-content:space-between;align-items:center;padding:14px}
.ak-pager button{padding:10px 16px;border:1px solid #d5d9e4;border-radius:10px;font-size:15px;text-align:center}
.ak-pager button:disabled{opacity:.4}
.ak-sheet{width:100%;max-width:520px;max-height:90vh;overflow-y:auto;background:#fff;border-radius:22px 22px 0 0;padding:20px 20px 26px;color:#111}
.ak-sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.ak-sh b{font-size:19px;font-weight:600}
.ak-sh button{font-size:20px;color:#9aa0ad;padding:4px 8px}
.ak-kv{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #eceef3;font-size:15px}
.ak-kv span{color:#8a8d99;flex:none}
.ak-kv b{font-weight:500;text-align:end;word-break:break-all}
.ak-imgs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.ak-imgs figure{margin:0;cursor:zoom-in}
.ak-imgs img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;border:1px solid #e5e6ec;background:#f3f4f8}
.ak-imgs figcaption{font-size:12px;color:#8a8d99;margin-top:4px;text-align:center}
.ak-act{margin-top:18px}
.ak-act textarea{display:block;width:100%;border:1.5px solid #dfe3ec;border-radius:10px;padding:10px 12px;font-size:15px;background:transparent;color:inherit;outline:0;resize:vertical;font-family:inherit}
.ak-act textarea:focus{border-color:${BLUE}}
.ak-act .two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.ak-act button{padding:14px 0;border-radius:10px;color:#fff;font-weight:700;text-align:center;font-size:16px}
.ak-act button.g{background:${GREEN}}
.ak-act button.r{background:${RED}}
.ak-act button:disabled{opacity:.5}
.ak-zoom{background:rgba(0,0,0,.88)}
.ak-zoom img{max-width:96%;max-height:92vh;object-fit:contain;border-radius:8px}
.cx.dark .ak-nav button,.cx.dark .ak-pager button{border-color:#2c3b57}
.cx.dark .ak-tabs,.cx.dark .ak-row,.cx.dark .ak-kv{border-color:#22304a}
.cx.dark .ak-tabs button{color:#aab4c6}.cx.dark .ak-tabs button.on{color:#fff}
.cx.dark .ak-row:active{background:#1d2e49}
.cx.dark .ak-sheet{background:#17263d;color:#e8ecf3}
.cx.dark .ak-imgs img{border-color:#2c3b57;background:#101c30}
.cx.dark .ak-act textarea{border-color:#2c3b57}
@media(min-width:768px){.ak-sheet{max-width:640px}}
`;
