import React, { useCallback, useEffect, useState } from "react";
import { api, setToken, BLUE, GREEN, RED } from "../Home";

/* =========================================================
   Admin_Userlist  —  /v2/admin-dashbord/users
   Backend: GET /admin/users, PATCH/DELETE /admin/users/{id},
            POST /admin/users/{id}/password, /login-as, POST /admin/admins
========================================================= */

const SIZE = 20;

const qs = (o) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) p.set(k, v);
  });
  return p.toString();
};

const fmtDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString();
};

const errText = (e) => e?.message || e?.detail || "Error";

export default function Admin_Userlist({ me, go, logout }) {
  const [q, setQ] = useState("");
  const [qIn, setQIn] = useState("");
  const [verify, setVerify] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // {t:"ok"|"bad", s}
  const [sel, setSel] = useState(null); // selected user
  const [mode, setMode] = useState(""); // "" | edit | pw | create

  const isSuper = !!me?.is_super;

  const load = useCallback(() => {
    setLoading(true);
    api(
      "/admin/users?" +
        qs({
          q,
          verify_status: verify,
          role,
          is_active: active,
          page,
          size: SIZE,
        })
    )
      .then((r) => setData(r || { total: 0, items: [] }))
      .catch((e) => setMsg({ t: "bad", s: errText(e) }))
      .finally(() => setLoading(false));
  }, [q, verify, role, active, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.max(1, Math.ceil((data.total || 0) / SIZE));

  const search = (e) => {
    e.preventDefault();
    setPage(1);
    setQ(qIn.trim());
  };

  const flash = (t, s) => {
    setMsg({ t, s });
    setTimeout(() => setMsg(null), 3500);
  };

  const close = () => {
    setSel(null);
    setMode("");
  };

  /* ---------- actions ---------- */
  const patch = async (u, body, okText = "Saved") => {
    try {
      const r = await api("/admin/users/" + u.id, { method: "PATCH", body });
      setSel(r || { ...u, ...body });
      flash("ok", okText);
      load();
      return true;
    } catch (e) {
      flash("bad", errText(e));
      return false;
    }
  };

  const toggleActive = (u) => {
    const next = u.is_active === false;
    if (!window.confirm(next ? "Activate this user?" : "Disable (ban) this user?")) return;
    patch(u, { is_active: next }, next ? "User activated" : "User disabled");
  };

  const loginAs = async (u) => {
    if (!window.confirm("Login as " + u.email + " ?")) return;
    try {
      const r = await api("/admin/users/" + u.id + "/login-as", { method: "POST" });
      const token = r?.access_token || r?.token;
      if (!token) throw new Error("Token missing");
      setToken(token);
      window.location.href = "/";
    } catch (e) {
      flash("bad", errText(e));
    }
  };

  const del = async (u) => {
    if (!window.confirm("DELETE " + u.email + " permanently? This cannot be undone.")) return;
    try {
      await api("/admin/users/" + u.id, { method: "DELETE" });
      flash("ok", "User deleted");
      close();
      load();
    } catch (e) {
      flash("bad", errText(e));
    }
  };

  return (
    <div className="cx-pg au-pg">
      <style>{CSS}</style>

      <div className="cx-top">
        <button onClick={() => go("admin")} aria-label="back">‹</button>
        <h1>Users <small>({data.total || 0})</small></h1>
        <button className="cx-link" onClick={logout}>Logout</button>
      </div>

      <div className="au-nav">
        <button onClick={() => go("adminKyc")}>KYC</button>
        <button className="on">Users</button>
        {isSuper && (
          <button onClick={() => { setSel(null); setMode("create"); }}>+ Admin</button>
        )}
      </div>

      <form className="au-search" onSubmit={search}>
        <input
          value={qIn}
          onChange={(e) => setQIn(e.target.value)}
          placeholder="Email / UID / name / phone"
        />
        <button type="submit">Search</button>
      </form>

      <div className="au-filters">
        <select value={verify} onChange={(e) => { setPage(1); setVerify(e.target.value); }}>
          <option value="">KYC: all</option>
          <option value="unverified">unverified</option>
          <option value="pending">pending</option>
          <option value="verified">verified</option>
          <option value="rejected">rejected</option>
        </select>
        <select value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}>
          <option value="">Role: all</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <select value={active} onChange={(e) => { setPage(1); setActive(e.target.value); }}>
          <option value="">Status: all</option>
          <option value="true">active</option>
          <option value="false">disabled</option>
        </select>
      </div>

      {msg && <div className={"cx-msg" + (msg.t === "bad" ? " bad" : "")}>{msg.s}</div>}

      <div className="au-list">
        {loading && !data.items?.length && <div className="cx-empty">Loading…</div>}
        {!loading && !data.items?.length && <div className="cx-empty">No users found</div>}

        {(data.items || []).map((u) => (
          <button key={u.id} className="au-row" onClick={() => { setSel(u); setMode(""); }}>
            <span className="au-main">
              <b>{u.email}</b>
              <small>
                UID {u.uid}
                {u.full_name ? " · " + u.full_name : ""}
              </small>
            </span>
            <span className="au-tags">
              {u.role === "admin" && <i className="tg ad">{u.is_super ? "super" : "admin"}</i>}
              <i className={"tg " + (u.verify_status || "")}>{u.verify_status || "-"}</i>
              {u.is_active === false && <i className="tg off">disabled</i>}
            </span>
          </button>
        ))}
      </div>

      <div className="au-pager">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
        <span>{page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>Next ›</button>
      </div>

      {(sel || mode === "create") && (
        <div className="cx-over end" onClick={close}>
          <div className="au-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="au-sh">
              <b>
                {mode === "create" ? "Create admin" : mode === "edit" ? "Edit user" : mode === "pw" ? "Set password" : "User details"}
              </b>
              <button onClick={close}>✕</button>
            </div>

            {mode === "create" && (
              <CreateAdmin
                onDone={() => { flash("ok", "Admin created"); close(); load(); }}
                onErr={(s) => flash("bad", s)}
              />
            )}

            {sel && mode === "" && (
              <>
                <div className="au-kv"><span>ID</span><b>{sel.id}</b></div>
                <div className="au-kv"><span>UID</span><b className="sel">{sel.uid}</b></div>
                <div className="au-kv"><span>Email</span><b className="sel">{sel.email}</b></div>
                <div className="au-kv"><span>Name</span><b>{sel.full_name || "-"}</b></div>
                <div className="au-kv"><span>Phone</span><b className="sel">{sel.phone || "-"}</b></div>
                <div className="au-kv"><span>Role</span><b>{sel.role}{sel.is_super ? " (super)" : ""}</b></div>
                <div className="au-kv"><span>KYC</span><b>{sel.verify_status || "-"}</b></div>
                <div className="au-kv">
                  <span>Status</span>
                  <b style={{ color: sel.is_active === false ? RED : GREEN }}>
                    {sel.is_active === false ? "Disabled" : "Active"}
                  </b>
                </div>
                <div className="au-kv"><span>Joined</span><b>{fmtDate(sel.created_at)}</b></div>

                <div className="au-acts">
                  <button onClick={() => setMode("edit")}>Edit</button>
                  <button onClick={() => setMode("pw")}>Password</button>
                  <button
                    className={sel.is_active === false ? "g" : "r"}
                    onClick={() => toggleActive(sel)}
                  >
                    {sel.is_active === false ? "Activate" : "Disable"}
                  </button>
                  <button onClick={() => loginAs(sel)}>Login as</button>
                  {isSuper && <button className="r" onClick={() => del(sel)}>Delete</button>}
                </div>
              </>
            )}

            {sel && mode === "edit" && (
              <EditForm
                u={sel}
                isSuper={isSuper}
                onSave={async (body) => { if (await patch(sel, body)) setMode(""); }}
                onCancel={() => setMode("")}
              />
            )}

            {sel && mode === "pw" && (
              <PwForm
                u={sel}
                onDone={() => { flash("ok", "Password changed"); setMode(""); }}
                onErr={(s) => flash("bad", s)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- sub forms ---------------- */

function EditForm({ u, isSuper, onSave, onCancel }) {
  const [f, setF] = useState({
    email: u.email || "",
    full_name: u.full_name || "",
    phone: u.phone || "",
    role: u.role || "user",
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    const body = {};
    if (f.email !== (u.email || "")) body.email = f.email.trim();
    if (f.full_name !== (u.full_name || "")) body.full_name = f.full_name;
    if (f.phone !== (u.phone || "")) body.phone = f.phone;
    if (isSuper && f.role !== u.role) body.role = f.role;
    if (!Object.keys(body).length) return onCancel();
    setBusy(true);
    await onSave(body);
    setBusy(false);
  };

  return (
    <div className="au-form">
      <label>Email</label>
      <input value={f.email} onChange={set("email")} />
      <label>Full name</label>
      <input value={f.full_name} onChange={set("full_name")} />
      <label>Phone</label>
      <input value={f.phone} onChange={set("phone")} />
      {isSuper && !u.is_super && (
        <>
          <label>Role</label>
          <select value={f.role} onChange={set("role")}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </>
      )}
      <div className="au-acts two">
        <button onClick={onCancel}>Cancel</button>
        <button className="p" disabled={busy} onClick={submit}>{busy ? "…" : "Save"}</button>
      </div>
    </div>
  );
}

function PwForm({ u, onDone, onErr }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pw.length < 6 || pw.length > 12) return onErr("Password must be 6-12 characters");
    setBusy(true);
    try {
      await api("/admin/users/" + u.id + "/password", { method: "POST", body: { password: pw } });
      onDone();
    } catch (e) {
      onErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="au-form">
      <label>New password for {u.email}</label>
      <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="6-12 characters" maxLength={12} />
      <div className="au-acts two">
        <button className="p" disabled={busy} onClick={submit}>{busy ? "…" : "Change password"}</button>
      </div>
    </div>
  );
}

function CreateAdmin({ onDone, onErr }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) return onErr("Email required");
    if (pw.length < 6 || pw.length > 12) return onErr("Password must be 6-12 characters");
    setBusy(true);
    try {
      await api("/admin/admins", {
        method: "POST",
        body: { email: email.trim(), password: pw, password2: pw },
      });
      onDone();
    } catch (e) {
      onErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="au-form">
      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
      <label>Password</label>
      <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="6-12 characters" maxLength={12} />
      <div className="au-acts two">
        <button className="p" disabled={busy} onClick={submit}>{busy ? "…" : "Create admin"}</button>
      </div>
    </div>
  );
}

/* ---------------- css ---------------- */
const CSS = `
.au-pg{padding-bottom:30px}
.au-nav{display:flex;gap:8px;padding:10px 14px 0}
.au-nav button{flex:1;text-align:center;padding:10px 0;border-radius:10px;border:1px solid #d5d9e4;font-size:15px}
.au-nav button.on{background:${BLUE};border-color:${BLUE};color:#fff}
.au-search{display:flex;gap:8px;padding:12px 14px 6px}
.au-search input{flex:1;min-width:0;height:46px;border:1.5px solid #dfe3ec;border-radius:10px;padding:0 12px;font-size:16px;background:transparent;color:inherit;outline:0}
.au-search input:focus{border-color:${BLUE}}
.au-search button{padding:0 18px;border-radius:10px;background:${BLUE};color:#fff;font-weight:600;text-align:center}
.au-filters{display:flex;gap:8px;padding:6px 14px 10px;flex-wrap:wrap}
.au-filters select,.au-form select{flex:1;min-width:100px;height:40px;border:1.5px solid #dfe3ec;border-radius:10px;padding:0 8px;font-size:14px;background:transparent;color:inherit}
.au-list{border-top:1px solid #e5e6ec}
.au-row{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;padding:14px;border-bottom:1px solid #e5e6ec}
.au-row:active{background:#f3f4f8}
.au-main{min-width:0;flex:1}
.au-main b{display:block;font-size:16px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.au-main small{font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.au-tags{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none}
.tg{font-style:normal;font-size:11px;padding:3px 8px;border-radius:10px;background:#e8eaf0;color:#555}
.tg.verified{background:rgba(14,203,129,.15);color:#0a9b63}
.tg.pending{background:rgba(245,166,35,.18);color:#b87408}
.tg.rejected,.tg.off{background:rgba(229,72,77,.15);color:${RED}}
.tg.ad{background:rgba(31,122,203,.15);color:${BLUE}}
.au-pager{display:flex;justify-content:space-between;align-items:center;padding:14px}
.au-pager button{padding:10px 16px;border:1px solid #d5d9e4;border-radius:10px;font-size:15px;text-align:center}
.au-pager button:disabled{opacity:.4}
.au-sheet{width:100%;max-width:520px;max-height:88vh;overflow-y:auto;background:#fff;border-radius:22px 22px 0 0;padding:20px 20px 26px;color:#111}
.au-sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.au-sh b{font-size:19px;font-weight:600}
.au-sh button{font-size:20px;color:#9aa0ad;padding:4px 8px}
.au-kv{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #eceef3;font-size:15px}
.au-kv span{color:#8a8d99}
.au-kv b{font-weight:500;text-align:end;word-break:break-all}
.au-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.au-acts.two{grid-template-columns:1fr}
.au-acts button{padding:13px 0;border-radius:10px;border:1px solid #d5d9e4;text-align:center;font-size:15px;font-weight:600}
.au-acts button.g{background:${GREEN};border-color:${GREEN};color:#fff}
.au-acts button.r{background:${RED};border-color:${RED};color:#fff}
.au-acts button.p{background:${BLUE};border-color:${BLUE};color:#fff}
.au-acts button:disabled{opacity:.5}
.au-form label{display:block;font-size:13px;color:#6b6f7c;margin:12px 0 6px}
.au-form input{display:block;width:100%;height:46px;border:1.5px solid #dfe3ec;border-radius:10px;padding:0 12px;font-size:16px;background:transparent;color:inherit;outline:0}
.au-form input:focus{border-color:${BLUE}}
.cx.dark .au-nav button,.cx.dark .au-pager button,.cx.dark .au-acts button{border-color:#2c3b57}
.cx.dark .au-search input,.cx.dark .au-filters select,.cx.dark .au-form input,.cx.dark .au-form select{border-color:#2c3b57}
.cx.dark .au-list,.cx.dark .au-row,.cx.dark .au-kv{border-color:#22304a}
.cx.dark .au-row:active{background:#1d2e49}
.cx.dark .tg{background:#22304a;color:#b6c0d3}
.cx.dark .tg.verified{background:rgba(14,203,129,.15);color:#0ecb81}
.cx.dark .au-sheet{background:#17263d;color:#e8ecf3}
.cx.dark .au-filters option,.cx.dark .au-form option{background:#17263d;color:#e8ecf3}
.cx.dark .au-form label{color:#9aa6bb}
@media(min-width:768px){.au-sheet{max-width:640px}}
`;
