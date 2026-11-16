
import React, { useCallback, useEffect, useState } from "react";
import { api } from "../Home";

/* =========================================================
   src/pages/admin/AdminOptions.jsx
   Admin -> Options trading
   Props: me, go, logout
   API: /admin/options/*
   ========================================================= */

const n2 = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  return x.yield_rate != null
    ? Math.round(x.yield_rate * 100) + "%"
    : "--";
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
.ao-row input,.ao-row select,.ao-row textarea{height:36px;padding:0 10px;border:1px solid #cfd3d9;border-radius:8px;min-width:110px;font:inherit;background:#fff}
.ao-row textarea{height:70px;padding:9px;min-width:220px}
.ao-row input:disabled{background:#f0f2f6;color:#9aa0ad}
.ao-tabs{display:flex;gap:8px;margin-bottom:10px;overflow-x:auto}
.ao-tabs button{height:36px;padding:0 18px;border-radius:8px;border:1px solid #cfd3d9;background:#fff;white-space:nowrap}
.ao-tabs button.on{background:#1a82d6;border-color:#1a82d6;color:#fff}
.ao-tw{overflow-x:auto;background:#fff;border:1px solid #e4e7ec;border-radius:10px;margin-bottom:14px}
.ao table{width:100%;border-collapse:collapse;font-size:13px;white-space:nowrap}
.ao th{background:#f7f8fb;text-align:left;padding:9px 10px;color:#6b7183;font-weight:600}
.ao td{padding:8px 10px;border-top:1px solid #eef0f3}
.ao .up{color:#00a870}.ao .dn{color:#d84d5a}
.ao-tag{padding:2px 8px;border-radius:4px;color:#fff;font-size:12px}
.ao-err{margin-bottom:12px;padding:10px 14px;border-radius:8px;background:#fdecee;color:#c8323f;font-size:14px}
.ao-success{margin-bottom:12px;padding:10px 14px;border-radius:8px;background:#e3f7ee;color:#087d58;font-size:14px}
.ao-none{text-align:center;color:#9aa0ad;padding:30px}
.ao-note{margin-top:8px;font-size:12px;color:#8a94a6;line-height:1.5}
.ao-actions{display:flex;gap:6px;flex-wrap:wrap}
.ao-modal-bg{position:fixed;inset:0;background:#0008;z-index:9999;display:flex;align-items:center;justify-content:center;padding:15px}
.ao-modal{width:min(520px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:14px;padding:18px;box-shadow:0 15px 50px #0003}
.ao-modal h3{margin:0 0 14px;font-size:18px}
.ao-modal .ao-row{display:grid;grid-template-columns:1fr 1fr;align-items:end}
.ao-modal .ao-row label{min-width:0}
.ao-modal .ao-row input,.ao-modal .ao-row select,.ao-modal .ao-row textarea{width:100%;min-width:0}
.ao-modal .full{grid-column:1/-1}
.ao-modal-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.ao-pill{font-size:11px;border-radius:20px;padding:4px 8px;background:#edf1f7;color:#536174}
@media(max-width:550px){
  .ao{padding:12px}
  .ao-nav button{min-width:110px}
  .ao-modal .ao-row{grid-template-columns:1fr}
}
`;

export default function AdminOptions({ me, go, logout }) {
  const [sum, setSum] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [tab, setTab] = useState("pos");
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [audits, setAudits] = useState([]);

  const [f, setF] = useState({
    status: "open",
    q: "",
    sym: "",
  });

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [modal, setModal] = useState(null);
  const [walletForm, setWalletForm] = useState({
    amount: "",
    reason: "",
  });
  const [pnlForm, setPnlForm] = useState({
    pnl: "",
    close_price: "",
    reason: "",
  });

  const adminLabel =
    me?.full_name ||
    me?.name ||
    me?.username ||
    me?.email ||
    "Administrator";

  const open = (key) => {
    if (key !== CURRENT_PAGE && go) go(key);
  };

  const run = async (fn) => {
    setBusy(true);
    setErr("");
    setSuccess("");
    try {
      await fn();
    } catch (e) {
      setErr((e && e.message) || "Request failed");
    } finally {
      setBusy(false);
    }
  };

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
      setErr((e && e.message) || "Settings load failed");
    }
  }, []);

  const loadRows = useCallback(async () => {
    try {
      const r = await api(
        "/admin/options/positions" + qs({ ...f, limit: 200 })
      );
      setRows(Array.isArray(r) ? r : []);
    } catch (_) {}
  }, [f]);

  const loadUsers = useCallback(async () => {
    try {
      const r = await api(
        "/admin/options/users" + qs({ q: f.q, limit: 200 })
      );
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

  const saveCfg = (changes) =>
    run(async () => {
      const c = await api("/admin/options/settings", {
        method: "PUT",
        body: changes,
      });
      setCfg(c);
      setForm(formFrom(c));
      setSuccess("Settings updated successfully.");
      loadSum();
    });

  const toggleMaster = () => {
    if (!cfg) return;
    const next = !cfg.enabled;

    if (
      !next &&
      !window.confirm(
        "Turn OFF all Options trading? Existing open trades will continue."
      )
    ) return;

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

  const cancelOne = (x) => {
    const note = window.prompt(
      `Cancel trade #${x.id}. Stake ${n2(x.qty)} USDT will be refunded. Reason:`,
      ""
    );

    if (note === null) return;

    run(async () => {
      await api(`/admin/options/positions/${x.id}/cancel`, {
        method: "POST",
        body: { note },
      });
      setSuccess("Trade canceled and refund processed.");
      refresh();
    });
  };

  const cancelAll = (body, label) => {
    if (
      !window.confirm(
        `Cancel ALL open trades ${label}? Stakes will be refunded.`
      )
    ) return;

    const note = window.prompt("Reason (optional):", "");
    if (note === null) return;

    run(async () => {
      const r = await api("/admin/options/cancel-all", {
        method: "POST",
        body: { ...body, note },
      });

      window.alert(`Canceled: ${r.canceled}`);
      setSuccess(`${r.canceled} trades canceled.`);
      refresh();
    });
  };

  const blockUser = (u) => {
    if (u.blocked) {
      if (!window.confirm(`Enable trading for ${u.email}?`)) return;

      run(async () => {
        await api(`/admin/options/users/${u.user_id}/unblock`, {
          method: "POST",
          body: {},
        });
        setSuccess("User trading enabled.");
        refresh();
      });
      return;
    }

    const reason = window.prompt(
      `Disable Options trading for ${u.email}. Reason:`,
      ""
    );

    if (reason === null) return;

    run(async () => {
      await api(`/admin/options/users/${u.user_id}/block`, {
        method: "POST",
        body: { reason },
      });
      setSuccess("User trading disabled.");
      refresh();
    });
  };

  /* =========================
     Wallet Add / Deduct
     ========================= */

  const openWalletModal = (u, action) => {
    setWalletForm({ amount: "", reason: "" });
    setModal({
      type: "wallet",
      user: u,
      action,
    });
  };

  const submitWallet = () => {
    if (!modal?.user) return;

    const amount = Number(walletForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setErr("Enter a valid amount greater than zero.");
      return;
    }

    if (!walletForm.reason.trim()) {
      setErr("Reason is required.");
      return;
    }

    const action = modal.action;
    const userId = modal.user.user_id;

    const verb = action === "add" ? "Add" : "Deduct";

    if (
      !window.confirm(
        `${verb} ${n2(amount)} USDT ${action === "add" ? "to" : "from"} ${modal.user.email}?`
      )
    ) return;

    run(async () => {
      const path =
        action === "add"
          ? `/admin/options/users/${userId}/wallet/add`
          : `/admin/options/users/${userId}/wallet/deduct`;

      await api(path, {
        method: "POST",
        body: {
          amount: String(walletForm.amount),
          coin: "USDT",
          reason: walletForm.reason.trim(),
        },
      });

      setModal(null);
      setSuccess(`Wallet ${action === "add" ? "credited" : "debited"} successfully.`);
      loadUsers();
    });
  };

  /* =========================
     Closed PnL Adjustment
     ========================= */

  const openPnlModal = (x) => {
    setPnlForm({
      pnl: String(x.pnl ?? "0"),
      close_price: "",
      reason: "",
    });

    setModal({
      type: "pnl",
      trade: x,
    });
  };

  const submitPnl = () => {
    if (!modal?.trade) return;

    if (pnlForm.pnl.trim() === "" || !Number.isFinite(Number(pnlForm.pnl))) {
      setErr("Enter a valid P&L amount.");
      return;
    }

    if (!pnlForm.reason.trim()) {
      setErr("Reason is required.");
      return;
    }

    const x = modal.trade;

    if (
      !window.confirm(
        `Change trade #${x.id} P&L from ${n2(x.pnl)} to ${n2(pnlForm.pnl)} USDT?`
      )
    ) return;

    run(async () => {
      await api(`/admin/options/positions/${x.id}/adjust-pnl`, {
        method: "POST",
        body: {
          pnl: String(pnlForm.pnl),
          reason: pnlForm.reason.trim(),
        },
      });

      setModal(null);
      setSuccess("Closed trade P&L updated.");
      refresh();
    });
  };

  /* =========================
     Open Trade Settlement
     ========================= */

  const openSettlementModal = (x) => {
    setPnlForm({
      pnl: "",
      close_price: "",
      reason: "",
    });

    setModal({
      type: "settlement",
      trade: x,
    });
  };

  const submitSettlement = () => {
    if (!modal?.trade) return;

    if (pnlForm.pnl.trim() === "" || !Number.isFinite(Number(pnlForm.pnl))) {
      setErr("Enter a valid settlement P&L.");
      return;
    }

    if (!pnlForm.reason.trim()) {
      setErr("Reason is required.");
      return;
    }

    const x = modal.trade;
    const pnl = Number(pnlForm.pnl);

    if (pnl < -Number(x.qty)) {
      setErr("P&L cannot be lower than negative stake.");
      return;
    }

    if (
      !window.confirm(
        `Settle trade #${x.id} with P&L ${n2(pnl)} USDT? This closes the trade.`
      )
    ) return;

    run(async () => {
      const body = {
        pnl: String(pnlForm.pnl),
        reason: pnlForm.reason.trim(),
      };

      if (pnlForm.close_price.trim() !== "") {
        const closePrice = Number(pnlForm.close_price);
        if (!Number.isFinite(closePrice) || closePrice <= 0) {
          throw new Error("Enter a valid close price.");
        }
        body.close_price = String(pnlForm.close_price);
      }

      await api(`/admin/options/positions/${x.id}/settlement-override`, {
        method: "POST",
        body,
      });

      setModal(null);
      setSuccess("Trade settled successfully.");
      refresh();
    });
  };

  const setUserTrading = (u) => {
    const enabled = !!u.blocked;

    const reason = window.prompt(
      `${enabled ? "Enable" : "Disable"} trading for ${u.email}. Reason:`,
      ""
    );

    if (reason === null) return;

    run(async () => {
      await api(`/admin/options/users/${u.user_id}/trading`, {
        method: "PUT",
        body: {
          enabled,
          reason,
        },
      });

      setSuccess(`User trading ${enabled ? "enabled" : "disabled"}.`);
      refresh();
    });
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
          <button
            type="button"
            className="ao-btn out"
            onClick={() => logout && logout()}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation */}
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

      {/* Header */}
      <div className="ao-h">
        <h1>Options trading</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {cfg && (
            <div className="ao-sw">
              <span>Trading:</span>
              <b className={cfg.enabled ? "on" : "off"}>
                {cfg.enabled ? "ON" : "OFF"}
              </b>
              <button
                type="button"
                className={"ao-btn " + (cfg.enabled ? "red" : "grn")}
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

      {err && <div className="ao-err">{err}</div>}
      {success && <div className="ao-success">{success}</div>}

      {/* Summary */}
      {sum && (
        <div className="ao-cards">
          <div className="ao-card">
            <small>Open trades</small>
            <b>{sum.open_count}</b>
          </div>
          <div className="ao-card">
            <small>Open volume (USDT)</small>
            <b>{n2(sum.open_volume)}</b>
          </div>
          <div className="ao-card">
            <small>Today trades / users</small>
            <b>{sum.today_trades} / {sum.today_users}</b>
          </div>
          <div className="ao-card">
            <small>Today volume (USDT)</small>
            <b>{n2(sum.today_volume)}</b>
          </div>
          <div className="ao-card">
            <small>Today platform P&amp;L</small>
            <b className={platPnl >= 0 ? "up" : "dn"}>{n2(platPnl)}</b>
          </div>
          <div className="ao-card">
            <small>Total platform P&amp;L</small>
            <b className={sum.total_platform_pnl >= 0 ? "up" : "dn"}>
              {n2(sum.total_platform_pnl)}
            </b>
          </div>
        </div>
      )}

      {/* Exposure */}
      {sum?.exposure?.length > 0 && (
        <div className="ao-pan">
          <h3>Open exposure by coin (USDT)</h3>
          <div className="ao-chips">
            {sum.exposure.map((e) => (
              <span
                key={e.sym}
                className="ao-chip"
                style={{
                  background: "#f3f5fa",
                  borderColor: "#cfd3d9",
                  color: "#1a1a1a",
                }}
              >
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
          <h3>Coins — Enable / Disable</h3>

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

          <div className="ao-row">
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
                onChange={(e) => setForm({ ...form, leverage: e.target.value })}
              />
            </label>

            <label>
              Yield (0.85 = 85%)
              <input
                value={form.yield}
                disabled={isProp}
                onChange={(e) => setForm({ ...form, yield: e.target.value })}
              />
            </label>

            <label>
              Min stake
              <input
                value={form.qty_min}
                onChange={(e) => setForm({ ...form, qty_min: e.target.value })}
              />
            </label>

            <label>
              Max stake
              <input
                value={form.qty_max}
                onChange={(e) => setForm({ ...form, qty_max: e.target.value })}
              />
            </label>

            <label>
              Max open / user (0 = ∞)
              <input
                value={form.max_open}
                onChange={(e) => setForm({ ...form, max_open: e.target.value })}
              />
            </label>

            <button
              type="button"
              className="ao-btn pri"
              disabled={busy}
              onClick={saveLimits}
            >
              Save rules
            </button>
          </div>

          <div className="ao-note">
            Proportional: profit/loss = stake × price change % × leverage.
            Loss never exceeds stake. Fixed: win = stake × yield, loss = whole
            stake.
            <br />
            Changes apply to new trades only. Open trades keep their original rules.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="ao-tabs">
        <button
          type="button"
          className={tab === "pos" ? "on" : ""}
          onClick={() => setTab("pos")}
        >
          Trades
        </button>
        <button
          type="button"
          className={tab === "usr" ? "on" : ""}
          onClick={() => setTab("usr")}
        >
          Users
        </button>
        <button
          type="button"
          className={tab === "audit" ? "on" : ""}
          onClick={() => setTab("audit")}
        >
          Audit History
        </button>
      </div>

      {/* Search filters */}
      {tab !== "audit" && (
        <div className="ao-pan">
          <div className="ao-row">
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
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="ao-btn red"
                  disabled={busy}
                  onClick={() =>
                    cancelAll(
                      { sym: f.sym || null },
                      f.sym ? `for ${f.sym}` : "(ALL coins)"
                    )
                  }
                >
                  Cancel all open {f.sym || ""}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Trades */}
      {tab === "pos" && (
        <div className="ao-tw">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Pair</th>
                <th>Side</th>
                <th>Stake</th>
                <th>Open</th>
                <th>Close</th>
                <th>P&amp;L (user)</th>
                <th>Live P&amp;L</th>
                <th>Rule</th>
                <th>Time</th>
                <th>Status</th>
                <th>Admin actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={13} className="ao-none">No trades</td>
                </tr>
              )}

              {rows.map((x) => (
                <tr key={x.id}>
                  <td>{x.id}</td>
                  <td>
                    {x.email}
                    <br />
                    <small style={{ color: "#8a94a6" }}>UID {x.uid}</small>
                  </td>
                  <td>{x.sym}/USDT</td>
                  <td>
                    <span
                      className="ao-tag"
                      style={{
                        background: isLong(x.direction) ? "#00a870" : "#d84d5a",
                      }}
                    >
                      {isLong(x.direction) ? "LONG" : "SHORT"}
                    </span>
                  </td>
                  <td>{n2(x.qty)}</td>
                  <td>{x.open_price}</td>
                  <td>{x.close_price != null ? x.close_price : "--"}</td>
                  <td className={x.pnl > 0 ? "up" : x.pnl < 0 ? "dn" : ""}>
                    {x.pnl != null ? n2(x.pnl) : "--"}
                  </td>
                  <td className={x.floating_pnl > 0 ? "up" : x.floating_pnl < 0 ? "dn" : ""}>
                    {x.floating_pnl != null ? n2(x.floating_pnl) : "--"}
                  </td>
                  <td>{ruleOf(x)}</td>
                  <td>{x.status === "open" ? "ends " + dt(x.end_at) : dt(x.end_at)}</td>
                  <td>
                    {x.status}
                    {x.admin_note && (
                      <>
                        <br />
                        <small style={{ color: "#8a94a6" }}>{x.admin_note}</small>
                      </>
                    )}
                  </td>
                  <td>
                    <div className="ao-actions">
                      {x.status === "open" && (
                        <>
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
                        </>
                      )}

                      {x.status === "closed" && (
                        <button
                          type="button"
                          className="ao-btn sm"
                          disabled={busy}
                          onClick={() => openPnlModal(x)}
                        >
                          Edit P&amp;L
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users */}
      {tab === "usr" && (
        <div className="ao-tw">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Trades</th>
                <th>Volume</th>
                <th>Win / Loss</th>
                <th>Net P&amp;L</th>
                <th>Open</th>
                <th>Last trade</th>
                <th>Status</th>
                <th>Wallet / Trading</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={9} className="ao-none">No users</td></tr>
              )}

              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>
                    {u.email}
                    <br />
                    <small style={{ color: "#8a94a6" }}>
                      UID {u.uid} · ID {u.user_id}
                    </small>
                  </td>
                  <td>{u.trades}</td>
                  <td>{n2(u.volume)}</td>
                  <td>
                    <span className="up">{u.wins}</span> /{" "}
                    <span className="dn">{u.losses}</span>
                  </td>
                  <td className={u.net_pnl >= 0 ? "up" : "dn"}>
                    {n2(u.net_pnl)}
                  </td>
                  <td>{u.open_count} ({n2(u.open_volume)})</td>
                  <td>{dt(u.last_trade)}</td>
                  <td>
                    {u.blocked ? <b className="dn">Blocked</b> : "Active"}
                    {u.block_reason && (
                      <>
                        <br />
                        <small>{u.block_reason}</small>
                      </>
                    )}
                  </td>
                  <td>
                    <div className="ao-actions">
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
                          onClick={() =>
                            cancelAll({ user_id: u.user_id }, `of ${u.email}`)
                          }
                        >
                          Cancel open
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit History */}
      {tab === "audit" && (
        <div className="ao-tw">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Admin</th>
                <th>User ID</th>
                <th>Trade ID</th>
                <th>Action</th>
                <th>Amount</th>
                <th>Old value</th>
                <th>New value</th>
                <th>Coin</th>
                <th>Reason</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {audits.length === 0 && (
                <tr><td colSpan={11} className="ao-none">No audit records</td></tr>
              )}

              {audits.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.admin_id}</td>
                  <td>{a.user_id}</td>
                  <td>{a.position_id ?? "--"}</td>
                  <td><span className="ao-pill">{a.action}</span></td>
                  <td>{a.amount != null ? n2(a.amount) : "--"}</td>
                  <td>{a.old_value != null ? n2(a.old_value) : "--"}</td>
                  <td>{a.new_value != null ? n2(a.new_value) : "--"}</td>
                  <td>{a.coin || "--"}</td>
                  <td style={{ whiteSpace: "normal", minWidth: 160 }}>{a.reason || "--"}</td>
                  <td>{dt(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Wallet Modal */}
      {modal?.type === "wallet" && (
        <div className="ao-modal-bg" onClick={() => !busy && setModal(null)}>
          <div className="ao-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modal.action === "add" ? "Add USDT" : "Deduct USDT"}
            </h3>

            <div className="ao-note">
              User: <b>{modal.user.email}</b> · ID {modal.user.user_id}
            </div>

            <div className="ao-row" style={{ marginTop: 15 }}>
              <label className="full">
                Amount (USDT)
                <input
                  type="number"
                  min="0.00000001"
                  step="0.00000001"
                  value={walletForm.amount}
                  onChange={(e) =>
                    setWalletForm({ ...walletForm, amount: e.target.value })
                  }
                  placeholder="Enter amount"
                />
              </label>

              <label className="full">
                Reason (required)
                <textarea
                  value={walletForm.reason}
                  onChange={(e) =>
                    setWalletForm({ ...walletForm, reason: e.target.value })
                  }
                  placeholder="Write adjustment reason"
                />
              </label>
            </div>

            <div className="ao-modal-footer">
              <button
                type="button"
                className="ao-btn"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={"ao-btn " + (modal.action === "add" ? "grn" : "red")}
                disabled={busy}
                onClick={submitWallet}
              >
                {busy ? "Processing..." : modal.action === "add" ? "Confirm Add" : "Confirm Deduct"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* P&L / Settlement Modal */}
      {(modal?.type === "pnl" || modal?.type === "settlement") && (
        <div className="ao-modal-bg" onClick={() => !busy && setModal(null)}>
          <div className="ao-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modal.type === "pnl" ? "Adjust Closed Trade P&L" : "Override Trade Settlement"}
            </h3>

            <div className="ao-note">
              Trade #{modal.trade.id} · {modal.trade.email || "User"} ·{" "}
              {modal.trade.sym} · Stake {n2(modal.trade.qty)} USDT
              {modal.type === "pnl" && (
                <>
                  <br />
                  Current P&amp;L: <b>{n2(modal.trade.pnl)} USDT</b>
                </>
              )}
            </div>

            <div className="ao-row" style={{ marginTop: 15 }}>
              <label className="full">
                {modal.type === "pnl" ? "New P&L (USDT)" : "Settlement P&L (USDT)"}
                <input
                  type="number"
                  step="0.00000001"
                  value={pnlForm.pnl}
                  onChange={(e) =>
                    setPnlForm({ ...pnlForm, pnl: e.target.value })
                  }
                  placeholder="Positive = profit, negative = loss"
                />
              </label>

              {modal.type === "settlement" && (
                <label className="full">
                  Close price (optional)
                  <input
                    type="number"
                    min="0.00000001"
                    step="any"
                    value={pnlForm.close_price}
                    onChange={(e) =>
                      setPnlForm({ ...pnlForm, close_price: e.target.value })
                    }
                    placeholder="Optional close price"
                  />
                </label>
              )}

              <label className="full">
                Reason (required)
                <textarea
                  value={pnlForm.reason}
                  onChange={(e) =>
                    setPnlForm({ ...pnlForm, reason: e.target.value })
                  }
                  placeholder="Explain why this adjustment is needed"
                />
              </label>
            </div>

            <div className="ao-note">
              {modal.type === "pnl"
                ? "The wallet will be adjusted by the difference between the old and new P&L. If the user has insufficient available balance for a deduction, the API should reject the change."
                : "This closes the open trade. The backend calculates the payout as stake + P&L. P&L cannot be lower than the negative stake."}
            </div>

            <div className="ao-modal-footer">
              <button
                type="button"
                className="ao-btn"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="ao-btn pri"
                disabled={busy}
                onClick={modal.type === "pnl" ? submitPnl : submitSettlement}
              >
                {busy ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
