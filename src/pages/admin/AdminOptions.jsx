import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../Home";

/* =========================================================
   Helpers
   ========================================================= */

const n2 = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Up to 8 decimals (matches backend Q8 precision)
const n8 = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });

const dt = (s) => (s ? new Date(s).toLocaleString() : "--");

const qs = (o) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v !== "" && v != null) p.set(k, v);
  });
  const s = p.toString();
  return s ? "?" + s : "";
};

const isLong = (d) => d === "long";

const ruleOf = (x) => {
  if (x.mode === "proportional") return "×" + Number(x.leverage || 1);
  return x.yield_rate != null ? Math.round(x.yield_rate * 100) + "%" : "--";
};

const sign = (v) => (v > 0 ? "up" : v < 0 ? "dn" : "");

// Signed decimal, max 8 places (same as backend)
const DEC8 = /^-?\d+(\.\d{1,8})?$/;

// Backend error codes -> readable messages
const ERR_MAP = {
  insufficientBalance:
    "User's available balance is not enough. Nothing was changed.",
  notClosed: "Only CLOSED trades can be adjusted.",
  notOpen: "Only OPEN trades can be canceled or settled.",
  notFound: "Record not found.",
  badPnl: "Invalid P&L. New P&L cannot be lower than the negative stake.",
  badAdjustment: "Adjustment cannot be zero.",
  badPrice: "Invalid close price.",
  reasonRequired: "Reason is required.",
  frozenMismatch: "Frozen balance mismatch. Nothing was changed.",
  forbidden: "Admin access required.",
};

const ADMIN_LINKS = [
  { key: "admin", label: "Dashboard" },
  { key: "adminDeposits", label: "Deposits" },
  { key: "adminWithdrawals", label: "Withdrawals" },
  { key: "adminPaymentMethods", label: "Payment Methods" },
  { key: "adminOptions", label: "Options" },
];

const CURRENT_PAGE = "adminOptions";

const EMPTY_FORM = {
  yield: "",
  qty_min: "",
  qty_max: "",
  max_open: "",
  mode: "proportional",
  leverage: "1",
};

const formFrom = (c) => ({
  yield: String(c.yield ?? ""),
  qty_min: String(c.qty_min ?? ""),
  qty_max: String(c.qty_max ?? ""),
  max_open: String(c.max_open ?? ""),
  mode: c.mode || "proportional",
  leverage: String(c.leverage != null ? c.leverage : 1),
});

