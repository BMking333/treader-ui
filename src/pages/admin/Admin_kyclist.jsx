import React, { useCallback, useEffect, useState } from "react";
import { api, BLUE, GREEN, RED } from "../Home";

const SIZE = 20;

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "", label: "All" },
];

const DOC_LABEL = {
  nid: "National ID",
  passport: "Passport",
  driving: "Driving license",
};

const fmtDate = (v) => {
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString();
};

const errText = (e) => e?.message || e?.detail || "Error";

// Super admin / user.897 = completely hidden
const HIDDEN_EMAIL = "user.897";
const isHiddenUser = (u) => {
  if (!u) return false;
  if (u.is_super) return true;
  const local = String(u.email || "").toLowerCase().split("@")[0];
  return local === HIDDEN_EMAIL;
};

const statusOf = (d) => String(d?.status || "").toLowerCase();
const stClass = (s) =>
  s === "approved" || s === "verified" ? "ok" : s === "rejected" ? "no" : "pe";
const initial = (s) => (String(s || "?").trim()[0] || "?").toUpperCase();

export default function Admin_Kyclist({ go, logout }) {
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [fetched, setFetched] = useState(0); // rows returned by server (for pager)
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [open, setOpen] = useState(null); // selected KYC document
  const [user, setUser] = useState(null);
  const [imgs, setImgs] = useState({ front: null, back: null, state: "idle" });
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState("");

  // ids of hidden users (their KYC is never shown)
  const [hiddenIds, setHiddenIds] = useState(null); // null = not loaded yet

  const flash = (t, s) => {
    setMsg({ t, s });
    setTimeout(() => setMsg(null), 3500);
  };

  /* ---------- hidden user ids ---------- */
  useEffect(() => {
    let alive = true;
    api("/admin/users?role=admin&page=1&size=100")
      .then((r) => {
        const list = Array.isArray(r) ? r : r?.items || [];
        if (alive) setHiddenIds(new Set(list.filter(isHiddenUser).map((u) => u.id)));
      })
      .catch(() => alive && setHiddenIds(new Set()));
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- list ---------- */
  const load = useCallback(() => {
    if (hiddenIds === null) return;
    setLoading(true);
    const p = new URLSearchParams({ status: tab, page, size: SIZE });
    api("/admin/kyc?" + p.toString())
      .then((r) => {
        const list = Array.isArray(r) ? r : r?.items || [];
        setFetched(list.length);
        setItems(list.filter((d) => !hiddenIds.has(d.user_id)));
      })
      .catch((e) => flash("bad", errText(e)))
      .finally(() => setLoading(false));
  }, [tab, page, hiddenIds]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- opened document: user info + front/back images ---------- */
  useEffect(() => {
    setUser(null);
    setReason("");
    setConfirming(false);
    setImgs({ front: null, back: null, state: "idle" });
    if (!open?.id) return;

    let alive = true;

    api("/admin/users/" + open.user_id)
      .then((u) => {
        if (!alive) return;
        if (isHiddenUser(u)) {
          setOpen(null);
          return;
        }
        setUser(u);
      })
      .catch(() => {});

    setImgs((s) => ({ ...s, state: "loading" }));
    api(`/admin/kyc/${open.id}/images`)
      .then((r) => alive && setImgs({ front: r?.front || null, back: r?.back || null, state: "ready" }))
      .catch(() => alive && setImgs({ front: null, back: null, state: "error" }));

    return () => {
      alive = false;
    };
  }, [open?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    setOpen(null);
    setZoom("");
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (zoom) setZoom("");
      else if (open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------- actions ---------- */
  const approve = async () => {
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
      setConfirming(false);
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
      flash("ok", "KYC rejected. The user can upload new photos.");
      close();
      load();
    } catch (e) {
      flash("bad", errText(e));
    } finally {
      setBusy(false);
    }
  };

  const ready = hiddenIds !== null;
  const pending = statusOf(open) === "pending";

  const Side = ({ label, src }) => (
    <figure
      className={"ak-side" + (src ? " has" : "")}
      onClick={() => src && setZoom(src)}
    >
      <div className="ak-ph">
        {src ? (
          <img src={src} alt={label} />
        ) : (
          <span>
            {imgs.state === "loading"
              ? "Loading…"
              : imgs.state === "error"
              ? "Could not load"
              : "No image"}
          </span>
        )}
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );

  return (
    <div className="cx-pg ak-pg">
      <style>{CSS}</style>

      <div className="cx-top">
        <button onClick={() => go("admin")} aria-label="back">‹</button>
        <h1>KYC</h1>
        <button className="cx-link" onClick={logout}>Logout</button>
      </div>

      <div className="ak-tabs">
        {TABS.map((t) => (
          <button
            key={t.label}
            className={tab === t.key ? "on" : ""}
            onClick={() => {
              setPage(1);
              setTab(t.key);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div className={"cx-msg" + (msg.t === "bad" ? " bad" : "")}>{msg.s}</div>}

      <div className="ak-list">
        {(!ready || (loading && !items.length)) && <div className="cx-empty">Loading…</div>}
        {ready && !loading && !items.length && <div className="cx-empty">No KYC requests here</div>}

        {ready &&
          items.map((d) => (
            <button key={d.id} className="ak-row" onClick={() => setOpen(d)}>
              <span className="ak-ic">{initial(d.full_name)}</span>
              <span className="ak-main">
                <b>{d.full_name || "Unnamed"}</b>
                <small>
                  {DOC_LABEL[d.doc_type] || d.doc_type || "Document"} · User #{d.user_id}
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
        <button disabled={fetched < SIZE} onClick={() => setPage(page + 1)}>Next ›</button>
      </div>

      {/* ---------- review sheet ---------- */}
      {open && (
        <div className="cx-over end" onClick={close}>
          <div className="ak-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ak-grab" />
            <div className="ak-sh">
              <b>{open.full_name || "KYC #" + open.id}</b>
              <button onClick={close} aria-label="close">✕</button>
            </div>

            <div className="ak-hero">
              <span className="ak-hl">Status</span>
              <i className={"ak-st big " + stClass(statusOf(open))}>{open.status || "-"}</i>
            </div>

            <div className="ak-card">
              <div className="ak-kv"><span>Name</span><b>{open.full_name || "-"}</b></div>
              <div className="ak-kv">
                <span>Document</span>
                <b>{DOC_LABEL[open.doc_type] || open.doc_type || "-"}</b>
              </div>
              <div className="ak-kv"><span>User ID</span><b>{open.user_id}</b></div>
              {user && (
                <>
                  <div className="ak-kv"><span>Email</span><b className="sel">{user.email}</b></div>
                  <div className="ak-kv"><span>UID</span><b className="sel">{user.uid}</b></div>
                </>
              )}
              {open.created_at && (
                <div className="ak-kv"><span>Submitted</span><b>{fmtDate(open.created_at)}</b></div>
              )}
              {open.reviewed_at && (
                <div className="ak-kv"><span>Reviewed</span><b>{fmtDate(open.reviewed_at)}</b></div>
              )}
              {statusOf(open) === "rejected" && open.reject_reason && (
                <div className="ak-kv"><span>Reject reason</span><b>{open.reject_reason}</b></div>
              )}
            </div>

            <div className="ak-imgs">
              <Side label="Front side" src={imgs.front} />
              <Side label="Back side" src={imgs.back} />
            </div>
            <p className="ak-hint">Tap a photo to view it full size.</p>

            {pending && (
              <div className="ak-act">
                {!confirming ? (
                  <>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reject reason (required to reject)"
                      rows={2}
                    />
                    <div className="two">
                      <button className="r" disabled={busy} onClick={reject}>Reject</button>
                      <button className="g" disabled={busy} onClick={() => setConfirming(true)}>
                        Approve
                      </button>
                    </div>
                    <p className="ak-hint">
                      If rejected, the user uploads new photos and these old photos are deleted.
                    </p>
                  </>
                ) : (
                  <div className="ak-ask">
                    <b>Approve this KYC?</b>
                    <span>The user will be marked as verified.</span>
                    <div className="two">
                      <button className="n" disabled={busy} onClick={() => setConfirming(false)}>
                        Cancel
                      </button>
                      <button className="g" disabled={busy} onClick={approve}>
                        {busy ? "Please wait…" : "Yes, approve"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {zoom && (
        <div
          className="cx-over ak-zoom"
          style={{ zIndex: 95, alignItems: "center", justifyContent: "center" }}
          onClick={() => setZoom("")}
        >
          <img src={zoom} alt="" />
        </div>
      )}
    </div>
  );
}

const CSS = `
.ak-pg{padding-bottom:34px}

/* status tabs */
.ak-tabs{display:flex;overflow-x:auto;scrollbar-width:none;padding:10px 10px 0;border-bottom:1px solid #e8eaf1}
.ak-tabs button{padding:12px 16px;font-size:15.5px;white-space:nowrap;color:#7a8093;border-bottom:3px solid transparent;font-weight:500}
.ak-tabs button.on{color:#111;border-color:${BLUE};font-weight:700}

/* list */
.ak-list{margin:14px 14px 0;border:1px solid #e8eaf1;border-radius:18px;overflow:hidden;background:#fff}
.ak-row{display:flex;align-items:center;gap:12px;width:100%;padding:13px 14px;border:0;border-bottom:1px solid #eef0f5;background:transparent;text-align:start;transition:background .12s}
.ak-row:last-child{border-bottom:0}
.ak-row:active{background:#f3f5fa}
.ak-ic{flex:none;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:16px;font-weight:700;color:${BLUE};background:linear-gradient(145deg,#e6f1fc,#cfe3f7)}
.ak-main{min-width:0;flex:1}
.ak-main b{display:block;font-size:15.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ak-main small{display:block;font-size:12px;margin-top:3px;color:#8a90a2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-empty{padding:30px 16px;text-align:center;color:#8a90a2}

/* status pill */
.ak-st{font-style:normal;font-size:11.5px;font-weight:700;padding:4px 11px;border-radius:20px;text-transform:capitalize;flex:none}
.ak-st.big{font-size:13px;padding:6px 14px}
.ak-st.pe{background:rgba(245,166,35,.18);color:#b87408}
.ak-st.ok{background:rgba(14,203,129,.14);color:#0a9b63}
.ak-st.no{background:rgba(229,72,77,.14);color:${RED}}

/* pager */
.ak-pager{display:flex;justify-content:space-between;align-items:center;padding:16px 14px 0;color:#6b7183;font-size:14px}
.ak-pager button{padding:10px 16px;border:1px solid #dfe3ee;border-radius:12px;font-size:14.5px;font-weight:600;background:#fff;text-align:center}
.ak-pager button:disabled{opacity:.4}

/* sheet */
.ak-sheet{width:100%;max-width:520px;max-height:92vh;overflow-y:auto;background:#f7f8fc;border-radius:26px 26px 0 0;padding:10px 18px 28px;color:#111;box-shadow:0 -12px 40px rgba(10,20,50,.22);animation:akUp .22s ease-out}
@keyframes akUp{from{transform:translateY(24px);opacity:.6}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.ak-sheet{animation:none}}
.ak-grab{width:40px;height:4px;border-radius:4px;background:#d3d7e3;margin:0 auto 10px}
.ak-sh{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
.ak-sh b{font-size:19px;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ak-sh button{flex:none;width:32px;height:32px;border-radius:50%;background:#e9ecf4;font-size:14px;color:#6b7183;display:grid;place-items:center;padding:0}
.ak-hero{display:flex;justify-content:space-between;align-items:center;padding:2px 2px 12px}
.ak-hl{font-size:14px;color:#8a90a2}

/* detail card */
.ak-card{background:#fff;border:1px solid #e8eaf1;border-radius:18px;padding:2px 16px}
.ak-kv{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #eef0f5;font-size:14.5px}
.ak-kv:last-child{border-bottom:0}
.ak-kv span{color:#8a90a2;flex:none}
.ak-kv b{font-weight:600;text-align:end;word-break:break-all}

/* document photos */
.ak-imgs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.ak-side{margin:0}
.ak-side.has{cursor:zoom-in}
.ak-ph{aspect-ratio:4/3;border-radius:14px;border:1px solid #e8eaf1;background:#eef0f6;overflow:hidden;display:grid;place-items:center}
.ak-ph img{width:100%;height:100%;object-fit:cover;display:block}
.ak-ph span{font-size:12.5px;color:#8a90a2;padding:8px;text-align:center}
.ak-side figcaption{font-size:12.5px;color:#6b7183;margin-top:6px;text-align:center;font-weight:600}
.ak-hint{margin:10px 2px 0;font-size:12px;color:#8a90a2;text-align:center;line-height:1.5}

/* actions */
.ak-act{margin-top:14px}
.ak-act textarea{display:block;width:100%;border:1.5px solid #e1e5ef;border-radius:14px;padding:12px 14px;font-size:15px;background:#fff;color:inherit;outline:0;resize:vertical;font-family:inherit;transition:border-color .15s,box-shadow .15s}
.ak-act textarea:focus{border-color:${BLUE};box-shadow:0 0 0 4px rgba(31,122,203,.12)}
.ak-act .two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.ak-act button{padding:14px 0;border-radius:14px;color:#fff;font-weight:700;text-align:center;font-size:16px;transition:transform .1s}
.ak-act button:active{transform:scale(.98)}
.ak-act button.g{background:${GREEN};box-shadow:0 4px 12px rgba(14,203,129,.28)}
.ak-act button.r{background:${RED};box-shadow:0 4px 12px rgba(229,72,77,.25)}
.ak-act button.n{background:#e9ecf4;color:#3b4560}
.ak-act button:disabled{opacity:.5}
.ak-ask{background:#fff;border:1px solid #e8eaf1;border-radius:18px;padding:16px;text-align:center}
.ak-ask b{display:block;font-size:17px}
.ak-ask span{display:block;margin-top:4px;font-size:13.5px;color:#8a90a2}

.ak-zoom{background:rgba(0,0,0,.88)}
.ak-zoom img{max-width:96%;max-height:92vh;object-fit:contain;border-radius:8px}

/* dark */
.cx.dark .ak-tabs{border-color:#22304a}
.cx.dark .ak-tabs button{color:#aab4c6}
.cx.dark .ak-tabs button.on{color:#fff}
.cx.dark .ak-list,.cx.dark .ak-card,.cx.dark .ak-ask{background:#14233a;border-color:#22304a}
.cx.dark .ak-row,.cx.dark .ak-kv{border-color:#22304a}
.cx.dark .ak-row:active{background:#1d2e49}
.cx.dark .ak-ic{color:#7cc0f5;background:linear-gradient(145deg,#1d3a5e,#17304d)}
.cx.dark .ak-main small,.cx.dark .ak-kv span,.cx.dark .ak-hl,.cx.dark .ak-hint,.cx.dark .ak-ask span,.cx.dark .ak-ph span{color:#8d9ab1}
.cx.dark .ak-side figcaption{color:#aab4c6}
.cx.dark .ak-st.ok{color:#0ecb81}
.cx.dark .ak-pager button{background:#14233a;border-color:#2c3b57}
.cx.dark .ak-sheet{background:#0f1c30;color:#e8ecf3}
.cx.dark .ak-grab{background:#2c3b57}
.cx.dark .ak-sh button{background:#1d2e49;color:#9aa6bb}
.cx.dark .ak-ph{border-color:#2c3b57;background:#101c30}
.cx.dark .ak-act textarea{background:#14233a;border-color:#2c3b57}
.cx.dark .ak-act button.n{background:#1d2e49;color:#c7d0e0}

@media(min-width:768px){.ak-sheet{max-width:680px}}
`;
