import React, { useCallback, useEffect, useState } from "react";
import { api } from "../Home";

/* =========================================================
   src/pages/admin/AdminOptions.jsx
   Admin -> Options trading
   Props (from App.jsx): me, go, logout
   API:  /admin/options/*
   ========================================================= */

const n2 = (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dt = (s) => (s ? new Date(s).toLocaleString() : "--");
const qs = (o) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v !== "" && v != null) p.set(k, v); });
  const s = p.toString();
  return s ? "?" + s : "";
};
const isLong = (d) => d === "long";

/* ট্রেডের নিয়ম: proportional -> ×leverage, fixed -> yield% */
const ruleOf = (x) => {
  if (x.mode === "proportional") return "×" + Number(x.leverage || 1);
  return x.yield_rate != null ? Math.round(x.yield_rate * 100) + "%" : "--";
};

/* All admin pages (same keys as App.jsx go()) */
const ADMIN_LINKS = [
  { key: "admin", label: "Dashboard" },
  { key: "adminDeposits", label: "Deposits" },
  { key: "adminWithdrawals", label: "Withdrawals" },
  { key: "adminPaymentMethods", label: "Payment Methods" },
  { key: "adminOptions", label: "Options" },
];
const CURRENT_PAGE = "adminOptions";

const CSS = `
.ao{font-family:Inter,Arial,sans-serif;color:#1a1a1a;background:#f3f5fa;min-height:100vh;padding:16px;box-sizing:border-box}
.ao *{box-sizing:border-box}
.ao button{font:inherit;cursor:pointer}
.ao-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.ao-brand{display:flex;align-items:center;gap:10px}
.ao-brand i{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#1f7acb,#19c5c8);display:grid;place-items:center;color:#fff;font-style:normal;font-weight:900;font-size:19px}
.ao-brand b{display:block;font-size:16px}
.ao-brand small{color:#8a94a6;font-size:11px}
.ao-user{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ao-user span{font-size:12px;color:#6b7183;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ao-nav{display:flex;gap:8px;margin-bottom:16px;padding:6px;background:#fff;border:1px solid #e4e7ec;border-radius:12px;overflow-x:auto;scrollbar-width:none}
.ao-nav::-webkit-scrollbar{display:none}
.ao-nav button{flex:1 0 auto;min-width:120px;height:38px;padding:0 14px;border-radius:8px;border:1px solid transparent;background:transparent;color:#5b6475;font-weight:600;font-size:13px;white-space:nowrap}
.ao-nav button:hover{background:#eef3fa}
.ao-nav button.on{background:#1a82d6;border-color:#1a82d6;color:#fff}
.ao-h{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.ao-h h1{margin:0;font-size:22px}
.ao-sw{display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:10px;background:#fff;border:1px solid #e4e7ec}
.ao-sw b.on{color:#00a870}.ao-sw b.off{color:#d84d5a}
.ao-btn{height:34px;padding:0 14px;border-radius:8px;border:1px solid #cfd3d9;background:#fff}
.ao-btn.pri{background:#1a82d6;border-color:#1a82d6;color:#fff}
.ao-btn.red{background:#d84d5a;border-color:#d84d5a;color:#fff}
.ao-btn.grn{background:#00a870;border-color:#00a870;color:#fff}
.ao-btn.out{color:#d84d5a;border-color:#e9b3b8}
.ao-btn.sm{height:28px;padding:0 10px;font-size:12px}
.ao-btn:disabled{opacity:.5;cursor:not-allowed}
.ao-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:14px}
.ao-card{background:#fff;border:1px solid #e4e7ec;border-radius:10px;padding:12px 14px}
.ao-card small{display:block;color:#8a94a6;font-size:12px;margin-bottom:4px}
.ao-card b{font-size:20px}
.ao-pan{background:#fff;border:1px solid #e4e7ec;border-radius:10px;padding:14px;margin-bottom:14px}
.ao-pan h3{margin:0 0 10px;font-size:15px}
.ao-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.ao-chip{padding:6px 12px;border-radius:16px;border:1px solid #00a870;background:#e3f7ee;color:#0a8a5f;font-size:13px}
.ao-chip.off{border-color:#d84d5a;background:#fdecee;color:#c8323f;text-decoration:line-through}
.ao-row{display:flex;flex-wrap:wrap;gap:10px;align-items:end}
.ao-row label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7183}
.ao-row input,.ao-row select{height:34px;padding:0 10px;border:1px solid #cfd3d9;border-radius:8px;min-width:110px;font:inherit;background:#fff}
.ao-row input:disabled{background:#f0f2f6;color:#9aa0ad}
.ao-tabs{display:flex;gap:8px;margin-bottom:10px}
.ao-tabs button{height:36px;padding:0 18px;border-radius:8px;border:1px solid #cfd3d9;background:#fff}
.ao-tabs button.on{background:#1a82d6;border-color:#1a82d6;color:#fff}
.ao-tw{overflow-x:auto;background:#fff;border:1px solid #e4e7ec;border-radius:10px}
.ao table{width:100%;border-collapse:collapse;font-size:13px;white-space:nowrap}
.ao th{background:#f7f8fb;text-align:left;padding:9px 10px;color:#6b7183;font-weight:600}
.ao td{padding:8px 10px;border-top:1px solid #eef0f3}
.ao .up{color:#00a870}.ao .dn{color:#d84d5a}
.ao-tag{padding:2px 8px;border-radius:4px;color:#fff;font-size:12px}
.ao-err{margin-bottom:12px;padding:10px 14px;border-radius:8px;background:#fdecee;color:#c8323f;font-size:14px}
.ao-none{text-align:center;color:#9aa0ad;padding:30px}
.ao-note{margin-top:8px;font-size:12px;color:#8a94a6;line-height:1.5}
@media(max-width:550px){
  .ao{padding:12px}
  .ao-nav button{min-width:110px}
}
`;