const CSS = `
.ao{--bg:#f2f4f8;--card:#fff;--line:#e3e7ee;--ink:#17202e;--mute:#6b7689;--faint:#98a2b3;--pri:#1a6fd1;--pri-d:#1459a8;--grn:#0f9d6b;--red:#d6414f;--amber:#c9820a;
  font-family:Inter,"Segoe UI",system-ui,-apple-system,Arial,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh;min-height:100dvh;font-size:14px;line-height:1.45;-webkit-text-size-adjust:100%}
.ao *{box-sizing:border-box}
.ao button{font:inherit;cursor:pointer}
.ao button:focus-visible,.ao input:focus-visible,.ao select:focus-visible,.ao textarea:focus-visible{outline:2px solid var(--pri);outline-offset:1px}
.ao-wrap{max-width:1320px;margin:0 auto;padding:0 16px 40px}

/* Top bar */
.ao-bar{position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid var(--line)}
.ao-bar-in{max-width:1320px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.ao-brand{display:flex;align-items:center;gap:10px;min-width:0}
.ao-logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#1a6fd1,#18b6c4);display:grid;place-items:center;color:#fff;font-weight:800;font-size:18px;flex:none}
.ao-brand b{display:block;font-size:15px;line-height:1.2}
.ao-brand small{color:var(--faint);font-size:11px}
.ao-bar-r{display:flex;align-items:center;gap:8px;min-width:0}
.ao-admin{font-size:12px;color:var(--mute);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ao-nav{display:flex;gap:6px;padding:8px 16px;max-width:1320px;margin:0 auto;overflow-x:auto;scrollbar-width:none}
.ao-nav::-webkit-scrollbar{display:none}
.ao-nav button{flex:0 0 auto;height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--mute);font-weight:600;font-size:13px;white-space:nowrap}
.ao-nav button:hover{background:#eef3fb;color:var(--pri)}
.ao-nav button.on{background:var(--pri);border-color:var(--pri);color:#fff}

/* Buttons */
.ao-btn{height:36px;padding:0 14px;border-radius:9px;border:1px solid #cfd5df;background:#fff;color:var(--ink);font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;transition:background .15s,border-color .15s}
.ao-btn:hover:not(:disabled){background:#f3f6fb}
.ao-btn.pri{background:var(--pri);border-color:var(--pri);color:#fff}.ao-btn.pri:hover:not(:disabled){background:var(--pri-d)}
.ao-btn.red{background:var(--red);border-color:var(--red);color:#fff}.ao-btn.red:hover:not(:disabled){background:#bb3441}
.ao-btn.grn{background:var(--grn);border-color:var(--grn);color:#fff}.ao-btn.grn:hover:not(:disabled){background:#0b8459}
.ao-btn.ghost-red{color:var(--red);border-color:#ecbcc1}
.ao-btn.sm{height:30px;padding:0 11px;font-size:12px;border-radius:8px}
.ao-btn.block{width:100%}
.ao-btn:disabled{opacity:.5;cursor:not-allowed}

/* Header */
.ao-h{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:18px 0 14px}
.ao-h h1{margin:0;font-size:22px;letter-spacing:-.01em}
.ao-h-r{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.ao-sw{display:flex;align-items:center;gap:10px;padding:6px 6px 6px 14px;border-radius:12px;background:#fff;border:1px solid var(--line)}
.ao-sw b.on{color:var(--grn)}.ao-sw b.off{color:var(--red)}

/* Stats */
.ao-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}
@media(min-width:700px){.ao-stats{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1100px){.ao-stats{grid-template-columns:repeat(6,1fr)}}
.ao-stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;min-width:0}
.ao-stat small{display:block;color:var(--mute);font-size:12px;margin-bottom:4px}
.ao-stat b{font-size:19px;word-break:break-word}

/* Panels */
.ao-pan{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
.ao-pan h3{margin:0 0 12px;font-size:15px}
.ao-pan h3:not(:first-child){margin-top:18px}
.ao-chips{display:flex;flex-wrap:wrap;gap:8px}
.ao-chip{padding:6px 12px;border-radius:999px;border:1px solid #9ad8bf;background:#e6f7ef;color:#0b7c55;font-size:13px;font-weight:600}
button.ao-chip:hover:not(:disabled){filter:brightness(.97)}
.ao-chip.off{border-color:#eab2b8;background:#fdecee;color:#bb3441;text-decoration:line-through}
.ao-chip.plain{background:#f3f5fa;border-color:var(--line);color:var(--ink);font-weight:500}
.ao-form{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
@media(min-width:900px){.ao-form{grid-template-columns:repeat(6,1fr) auto;align-items:end}}
.ao-form label,.ao-filters label,.ao-modal label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--mute);font-weight:600;min-width:0}
.ao input,.ao select,.ao textarea{width:100%;height:38px;padding:0 11px;border:1px solid #cfd5df;border-radius:9px;font:inherit;color:var(--ink);background:#fff}
.ao textarea{height:84px;padding:9px 11px;resize:vertical}
.ao input:disabled{background:#f0f2f6;color:#9aa0ad}
.ao-note{margin-top:12px;font-size:12px;color:var(--mute);line-height:1.55}

/* Tabs + filters */
.ao-tabs{display:inline-flex;gap:4px;padding:4px;background:#e7ebf2;border-radius:11px;margin-bottom:12px;max-width:100%;overflow-x:auto}
.ao-tabs button{height:34px;padding:0 18px;border-radius:8px;border:0;background:transparent;color:var(--mute);font-weight:600;white-space:nowrap}
.ao-tabs button.on{background:#fff;color:var(--pri);box-shadow:0 1px 3px #0001}
.ao-filters{display:grid;grid-template-columns:1fr;gap:12px}
@media(min-width:600px){.ao-filters{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1000px){.ao-filters{grid-template-columns:2fr 1fr 1fr auto;align-items:end}}

/* Card grid */
.ao-grid{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px}
@media(min-width:760px){.ao-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1180px){.ao-grid{grid-template-columns:repeat(3,1fr)}}
.ao-item{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.ao-item-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid #eef1f5;background:#fafbfd}
.ao-item-h-l{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
.ao-sn{min-width:26px;text-align:center;padding:2px 7px;border-radius:6px;background:#eaf0f9;color:#26364a;font-weight:700;font-size:12px}
.ao-id{font-weight:700}
.ao-tag{padding:2px 9px;border-radius:5px;color:#fff;font-size:11px;font-weight:700}
.ao-st{padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;text-transform:capitalize}
.ao-st.open{background:#e4effd;color:#1459a8}
.ao-st.closed{background:#e6f7ef;color:#0b7c55}
.ao-st.canceled{background:#f1f2f5;color:#6b7689}
.ao-st.blocked{background:#fdecee;color:#bb3441}
.ao-st.active{background:#e6f7ef;color:#0b7c55}
.ao-item-b{padding:12px 14px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px 14px}
.ao-kv{min-width:0}
.ao-kv.full{grid-column:1/-1}
.ao-kv small{display:block;color:var(--faint);font-size:11px;margin-bottom:1px}
.ao-kv span,.ao-kv b{font-size:13px;word-break:break-word}
.ao-kv b{font-weight:600}
.ao .up{color:var(--grn)}.ao .dn{color:var(--red)}
.ao-adj{margin:0 14px 12px;padding:10px;border:1px dashed #cdd5e1;border-radius:10px;background:#fafbfd;display:flex;flex-direction:column;gap:8px}
.ao-adj>small{color:var(--mute);font-weight:600}
.ao-adj .pv{font-size:12px;color:var(--mute)}
.ao-adj .pv.bad{color:var(--red)}
.ao-item-f{display:flex;gap:8px;flex-wrap:wrap;padding:12px 14px;border-top:1px solid #eef1f5;margin-top:auto}
.ao-item-f:empty{display:none}
.ao-item-f .ao-btn{flex:1 1 auto}
.ao-empty{text-align:center;color:var(--faint);padding:40px 16px;background:#fff;border:1px dashed #cfd5df;border-radius:14px;margin-bottom:14px}
.ao-pill{font-size:11px;border-radius:999px;padding:3px 9px;background:#edf1f7;color:#455468;font-weight:600}

/* Toasts */
.ao-toasts{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:10020;display:flex;flex-direction:column;gap:8px;width:min(460px,calc(100vw - 24px));pointer-events:none}
.ao-toast{pointer-events:auto;display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:#fff;border-radius:12px;border:1px solid var(--line);border-left:4px solid var(--pri);box-shadow:0 10px 30px #0b1a3a26;animation:aoIn .22s ease-out}
.ao-toast.success{border-left-color:var(--grn)}
.ao-toast.error{border-left-color:var(--red)}
.ao-toast i{font-style:normal;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:12px;font-weight:800;flex:none;background:var(--pri)}
.ao-toast.success i{background:var(--grn)}.ao-toast.error i{background:var(--red)}
.ao-toast p{margin:0;flex:1;font-size:13.5px;line-height:1.5;word-break:break-word}
.ao-toast button{border:0;background:transparent;color:var(--faint);font-size:18px;line-height:1;padding:0 2px}
@keyframes aoIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}

/* Modals (always centered on the device screen) */
.ao-modal-bg{position:fixed;inset:0;background:#0a142588;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;animation:aoFade .15s}
.ao-modal-bg.top{z-index:10010}
.ao-modal{width:min(520px,100%);max-height:calc(100dvh - 32px);overflow-y:auto;background:#fff;border-radius:16px;padding:20px;box-shadow:0 24px 70px #0b1a3a40;animation:aoPop .2s ease-out;margin:auto}
.ao-modal h3{margin:0 0 6px;font-size:18px}
.ao-modal .msg{white-space:pre-line;color:var(--mute);font-size:14px;line-height:1.6;margin:8px 0 0}
.ao-modal .fields{display:grid;grid-template-columns:1fr;gap:12px;margin-top:14px}
.ao-modal-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
@media(max-width:480px){.ao-modal-footer{flex-direction:column-reverse}.ao-modal-footer .ao-btn{width:100%;height:42px}}
@keyframes aoFade{from{opacity:0}to{opacity:1}}
@keyframes aoPop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}

@media(max-width:480px){
  .ao-wrap{padding:0 12px 32px}
  .ao-bar-in{padding:8px 12px}
  .ao-nav{padding:8px 12px}
  .ao-admin{display:none}
  .ao-h h1{font-size:19px}
  .ao-sw{width:100%;justify-content:space-between}
  .ao-h-r{width:100%}
  .ao-form{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){.ao *{animation:none!important;transition:none!important}}
`;