const EMPTY_FORM = { yield: "", qty_min: "", qty_max: "", max_open: "", mode: "proportional", leverage: "1" };

const formFrom = (c) => ({
  yield: String(c.yield),
  qty_min: String(c.qty_min),
  qty_max: String(c.qty_max),
  max_open: String(c.max_open),
  mode: c.mode || "proportional",
  leverage: String(c.leverage != null ? c.leverage : 1),
});

export default function AdminOptions({ me, go, logout }) {
  const [sum, setSum] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab] = useState("pos");
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [f, setF] = useState({ status: "open", q: "", sym: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const adminLabel = me?.full_name || me?.name || me?.username || me?.email || "Administrator";

  const open = (key) => {
    if (key === CURRENT_PAGE) return;
    if (go) go(key);
  };

  const run = async (fn) => {
    setBusy(true); setErr("");
    try { await fn(); } catch (e) { setErr((e && e.message) || "Failed"); } finally { setBusy(false); }
  };

  const loadSum = useCallback(async () => { try { setSum(await api("/admin/options/summary")); } catch (_) {} }, []);
  const loadCfg = useCallback(async () => {
    try {
      const c = await api("/admin/options/settings");
      setCfg(c);
      setForm(formFrom(c));
    } catch (e) { setErr((e && e.message) || "Failed"); }
  }, []);
  const loadRows = useCallback(async () => {
    try { setRows(await api("/admin/options/positions" + qs({ ...f, limit: 200 }))); } catch (_) {}
  }, [f]);
  const loadUsers = useCallback(async () => {
    try { setUsers(await api("/admin/options/users" + qs({ q: f.q, limit: 200 }))); } catch (_) {}
  }, [f.q]);

  useEffect(() => { loadCfg(); }, [loadCfg]);
  useEffect(() => {
    const tick = () => { loadSum(); if (tab === "pos") loadRows(); else loadUsers(); };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [tab, loadSum, loadRows, loadUsers]);

  const refresh = () => { loadSum(); tab === "pos" ? loadRows() : loadUsers(); };

  const saveCfg = (changes) => run(async () => {
    const c = await api("/admin/options/settings", { method: "PUT", body: changes });
    setCfg(c);
    setForm(formFrom(c));
  });

  const toggleMaster = () => {
    const next = !cfg.enabled;
    if (!next && !window.confirm("Turn OFF all Options trading? New trades will be blocked (open trades continue).")) return;
    saveCfg({ enabled: next });
  };

  const toggleCoin = (c) => {
    const off = new Set(cfg.disabled_syms);
    off.has(c) ? off.delete(c) : off.add(c);
    saveCfg({ disabled_syms: [...off] });
  };

  const saveLimits = () => saveCfg({
    yield: form.yield,
    qty_min: form.qty_min,
    qty_max: form.qty_max,
    max_open: parseInt(form.max_open || "0", 10),
    mode: form.mode,
    leverage: form.leverage,
  });

  const cancelOne = (x) => {
    const note = window.prompt(`Cancel trade #${x.id} (${n2(x.qty)} USDT will be refunded). Reason (optional):`, "");
    if (note === null) return;
    run(async () => { await api(`/admin/options/positions/${x.id}/cancel`, { method: "POST", body: { note } }); refresh(); });
  };

  const cancelAll = (body, label) => {
    if (!window.confirm(`Cancel ALL open trades ${label}? Stakes will be refunded.`)) return;
    const note = window.prompt("Reason (optional):", "");
    if (note === null) return;
    run(async () => {
      const r = await api("/admin/options/cancel-all", { method: "POST", body: { ...body, note } });
      window.alert(`Canceled: ${r.canceled}`);
      refresh();
    });
  };

  const blockUser = (u) => {
    if (u.blocked) {
      run(async () => { await api(`/admin/options/users/${u.user_id}/unblock`, { method: "POST", body: {} }); refresh(); });
      return;
    }
    const reason = window.prompt(`Block ${u.email} from Options trading. Reason (optional):`, "");
    if (reason === null) return;
    run(async () => { await api(`/admin/options/users/${u.user_id}/block`, { method: "POST", body: { reason } }); refresh(); });
  };

  const platPnl = sum ? sum.today_platform_pnl : 0;
  const isProp = form.mode === "proportional";

  return (
    <div className="ao">
      <style>{CSS}</style>

      {/* Top bar */}
      <div className="ao-top">
        <div className="ao-brand">
          <i>C</i>
          <div>
            <b>Trading Admin</b>
            <small>Options Management</small>
          </div>
        </div>
        <div className="ao-user">
          <span>{adminLabel}</span>
          <button type="button" className="ao-btn out" onClick={() => logout && logout()}>Logout</button>
        </div>
      </div>

      {/* Navigation: all admin pages */}
      <nav className="ao-nav">
        {ADMIN_LINKS.map((l) => (
          <button
            key={l.key}
            type="button"
            className={l.key === CURRENT_PAGE ? "on" : ""}
            onClick={() => open(l.key)}
          >
            {l.label}
          </button>
        ))}
      </nav>

      <div className="ao-h">
        <h1>Options trading</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {cfg && (
            <div className="ao-sw">
              <span>Trading:</span>
              <b className={cfg.enabled ? "on" : "off"}>{cfg.enabled ? "ON" : "OFF"}</b>
              <button type="button" className={"ao-btn " + (cfg.enabled ? "red" : "grn")} disabled={busy} onClick={toggleMaster}>
                {cfg.enabled ? "Turn OFF" : "Turn ON"}
              </button>
            </div>
          )}
          <button type="button" className="ao-btn" onClick={refresh}>↻ Refresh</button>
        </div>
      </div>

      {err && <div className="ao-err">{err}</div>}

      {sum && (
        <div className="ao-cards">
          <div className="ao-card"><small>Open trades</small><b>{sum.open_count}</b></div>
          <div className="ao-card"><small>Open volume (USDT)</small><b>{n2(sum.open_volume)}</b></div>
          <div className="ao-card"><small>Today trades / users</small><b>{sum.today_trades} / {sum.today_users}</b></div>
          <div className="ao-card"><small>Today volume (USDT)</small><b>{n2(sum.today_volume)}</b></div>
          <div className="ao-card"><small>Today platform P&amp;L</small><b className={platPnl >= 0 ? "up" : "dn"}>{n2(platPnl)}</b></div>
          <div className="ao-card"><small>Total platform P&amp;L</small><b className={sum.total_platform_pnl >= 0 ? "up" : "dn"}>{n2(sum.total_platform_pnl)}</b></div>
        </div>
      )}

      {sum && sum.exposure && sum.exposure.length > 0 && (
        <div className="ao-pan">
          <h3>Open exposure by coin (USDT)</h3>
          <div className="ao-chips">
            {sum.exposure.map((e) => (
              <span key={e.sym} className="ao-chip" style={{ background: "#f3f5fa", borderColor: "#cfd3d9", color: "#1a1a1a" }}>
                {e.sym}: <b className="up">Long {n2(e.long)}</b> · <b className="dn">Short {n2(e.short)}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {cfg && (
        <div className="ao-pan">
          <h3>Coins (tap to enable/disable)</h3>
          <div className="ao-chips">
            {cfg.coins.map((c) => (
              <button key={c} type="button" disabled={busy} className={"ao-chip" + (cfg.disabled_syms.includes(c) ? " off" : "")} onClick={() => toggleCoin(c)}>{c}</button>
            ))}
          </div>

          <h3>Trading rules &amp; limits</h3>
          <div className="ao-row">
            <label>Mode
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option value="proportional">Proportional (real P&amp;L)</option>
                <option value="fixed">Fixed yield (all-or-nothing)</option>
              </select>
            </label>
            <label>Leverage (×) {isProp ? "" : "· proportional only"}
              <input value={form.leverage} disabled={!isProp} onChange={(e) => setForm({ ...form, leverage: e.target.value })} />
            </label>
            <label>Yield (0.85 = 85%) {isProp ? "· fixed only" : ""}
              <input value={form.yield} disabled={isProp} onChange={(e) => setForm({ ...form, yield: e.target.value })} />
            </label>
            <label>Min stake<input value={form.qty_min} onChange={(e) => setForm({ ...form, qty_min: e.target.value })} /></label>
            <label>Max stake<input value={form.qty_max} onChange={(e) => setForm({ ...form, qty_max: e.target.value })} /></label>
            <label>Max open / user (0 = ∞)<input value={form.max_open} onChange={(e) => setForm({ ...form, max_open: e.target.value })} /></label>
            <button type="button" className="ao-btn pri" disabled={busy} onClick={saveLimits}>Save</button>
          </div>
          <div className="ao-note">
            Proportional: profit/loss = stake × price change % × leverage (loss never exceeds the stake; equal price = stake back).
            Fixed: win = stake × yield, loss = whole stake.<br />
            Changes apply to new trades only. Open trades keep the rules they were opened with.
          </div>
        </div>
      )}

      <div className="ao-tabs">
        <button type="button" className={tab === "pos" ? "on" : ""} onClick={() => setTab("pos")}>Trades</button>
        <button type="button" className={tab === "usr" ? "on" : ""} onClick={() => setTab("usr")}>Users</button>
      </div>

      <div className="ao-pan">
        <div className="ao-row">
          <label>Search (email / UID / ID)<input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="user" /></label>
          {tab === "pos" && (
            <>
              <label>Status
                <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                  <option value="">All</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </label>
              <label>Coin
                <select value={f.sym} onChange={(e) => setF({ ...f, sym: e.target.value })}>
                  <option value="">All</option>
                  {(cfg ? cfg.coins : []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <button type="button" className="ao-btn red" disabled={busy} onClick={() => cancelAll({ sym: f.sym || null }, f.sym ? `for ${f.sym}` : "(ALL coins)")}>
                Cancel all open {f.sym || ""}
              </button>
            </>
          )}
        </div>
      </div>

      {tab === "pos" ? (
        <div className="ao-tw">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>User</th><th>Pair</th><th>Side</th><th>Stake</th><th>Open</th><th>Close</th>
                <th>P&amp;L (user)</th><th>Live P&amp;L</th><th>Rule</th><th>Time</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={13} className="ao-none">No trades</td></tr>}
              {rows.map((x) => (
                <tr key={x.id}>
                  <td>{x.id}</td>
                  <td>{x.email}<br /><small style={{ color: "#8a94a6" }}>UID {x.uid}</small></td>
                  <td>{x.sym}/USDT</td>
                  <td><span className="ao-tag" style={{ background: isLong(x.direction) ? "#00a870" : "#d84d5a" }}>{isLong(x.direction) ? "LONG" : "SHORT"}</span></td>
                  <td>{n2(x.qty)}</td>
                  <td>{x.open_price}</td>
                  <td>{x.close_price != null ? x.close_price : "--"}</td>
                  <td className={x.pnl > 0 ? "up" : x.pnl < 0 ? "dn" : ""}>{x.pnl != null ? n2(x.pnl) : "--"}</td>
                  <td className={x.floating_pnl > 0 ? "up" : x.floating_pnl < 0 ? "dn" : ""}>{x.floating_pnl != null ? n2(x.floating_pnl) : "--"}</td>
                  <td>{ruleOf(x)}</td>
                  <td>{x.status === "open" ? "ends " + dt(x.end_at) : dt(x.end_at)}</td>
                  <td>{x.status}{x.admin_note ? <><br /><small style={{ color: "#8a94a6" }}>{x.admin_note}</small></> : null}</td>
                  <td>{x.status === "open" && <button type="button" className="ao-btn red sm" disabled={busy} onClick={() => cancelOne(x)}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ao-tw">
          <table>
            <thead>
              <tr><th>User</th><th>Trades</th><th>Volume</th><th>Win / Loss</th><th>Net P&amp;L (user)</th><th>Open</th><th>Last trade</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={9} className="ao-none">No users</td></tr>}
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.email}<br /><small style={{ color: "#8a94a6" }}>UID {u.uid} · ID {u.user_id}</small></td>
                  <td>{u.trades}</td>
                  <td>{n2(u.volume)}</td>
                  <td><span className="up">{u.wins}</span> / <span className="dn">{u.losses}</span></td>
                  <td className={u.net_pnl >= 0 ? "up" : "dn"}>{n2(u.net_pnl)}</td>
                  <td>{u.open_count} ({n2(u.open_volume)})</td>
                  <td>{dt(u.last_trade)}</td>
                  <td>{u.blocked ? <b className="dn">Blocked</b> : "Active"}{u.block_reason ? <><br /><small>{u.block_reason}</small></> : null}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button type="button" className={"ao-btn sm " + (u.blocked ? "grn" : "red")} disabled={busy} onClick={() => blockUser(u)}>{u.blocked ? "Unblock" : "Block"}</button>
                    {u.open_count > 0 && <button type="button" className="ao-btn sm" disabled={busy} onClick={() => cancelAll({ user_id: u.user_id }, `of ${u.email}`)}>Cancel open</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