/* =========================================================
   Small presentational pieces
   ========================================================= */

const Kv = ({ label, children, full, cls }) => (
  <div className={"ao-kv" + (full ? " full" : "")}>
    <small>{label}</small>
    <b className={cls || ""}>{children}</b>
  </div>
);

const Stat = ({ label, children, cls }) => (
  <div className="ao-stat">
    <small>{label}</small>
    <b className={cls || ""}>{children}</b>
  </div>
);

/* =========================================================
   Component
   ========================================================= */

export default function AdminOptions({ me, go, logout }) {
  const [sum, setSum] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [tab, setTab] = useState("pos");
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [audits, setAudits] = useState([]);

  const [f, setF] = useState({ status: "open", q: "", sym: "" });

  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [walletForm, setWalletForm] = useState({ amount: "", reason: "" });
  const [pnlForm, setPnlForm] = useState({ pnl: "", close_price: "", reason: "" });

  // Per-trade closed P&L adjustment inputs: { [tradeId]: { adj, reason } }
  const [rowAdj, setRowAdj] = useState({});

  // Toast + confirm dialog
  const [toasts, setToasts] = useState([]);
  const [dlg, setDlg] = useState(null);
  const toastId = useRef(0);

  const setRow = (id, patch) =>
    setRowAdj((s) => ({
      ...s,
      [id]: { adj: "", reason: "", ...s[id], ...patch },
    }));

  const adminLabel =
    me?.full_name || me?.name || me?.username || me?.email || "Administrator";

  const open = (key) => {
    if (key !== CURRENT_PAGE && go) go(key);
  };

  /* -------------------------
     Toasts
     ------------------------- */

  const dismissToast = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  const toast = useCallback(
    (type, msg) => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-3), { id, type, msg }]);
      setTimeout(() => dismissToast(id), type === "error" ? 6000 : 4200);
    },
    [dismissToast]
  );

  const ok = (m) => toast("success", m);
  const bad = (m) => toast("error", m);

  /* -------------------------
     Confirm / reason dialog (replaces window.confirm / prompt / alert)
     ask({ title, message, confirmLabel, tone, input: { label, placeholder, required } })
     resolves to { value } on confirm, or null on cancel
     ------------------------- */

  const ask = (opts) =>
    new Promise((resolve) => setDlg({ ...opts, value: "", resolve }));

  const closeDlg = (result) => {
    if (dlg) dlg.resolve(result);
    setDlg(null);
  };

  const confirmDlg = () => {
    if (dlg.input?.required && !dlg.value.trim()) {
      bad(`${dlg.input.label || "Reason"} is required.`);
      return;
    }
    closeDlg({ value: dlg.value.trim() });
  };

  // Escape closes the top-most layer
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (dlg) closeDlg(null);
      else if (modal && !busy) setModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const raw = (e && e.message) || "Request failed";
      bad(ERR_MAP[raw] || raw);
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------
     Loaders
     ------------------------- */

  const loadSum = useCallback(async () => {
    try {
      setSum(await api("/admin/options/summary"));
    } catch (_) {}
  }, []);

  const loadCfg = useCallback(async () => {
    try {
      const c = await api("/admin/options/settings");
      setCfg(c);
      setForm(formFrom(c));
    } catch (e) {
      bad((e && e.message) || "Settings load failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRows = useCallback(async () => {
    try {
      const r = await api("/admin/options/positions" + qs({ ...f, limit: 200 }));
      setRows(Array.isArray(r) ? r : []);
    } catch (_) {}
  }, [f]);

  const loadUsers = useCallback(async () => {
    try {
      const r = await api("/admin/options/users" + qs({ q: f.q, limit: 200 }));
      setUsers(Array.isArray(r) ? r : []);
    } catch (_) {}
  }, [f.q]);

  const loadAudits = useCallback(async () => {
    try {
      const r = await api("/admin/options/audit" + qs({ limit: 100 }));
      setAudits(Array.isArray(r) ? r : []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadCfg();
  }, [loadCfg]);

  useEffect(() => {
    const tick = () => {
      loadSum();
      if (tab === "pos") loadRows();
      if (tab === "usr") loadUsers();
      if (tab === "audit") loadAudits();
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [tab, loadSum, loadRows, loadUsers, loadAudits]);

  const refresh = () => {
    loadSum();
    loadCfg();
    if (tab === "pos") loadRows();
    if (tab === "usr") loadUsers();
    if (tab === "audit") loadAudits();
  };

  /* -------------------------
     Settings
     ------------------------- */

  const saveCfg = (changes) =>
    run(async () => {
      const c = await api("/admin/options/settings", {
        method: "PUT",
        body: changes,
      });
      setCfg(c);
      setForm(formFrom(c));
      ok("Settings updated successfully.");
      loadSum();
    });

  const toggleMaster = async () => {
    if (!cfg) return;
    const next = !cfg.enabled;

    if (!next) {
      const r = await ask({
        title: "Turn off Options trading?",
        message: "New trades will be blocked for all users. Existing open trades will continue.",
        confirmLabel: "Turn OFF",
        tone: "red",
      });
      if (!r) return;
    }
    saveCfg({ enabled: next });
  };

  const toggleCoin = (coin) => {
    if (!cfg) return;
    const off = new Set(cfg.disabled_syms || []);
    off.has(coin) ? off.delete(coin) : off.add(coin);
    saveCfg({ disabled_syms: [...off] });
  };

  const saveLimits = () =>
    saveCfg({
      yield: form.yield,
      qty_min: form.qty_min,
      qty_max: form.qty_max,
      max_open: parseInt(form.max_open || "0", 10),
      mode: form.mode,
      leverage: form.leverage,
    });

  /* -------------------------
     Cancel
     ------------------------- */

  const cancelOne = async (x) => {
    const r = await ask({
      title: `Cancel trade #${x.id}`,
      message: `Stake ${n2(x.qty)} USDT will be refunded to the user.`,
      confirmLabel: "Cancel trade",
      tone: "red",
      input: { label: "Reason (optional)", placeholder: "Why is this trade canceled?" },
    });
    if (!r) return;

    run(async () => {
      await api(`/admin/options/positions/${x.id}/cancel`, {
        method: "POST",
        body: { note: r.value },
      });
      ok(`Trade #${x.id} canceled and refund processed.`);
      refresh();
    });
  };

  const cancelAll = async (body, label) => {
    const r = await ask({
      title: "Cancel all open trades?",
      message: `All open trades ${label} will be canceled and stakes refunded.`,
      confirmLabel: "Cancel all",
      tone: "red",
      input: { label: "Reason (optional)", placeholder: "Reason for bulk cancel" },
    });
    if (!r) return;

    run(async () => {
      const res = await api("/admin/options/cancel-all", {
        method: "POST",
        body: { ...body, note: r.value },
      });
      ok(`${res.canceled} trade${res.canceled === 1 ? "" : "s"} canceled.`);
      refresh();
    });
  };

  /* -------------------------
     Block / Unblock
     ------------------------- */

  const blockUser = async (u) => {
    if (u.blocked) {
      const r = await ask({
        title: "Enable trading?",
        message: `${u.email} will be able to trade Options again.`,
        confirmLabel: "Enable",
        tone: "grn",
      });
      if (!r) return;

      run(async () => {
        await api(`/admin/options/users/${u.user_id}/unblock`, {
          method: "POST",
          body: {},
        });
        ok("User trading enabled.");
        refresh();
      });
      return;
    }

    const r = await ask({
      title: "Disable Options trading",
      message: `${u.email} will not be able to open new trades.`,
      confirmLabel: "Disable",
      tone: "red",
      input: { label: "Reason", placeholder: "Why is this user blocked?" },
    });
    if (!r) return;

    run(async () => {
      await api(`/admin/options/users/${u.user_id}/block`, {
        method: "POST",
        body: { reason: r.value },
      });
      ok("User trading disabled.");
      refresh();
    });
  };

  const setUserTrading = async (u) => {
    const enabled = !!u.blocked;

    const r = await ask({
      title: `${enabled ? "Enable" : "Disable"} trading`,
      message: u.email,
      confirmLabel: enabled ? "Enable" : "Disable",
      tone: enabled ? "grn" : "red",
      input: { label: "Reason", placeholder: "Reason for this change" },
    });
    if (!r) return;

    run(async () => {
      await api(`/admin/options/users/${u.user_id}/trading`, {
        method: "PUT",
        body: { enabled, reason: r.value },
      });
      ok(`User trading ${enabled ? "enabled" : "disabled"}.`);
      refresh();
    });
  };

  /* -------------------------
     Wallet Add / Deduct
     ------------------------- */

  const openWalletModal = (u, action) => {
    setWalletForm({ amount: "", reason: "" });
    setModal({ type: "wallet", user: u, action });
  };

  const submitWallet = async () => {
    if (!modal?.user) return;

    const amount = Number(walletForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      bad("Enter a valid amount greater than zero.");
      return;
    }
    if (!walletForm.reason.trim()) {
      bad("Reason is required.");
      return;
    }

    const action = modal.action;
    const userId = modal.user.user_id;
    const isAdd = action === "add";

    const r = await ask({
      title: isAdd ? "Confirm add" : "Confirm deduct",
      message: `${isAdd ? "Add" : "Deduct"} ${n2(amount)} USDT ${isAdd ? "to" : "from"} ${modal.user.email}?`,
      confirmLabel: isAdd ? "Add funds" : "Deduct funds",
      tone: isAdd ? "grn" : "red",
    });
    if (!r) return;

    run(async () => {
      const path = `/admin/options/users/${userId}/wallet/${isAdd ? "add" : "deduct"}`;
      const res = await api(path, {
        method: "POST",
        body: {
          amount: String(walletForm.amount),
          coin: "USDT",
          reason: walletForm.reason.trim(),
        },
      });

      setModal(null);
      ok(
        `Wallet ${isAdd ? "credited" : "debited"} successfully.` +
          (res && res.available_after != null
            ? ` Available: ${n8(res.available_before)} → ${n8(res.available_after)} USDT.`
            : "")
      );
      loadUsers();
    });
  };

  /* -------------------------
     Closed trade P&L adjustment (per trade)
     new P&L = old P&L + adjustment. Frozen balance never changes.
     ------------------------- */

  const previewOf = (x) => {
    const raw = (rowAdj[x.id]?.adj || "").trim();
    const valid = DEC8.test(raw) && Number(raw) !== 0;
    const adj = valid ? Number(raw) : 0;
    const oldPnl = Number(x.pnl || 0);
    const newPnl = oldPnl + adj;
    const tooLow = valid && newPnl < -Number(x.qty);
    return { raw, valid, adj, oldPnl, newPnl, tooLow };
  };

  const submitRowPnl = async (x) => {
    const { raw, valid, adj, oldPnl, newPnl, tooLow } = previewOf(x);
    const reason = (rowAdj[x.id]?.reason || "").trim();

    if (!valid) {
      bad("Enter a valid non-zero adjustment (max 8 decimals). Example: 5 or -3.5");
      return;
    }
    if (tooLow) {
      bad("New P&L cannot be lower than the negative stake.");
      return;
    }

    const credit = adj > 0;

    const r = await ask({
      title: `Adjust trade #${x.id}`,
      message:
        `User: ${x.email || "user"}\n` +
        `Old P&L: ${n8(oldPnl)} USDT\n` +
        `Adjustment: ${credit ? "+" : ""}${n8(adj)} USDT\n` +
        `New P&L: ${n8(newPnl)} USDT\n\n` +
        `Available wallet will be ${credit ? "credited" : "debited"} by ${n8(Math.abs(adj))} USDT. ` +
        `Frozen balance will not change.`,
      confirmLabel: "Apply adjustment",
      tone: credit ? "grn" : "red",
    });
    if (!r) return;

    run(async () => {
      const res = await api(`/admin/options/positions/${x.id}/adjust-pnl`, {
        method: "POST",
        body: { adjustment: raw, reason: reason || null },
      });

      setRowAdj((s) => {
        const c = { ...s };
        delete c[x.id];
        return c;
      });

      ok(
        `Trade #${x.id} P&L: ${n8(res?.old_pnl ?? oldPnl)} → ${n8(res?.new_pnl ?? newPnl)} USDT.` +
          (res && res.available_after != null
            ? ` Available: ${n8(res.available_before)} → ${n8(res.available_after)} USDT.`
            : "")
      );
      refresh();
    });
  };

  /* -------------------------
     Open trade settlement override
     ------------------------- */

  const openSettlementModal = (x) => {
    setPnlForm({ pnl: "", close_price: "", reason: "" });
    setModal({ type: "settlement", trade: x });
  };

  const submitSettlement = async () => {
    if (!modal?.trade) return;

    if (pnlForm.pnl.trim() === "" || !Number.isFinite(Number(pnlForm.pnl))) {
      bad("Enter a valid settlement P&L.");
      return;
    }
    if (!pnlForm.reason.trim()) {
      bad("Reason is required.");
      return;
    }

    const x = modal.trade;
    const pnl = Number(pnlForm.pnl);

    if (pnl < -Number(x.qty)) {
      bad("P&L cannot be lower than the negative stake.");
      return;
    }

    let closePrice = null;
    if (pnlForm.close_price.trim() !== "") {
      closePrice = Number(pnlForm.close_price);
      if (!Number.isFinite(closePrice) || closePrice <= 0) {
        bad("Enter a valid close price.");
        return;
      }
    }

    const r = await ask({
      title: `Settle trade #${x.id}`,
      message: `Settle with P&L ${n8(pnl)} USDT? This closes the trade and pays out stake + P&L.`,
      confirmLabel: "Settle trade",
      tone: "pri",
    });
    if (!r) return;

    run(async () => {
      const body = { pnl: String(pnlForm.pnl), reason: pnlForm.reason.trim() };
      if (closePrice != null) body.close_price = String(pnlForm.close_price);

      await api(`/admin/options/positions/${x.id}/settlement-override`, {
        method: "POST",
        body,
      });

      setModal(null);
      ok(`Trade #${x.id} settled successfully.`);
      refresh();
    });
  };

  const platPnl = sum ? sum.today_platform_pnl : 0;
  const isProp = form.mode === "proportional";

  /* =========================================================
     Render
     ========================================================= */

  return (
    <div className="ao">
      <style>{CSS}</style>

      {/* Toasts */}
      <div className="ao-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={"ao-toast " + t.type} role="status">
            <i>{t.type === "success" ? "✓" : t.type === "error" ? "!" : "i"}</i>
            <p>{t.msg}</p>
            <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Top bar */}
      <header className="ao-bar">
        <div className="ao-bar-in">
          <div className="ao-brand">
            <div className="ao-logo">C</div>
            <div>
              <b>Trading Admin</b>
              <small>Options Management</small>
            </div>
          </div>

          <div className="ao-bar-r">
            <button type="button" className="ao-btn sm" onClick={() => open("admin")}>
              ← Back
            </button>
            <span className="ao-admin">{adminLabel}</span>
            <button
              type="button"
              className="ao-btn sm ghost-red"
              onClick={() => logout && logout()}
            >
              Logout
            </button>
          </div>
        </div>

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
      </header>

      <main className="ao-wrap">
        {/* Header */}
        <div className="ao-h">
          <h1>Options trading</h1>

          <div className="ao-h-r">
            {cfg && (
              <div className="ao-sw">
                <span>Trading:</span>
                <b className={cfg.enabled ? "on" : "off"}>{cfg.enabled ? "ON" : "OFF"}</b>
                <button
                  type="button"
                  className={"ao-btn sm " + (cfg.enabled ? "red" : "grn")}
                  disabled={busy}
                  onClick={toggleMaster}
                >
                  {cfg.enabled ? "Turn OFF" : "Turn ON"}
                </button>
              </div>
            )}

            <button type="button" className="ao-btn" disabled={busy} onClick={refresh}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Summary */}
        {sum && (
          <div className="ao-stats">
            <Stat label="Open trades">{sum.open_count}</Stat>
            <Stat label="Open volume (USDT)">{n2(sum.open_volume)}</Stat>
            <Stat label="Today trades / users">
              {sum.today_trades} / {sum.today_users}
            </Stat>
            <Stat label="Today volume (USDT)">{n2(sum.today_volume)}</Stat>
            <Stat label="Today platform P&L" cls={platPnl >= 0 ? "up" : "dn"}>
              {n2(platPnl)}
            </Stat>
            <Stat label="Total platform P&L" cls={sum.total_platform_pnl >= 0 ? "up" : "dn"}>
              {n2(sum.total_platform_pnl)}
            </Stat>
          </div>
        )}

        {/* Exposure */}
        {sum?.exposure?.length > 0 && (
          <div className="ao-pan">
            <h3>Open exposure by coin (USDT)</h3>
            <div className="ao-chips">
              {sum.exposure.map((e) => (
                <span key={e.sym} className="ao-chip plain">
                  {e.sym}: <b className="up">Long {n2(e.long)}</b> ·{" "}
                  <b className="dn">Short {n2(e.short)}</b>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trading settings */}
        {cfg && (
          <div className="ao-pan">
            <h3>Coins — enable / disable</h3>

            <div className="ao-chips">
              {(cfg.coins || []).map((c) => {
                const disabled = (cfg.disabled_syms || []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={busy}
                    className={"ao-chip" + (disabled ? " off" : "")}
                    onClick={() => toggleCoin(c)}
                  >
                    {c} · {disabled ? "OFF" : "ON"}
                  </button>
                );
              })}
            </div>

            <h3>Trading rules &amp; limits</h3>

            <div className="ao-form">
              <label>
                Mode
                <select
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                >
                  <option value="proportional">Proportional (real P&amp;L)</option>
                  <option value="fixed">Fixed yield (all-or-nothing)</option>
                </select>
              </label>

              <label>
                Leverage (×)
                <input
                  value={form.leverage}
                  disabled={!isProp}
                  inputMode="decimal"
                  onChange={(e) => setForm({ ...form, leverage: e.target.value })}
                />
              </label>

              <label>
                Yield (0.85 = 85%)
                <input
                  value={form.yield}
                  disabled={isProp}
                  inputMode="decimal"
                  onChange={(e) => setForm({ ...form, yield: e.target.value })}
                />
              </label>

              <label>
                Min stake
                <input
                  value={form.qty_min}
                  inputMode="decimal"
                  onChange={(e) => setForm({ ...form, qty_min: e.target.value })}
                />
              </label>

              <label>
                Max stake
                <input
                  value={form.qty_max}
                  inputMode="decimal"
                  onChange={(e) => setForm({ ...form, qty_max: e.target.value })}
                />
              </label>

              <label>
                Max open / user (0 = ∞)
                <input
                  value={form.max_open}
                  inputMode="numeric"
                  onChange={(e) => setForm({ ...form, max_open: e.target.value })}
                />
              </label>

              <button
                type="button"
                className="ao-btn pri"
                style={{ height: 38 }}
                disabled={busy}
                onClick={saveLimits}
              >
                Save rules
              </button>
            </div>

            <div className="ao-note">
              Proportional: profit/loss = stake × price change % × leverage. Loss never
              exceeds stake. Fixed: win = stake × yield, loss = whole stake.
              <br />
              Changes apply to new trades only. Open trades keep their original rules.
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="ao-tabs" role="tablist">
          {[
            ["pos", "Trades"],
            ["usr", "Users"],
            ["audit", "Audit history"],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={tab === k ? "on" : ""}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {tab !== "audit" && (
          <div className="ao-pan">
            <div className="ao-filters">
              <label>
                Search (email / UID / ID)
                <input
                  value={f.q}
                  onChange={(e) => setF({ ...f, q: e.target.value })}
                  placeholder="Search user"
                />
              </label>

              {tab === "pos" && (
                <>
                  <label>
                    Status
                    <select
                      value={f.status}
                      onChange={(e) => setF({ ...f, status: e.target.value })}
                    >
                      <option value="">All</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </label>

                  <label>
                    Coin
                    <select
                      value={f.sym}
                      onChange={(e) => setF({ ...f, sym: e.target.value })}
                    >
                      <option value="">All</option>
                      {(cfg?.coins || []).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    className="ao-btn red"
                    style={{ height: 38 }}
                    disabled={busy}
                    onClick={() =>
                      cancelAll({ sym: f.sym || null }, f.sym ? `for ${f.sym}` : "(all coins)")
                    }
                  >
                    Cancel all open {f.sym || ""}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* =====================================================
            Trades — one card per trade
            ===================================================== */}
        {tab === "pos" &&
          (rows.length === 0 ? (
            <div className="ao-empty">No trades found.</div>
          ) : (
            <div className="ao-grid">
              {rows.map((x, i) => {
                const long = isLong(x.direction);
                const pv = x.status === "closed" ? previewOf(x) : null;
                const cur = rowAdj[x.id] || { adj: "", reason: "" };

                return (
                  <article className="ao-item" key={x.id}>
                    <div className="ao-item-h">
                      <div className="ao-item-h-l">
                        <span className="ao-sn">{i + 1}</span>
                        <span className="ao-id">#{x.id}</span>
                        <span className="ao-id">{x.sym}/USDT</span>
                        <span className="ao-tag" style={{ background: long ? "#0f9d6b" : "#d6414f" }}>
                          {long ? "LONG" : "SHORT"}
                        </span>
                      </div>
                      <span className={"ao-st " + x.status}>{x.status}</span>
                    </div>

                    <div className="ao-item-b">
                      <Kv label="User" full>
                        {x.email} <span style={{ color: "#98a2b3", fontWeight: 400 }}>· UID {x.uid}</span>
                      </Kv>
                      <Kv label="Stake (USDT)">{n2(x.qty)}</Kv>
                      <Kv label="Rule">{ruleOf(x)}</Kv>
                      <Kv label="Open price">{x.open_price}</Kv>
                      <Kv label="Close price">{x.close_price != null ? x.close_price : "--"}</Kv>
                      <Kv label="P&L (user)" cls={sign(x.pnl)}>
                        {x.pnl != null ? n8(x.pnl) : "--"}
                      </Kv>
                      <Kv label="Live P&L" cls={sign(x.floating_pnl)}>
                        {x.floating_pnl != null ? n2(x.floating_pnl) : "--"}
                      </Kv>
                      <Kv label={x.status === "open" ? "Ends at" : "Closed at"} full>
                        {dt(x.end_at)}
                      </Kv>
                      {x.admin_note && (
                        <Kv label="Admin note" full>
                          {x.admin_note}
                        </Kv>
                      )}
                    </div>

                    {x.status === "closed" && (
                      <div className="ao-adj">
                        <small>Adjust closed P&amp;L (this trade only)</small>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="+5 or -3.5"
                          value={cur.adj}
                          onChange={(e) => setRow(x.id, { adj: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={cur.reason}
                          onChange={(e) => setRow(x.id, { reason: e.target.value })}
                        />
                        {pv.valid && (
                          <div className={"pv" + (pv.tooLow ? " bad" : "")}>
                            {n8(pv.oldPnl)} → <b>{n8(pv.newPnl)}</b>
                            {pv.tooLow ? " (below negative stake!)" : ""}
                          </div>
                        )}
                        <button
                          type="button"
                          className="ao-btn pri sm block"
                          disabled={busy || !pv.valid || pv.tooLow}
                          onClick={() => submitRowPnl(x)}
                        >
                          Apply to #{x.id}
                        </button>
                      </div>
                    )}

                    {x.status === "open" && (
                      <div className="ao-item-f">
                        <button
                          type="button"
                          className="ao-btn red sm"
                          disabled={busy}
                          onClick={() => cancelOne(x)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="ao-btn pri sm"
                          disabled={busy}
                          onClick={() => openSettlementModal(x)}
                        >
                          Settle
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ))}

        {/* =====================================================
            Users — one card per user
            ===================================================== */}
        {tab === "usr" &&
          (users.length === 0 ? (
            <div className="ao-empty">No users found.</div>
          ) : (
            <div className="ao-grid">
              {users.map((u, i) => (
                <article className="ao-item" key={u.user_id}>
                  <div className="ao-item-h">
                    <div className="ao-item-h-l">
                      <span className="ao-sn">{i + 1}</span>
                      <span className="ao-id" style={{ wordBreak: "break-all" }}>
                        {u.email}
                      </span>
                    </div>
                    <span className={"ao-st " + (u.blocked ? "blocked" : "active")}>
                      {u.blocked ? "Blocked" : "Active"}
                    </span>
                  </div>

                  <div className="ao-item-b">
                    <Kv label="UID / ID" full>
                      UID {u.uid} · ID {u.user_id}
                    </Kv>
                    <Kv label="Trades">{u.trades}</Kv>
                    <Kv label="Volume (USDT)">{n2(u.volume)}</Kv>
                    <Kv label="Win / Loss">
                      <span className="up">{u.wins}</span> / <span className="dn">{u.losses}</span>
                    </Kv>
                    <Kv label="Net P&L" cls={u.net_pnl >= 0 ? "up" : "dn"}>
                      {n2(u.net_pnl)}
                    </Kv>
                    <Kv label="Open trades">
                      {u.open_count} ({n2(u.open_volume)})
                    </Kv>
                    <Kv label="Last trade">{dt(u.last_trade)}</Kv>
                    {u.block_reason && (
                      <Kv label="Block reason" full>
                        {u.block_reason}
                      </Kv>
                    )}
                  </div>

                  <div className="ao-item-f">
                    <button
                      type="button"
                      className="ao-btn grn sm"
                      disabled={busy}
                      onClick={() => openWalletModal(u, "add")}
                    >
                      + Add
                    </button>
                    <button
                      type="button"
                      className="ao-btn red sm"
                      disabled={busy}
                      onClick={() => openWalletModal(u, "deduct")}
                    >
                      − Deduct
                    </button>
                    <button
                      type="button"
                      className={"ao-btn sm " + (u.blocked ? "grn" : "red")}
                      disabled={busy}
                      onClick={() => blockUser(u)}
                    >
                      {u.blocked ? "Unblock" : "Block"}
                    </button>
                    <button
                      type="button"
                      className="ao-btn sm"
                      disabled={busy}
                      onClick={() => setUserTrading(u)}
                    >
                      Trading
                    </button>
                    {u.open_count > 0 && (
                      <button
                        type="button"
                        className="ao-btn sm"
                        disabled={busy}
                        onClick={() => cancelAll({ user_id: u.user_id }, `of ${u.email}`)}
                      >
                        Cancel open
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ))}

        {/* =====================================================
            Audit history — one card per record
            ===================================================== */}
        {tab === "audit" &&
          (audits.length === 0 ? (
            <div className="ao-empty">No audit records.</div>
          ) : (
            <div className="ao-grid">
              {audits.map((a, i) => (
                <article className="ao-item" key={a.id}>
                  <div className="ao-item-h">
                    <div className="ao-item-h-l">
                      <span className="ao-sn">{i + 1}</span>
                      <span className="ao-id">Audit #{a.id}</span>
                    </div>
                    <span className="ao-pill">{a.action}</span>
                  </div>

                  <div className="ao-item-b">
                    <Kv label="Admin ID">{a.admin_id}</Kv>
                    <Kv label="User ID">{a.user_id}</Kv>
                    <Kv label="Trade ID">{a.position_id ?? "--"}</Kv>
                    <Kv label="Coin">{a.coin || "--"}</Kv>
                    <Kv label="Amount">{a.amount != null ? n8(a.amount) : "--"}</Kv>
                    <Kv label="Old → New">
                      {a.old_value != null ? n8(a.old_value) : "--"} →{" "}
                      {a.new_value != null ? n8(a.new_value) : "--"}
                    </Kv>
                    <Kv label="Reason" full>
                      {a.reason || "--"}
                    </Kv>
                    <Kv label="Time" full>
                      {dt(a.created_at)}
                    </Kv>
                  </div>
                </article>
              ))}
            </div>
          ))}
      </main>

      {/* Wallet modal (centered) */}
      {modal?.type === "wallet" && (
        <div className="ao-modal-bg" onClick={() => !busy && setModal(null)}>
          <div
            className="ao-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{modal.action === "add" ? "Add USDT" : "Deduct USDT"}</h3>
            <div className="ao-note" style={{ marginTop: 0 }}>
              User: <b>{modal.user.email}</b> · ID {modal.user.user_id}
            </div>

            <div className="fields">
              <label>
                Amount (USDT)
                <input
                  type="number"
                  min="0.00000001"
                  step="0.00000001"
                  inputMode="decimal"
                  value={walletForm.amount}
                  onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </label>

              <label>
                Reason (required)
                <textarea
                  value={walletForm.reason}
                  onChange={(e) => setWalletForm({ ...walletForm, reason: e.target.value })}
                  placeholder="Write adjustment reason"
                />
              </label>
            </div>

            <div className="ao-note">
              Only the available balance changes. Frozen balance is never changed. If the
              available balance is not enough for a deduct, the request is rejected.
            </div>

            <div className="ao-modal-footer">
              <button type="button" className="ao-btn" disabled={busy} onClick={() => setModal(null)}>
                Close
              </button>
              <button
                type="button"
                className={"ao-btn " + (modal.action === "add" ? "grn" : "red")}
                disabled={busy}
                onClick={submitWallet}
              >
                {busy ? "Processing..." : modal.action === "add" ? "Confirm add" : "Confirm deduct"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement modal (centered) */}
      {modal?.type === "settlement" && (
        <div className="ao-modal-bg" onClick={() => !busy && setModal(null)}>
          <div
            className="ao-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Override trade settlement</h3>
            <div className="ao-note" style={{ marginTop: 0 }}>
              Trade <b>#{modal.trade.id}</b> · {modal.trade.email || "User"} · {modal.trade.sym} ·
              Stake {n2(modal.trade.qty)} USDT
            </div>

            <div className="fields">
              <label>
                Settlement P&amp;L (USDT)
                <input
                  type="number"
                  step="0.00000001"
                  inputMode="decimal"
                  value={pnlForm.pnl}
                  onChange={(e) => setPnlForm({ ...pnlForm, pnl: e.target.value })}
                  placeholder="Positive = profit, negative = loss"
                />
              </label>

              <label>
                Close price (optional)
                <input
                  type="number"
                  min="0.00000001"
                  step="any"
                  inputMode="decimal"
                  value={pnlForm.close_price}
                  onChange={(e) => setPnlForm({ ...pnlForm, close_price: e.target.value })}
                  placeholder="Optional close price"
                />
              </label>

              <label>
                Reason (required)
                <textarea
                  value={pnlForm.reason}
                  onChange={(e) => setPnlForm({ ...pnlForm, reason: e.target.value })}
                  placeholder="Explain why this settlement is needed"
                />
              </label>
            </div>

            <div className="ao-note">
              This closes the open trade. The backend pays out stake + P&amp;L to the available
              wallet. P&amp;L cannot be lower than the negative stake.
            </div>

            <div className="ao-modal-footer">
              <button type="button" className="ao-btn" disabled={busy} onClick={() => setModal(null)}>
                Close
              </button>
              <button type="button" className="ao-btn pri" disabled={busy} onClick={submitSettlement}>
                {busy ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm / reason dialog (centered, above everything) */}
      {dlg && (
        <div className="ao-modal-bg top" onClick={() => closeDlg(null)}>
          <div
            className="ao-modal"
            style={{ width: "min(440px,100%)" }}
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{dlg.title}</h3>
            {dlg.message && <p className="msg">{dlg.message}</p>}

            {dlg.input && (
              <div className="fields">
                <label>
                  {dlg.input.label || "Reason"}
                  <textarea
                    autoFocus
                    value={dlg.value}
                    placeholder={dlg.input.placeholder || ""}
                    onChange={(e) => setDlg({ ...dlg, value: e.target.value })}
                  />
                </label>
              </div>
            )}

            <div className="ao-modal-footer">
              <button type="button" className="ao-btn" onClick={() => closeDlg(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={"ao-btn " + (dlg.tone || "pri")}
                onClick={confirmDlg}
              >
                {dlg.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
