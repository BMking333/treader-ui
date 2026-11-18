import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../Home";

/* =========================================================
   src/pages/admin/Admin_PaymentMethod.jsx
   Crypto Payment Methods  (light theme, mobile + desktop)
   ========================================================= */

const COINS = ["USDT", "BTC", "USDC", "ETH", "DOGE", "XRP", "SOL", "PYUSD"];

const NETWORKS = {
  USDT: ["TRC20", "ERC20"],
  BTC: ["BITCOIN"],
  USDC: ["ERC20"],
  ETH: ["ETHEREUM"],
  DOGE: ["DOGECOIN"],
  XRP: ["XRPL"],
  SOL: ["SOLANA"],
  PYUSD: ["ERC20"],
};

const DEFAULT_BDT_RATE = "122";

const COIN_META = {
  USDT: { symbol: "₮", className: "usdt" },
  BTC: { symbol: "₿", className: "btc" },
  USDC: { symbol: "$", className: "usdc" },
  ETH: { symbol: "◆", className: "eth" },
  DOGE: { symbol: "Ð", className: "doge" },
  XRP: { symbol: "X", className: "xrp" },
  SOL: { symbol: "◎", className: "sol" },
  PYUSD: { symbol: "$", className: "pyusd" },
};

const EMPTY_FORM = {
  method_type: "crypto",
  name: "USDT",
  coin: "USDT",
  network: "TRC20",
  currency: "USDT",
  address: "",
  account_name: "",
  bank_name: "",
  branch: "",
  qr_image_url: "",
  instructions: "",
  rate_bdt_per_coin: DEFAULT_BDT_RATE,
  min_amount: "1",
  max_amount: "10000",
  is_active: true,
};

function unwrap(res) {
  if (res?.data !== undefined) return res.data;
  if (res?.result !== undefined) return res.result;
  return res;
}

function normalizeMethods(res) {
  const data = unwrap(res);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.methods)) return data.methods;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function money(value) {
  const n = Number(value || 0);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { maximumFractionDigits: 8 })
    : "0";
}

function isCryptoMethod(item) {
  const type = String(item?.method_type || "").toLowerCase();
  const coin = String(item?.coin || "").toUpperCase();
  const currency = String(item?.currency || "").toUpperCase();
  const network = String(item?.network || "").trim();

  // Only explicitly configured crypto methods are shown.
  // This excludes legacy bKash, Nagad, Rocket and bank records.
  return type === "crypto" &&
    (COINS.includes(coin) || COINS.includes(currency)) &&
    Boolean(network || item?.address);
}

function coinMeta(coin) {
  return COIN_META[String(coin || "").toUpperCase()] || {
    symbol: "₿",
    className: "default",
  };
}

const ERROR_MESSAGES = {
  unauthorized: "আপনার Admin session শেষ হয়েছে। আবার Login করুন।",
  forbidden: "আপনার এই কাজ করার অনুমতি নেই।",
  neterr: "সার্ভারের সাথে সংযোগ করা যাচ্ছে না।",
  err: "Request failed. Please try again.",
  notFound: "Payment method পাওয়া যায়নি।",
  badPaymentMethod: "Payment method type সঠিক নয়।",
  badCoin: "Coin সঠিক নয়।",
  badNetwork: "এই Coin-এর জন্য Network সঠিক নয়।",
  badAmount: "Minimum/Maximum amount সঠিক নয়।",
  badRate: "Exchange rate শূন্যের বেশি হতে হবে।",
  badCurrency: "Currency সঠিক নয়।",
  nameRequired: "Display name আবশ্যক।",
  cryptoAddressRequired: "Crypto wallet address আবশ্যক।",
};

function getErrorMessage(err) {
  const message = err?.message || "";
  return ERROR_MESSAGES[message] || message || "Something went wrong.";
}

const CSS = `
.apm, .apm * { box-sizing: border-box; }

.apm {
  --bg: #f4f6fa;
  --surface: #ffffff;
  --line: #e5e9f0;
  --line-soft: #eef1f6;
  --text: #0f1b30;
  --text-2: #4a5568;
  --muted: #7a8699;
  --primary: #1f7acb;
  --primary-soft: #eaf3fc;
  --ok: #0e9f6e;
  --ok-soft: #e3f6ee;
  --bad: #e0415f;
  --bad-soft: #fdebee;
  --shadow: 0 1px 2px rgba(16,30,54,.04), 0 6px 20px rgba(16,30,54,.05);

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  overflow-x: hidden;
}
.apm button, .apm input, .apm select, .apm textarea { font-family: inherit; }
.apm button { cursor: pointer; -webkit-appearance: none; appearance: none; }

.apm-in {
  max-width: 1320px;
  margin: 0 auto;
  padding: 22px 24px calc(34px + env(safe-area-inset-bottom, 0px));
}

/* ---------- header ---------- */
.apm-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
  margin-bottom: 20px;
  padding-top: env(safe-area-inset-top, 0px);
}
.apm-brand { display: flex; align-items: center; gap: 13px; min-width: 0; }
.apm-mark {
  width: 46px; height: 46px; flex: none;
  display: grid; place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; font-size: 22px; font-weight: 800;
  box-shadow: 0 6px 16px rgba(40,125,225,.30);
}
.apm-title { margin: 0; font-size: 24px; line-height: 1.2; font-weight: 800; letter-spacing: -.5px; }
.apm-sub { margin-top: 5px; font-size: 13px; color: var(--muted); }
.apm-hbtns { display: flex; gap: 10px; }

/* ---------- buttons ---------- */
.apm-btn {
  min-height: 42px;
  padding: 0 18px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px; font-weight: 650;
  white-space: nowrap;
  transition: border-color .15s, background .15s, transform .1s, opacity .15s;
}
.apm-btn:hover { border-color: #c7d3e4; background: #f8fafd; }
.apm-btn:active { transform: scale(.97); }
.apm-btn:disabled { opacity: .55; cursor: not-allowed; }
.apm-btn.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.apm-btn.primary:hover { background: #1768ad; border-color: #1768ad; }
.apm-btn.sm { min-height: 36px; padding: 0 14px; font-size: 12px; }
.apm-btn.edit { background: var(--primary-soft); border-color: #b9d3ee; color: var(--primary); }
.apm-btn.edit:hover { background: #dcebfa; }
.apm-btn.disable { background: var(--bad-soft); border-color: #f4c5cd; color: var(--bad); }
.apm-btn.disable:hover { background: #fadde2; }
.apm-btn.enable { background: var(--ok-soft); border-color: #bfe8d6; color: var(--ok); }
.apm-btn.enable:hover { background: #d3f0e4; }

/* ---------- alerts ---------- */
.apm-alert {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 13px;
}
.apm-alert.error   { background: var(--bad-soft); border-color: #f4c5cd; color: #b3243f; }
.apm-alert.success { background: var(--ok-soft);  border-color: #bfe8d6; color: #087a54; }

/* ---------- stats ---------- */
.apm-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.apm-stat {
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
}
.apm-stat-top { display: flex; align-items: center; gap: 8px; }
.apm-dot { width: 9px; height: 9px; border-radius: 50%; }
.apm-stat-label { font-size: 12px; font-weight: 700; letter-spacing: .3px; color: var(--text-2); }
.apm-stat-val { margin-top: 12px; font-size: 30px; line-height: 1; font-weight: 800; letter-spacing: -1px; }

/* ---------- cards ---------- */
.apm-card {
  margin-bottom: 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.apm-ch {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line-soft);
}
.apm-ct { margin: 0; font-size: 15.5px; font-weight: 750; }
.apm-cs { margin-top: 3px; font-size: 12px; color: var(--muted); }
.apm-cb { padding: 20px; }

.apm-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10.5px; font-weight: 800; letter-spacing: .3px;
  white-space: nowrap;
}
.apm-pill.on   { background: var(--ok-soft);   color: var(--ok); }
.apm-pill.off  { background: var(--bad-soft);  color: var(--bad); }
.apm-pill.blue { background: var(--primary-soft); color: var(--primary); }

/* ---------- form ---------- */
.apm-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.apm-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.apm-field.full { grid-column: 1 / -1; }
.apm-field > label { font-size: 13px; font-weight: 600; color: var(--text-2); }

.apm-input, .apm-select, .apm-textarea {
  width: 100%; min-width: 0;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: #f8fafd;
  color: var(--text);
  font-size: 15px;
  outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.apm-input, .apm-select { height: 48px; }
.apm-select {
  -webkit-appearance: none; appearance: none;
  padding-right: 38px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%237a8699' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
}
.apm-textarea { min-height: 96px; padding: 12px 14px; resize: vertical; }
.apm-input::placeholder, .apm-textarea::placeholder { color: #9aa7bd; }
.apm-input:focus, .apm-select:focus, .apm-textarea:focus {
  border-color: #8dbbe8; background: #fff; box-shadow: 0 0 0 3px rgba(31,122,203,.12);
}
.apm-hint { font-size: 12px; line-height: 1.5; color: var(--muted); }

/* coin picker */
.apm-coins { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.apm-coin-opt {
  display: flex; align-items: center; gap: 10px;
  min-height: 52px;
  padding: 8px 12px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: #fbfcfe;
  color: var(--text-2);
  text-align: left;
  min-width: 0;
  transition: border-color .15s, background .15s, transform .1s;
}
.apm-coin-opt:hover { border-color: #b9d3ee; }
.apm-coin-opt:active { transform: scale(.97); }
.apm-coin-opt.on { border-color: var(--primary); background: var(--primary-soft); color: var(--text); }
.apm-coin-name { font-size: 13px; font-weight: 750; }

.apm-logo {
  width: 32px; height: 32px; flex: none;
  display: grid; place-items: center;
  border-radius: 50%;
  color: #fff; font-size: 14px; font-weight: 800;
}
.apm-logo.usdt { background: #26a17b; } .apm-logo.btc { background: #f7931a; }
.apm-logo.usdc { background: #2775ca; } .apm-logo.eth { background: #627eea; }
.apm-logo.doge { background: #c2a633; } .apm-logo.xrp { background: #303b4a; }
.apm-logo.sol { background: #6546c8; }  .apm-logo.pyusd { background: #2775ca; }
.apm-logo.default { background: #6b86a8; }

/* toggle switch */
.apm-switch {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f8fafd;
  cursor: pointer;
}
.apm-switch b { display: block; font-size: 14px; font-weight: 650; }
.apm-switch small { display: block; margin-top: 3px; font-size: 12px; color: var(--muted); }
.apm-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.apm-sw {
  width: 48px; height: 28px; flex: none;
  position: relative;
  border-radius: 14px;
  background: #cfd7e3;
  transition: background .2s;
}
.apm-sw::after {
  content: "";
  position: absolute; top: 3px; left: 3px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,.3);
  transition: transform .2s;
}
.apm-switch input:checked + .apm-sw { background: var(--ok); }
.apm-switch input:checked + .apm-sw::after { transform: translateX(20px); }
.apm-switch input:focus-visible + .apm-sw { box-shadow: 0 0 0 3px rgba(31,122,203,.25); }

.apm-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
.apm-actions .apm-btn { min-height: 46px; padding: 0 22px; font-size: 14px; }

/* ---------- list ---------- */
.apm-search-row { padding: 14px 20px 0; }
.apm-table-wrap { overflow-x: auto; margin-top: 14px; }
.apm-table { width: 100%; min-width: 860px; border-collapse: collapse; }
.apm-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px; font-weight: 700; letter-spacing: .4px;
  color: var(--muted);
  background: #f8fafd;
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
  white-space: nowrap;
}
.apm-table td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--line-soft);
  vertical-align: middle;
}
.apm-table tbody tr:last-child td { border-bottom: 0; }
.apm-table tbody tr:hover td { background: #fafbfe; }
.apm-method { display: flex; align-items: center; gap: 11px; min-width: 150px; }
.apm-mn { font-weight: 700; }
.apm-muted { margin-top: 3px; font-size: 11.5px; color: var(--muted); overflow-wrap: anywhere; }
.apm-addr { max-width: 230px; font-size: 12px; overflow-wrap: anywhere; }
.apm-acts { display: flex; gap: 6px; }

/* mobile cards */
.apm-list { display: none; }
.apm-item { padding: 16px; border-bottom: 1px solid var(--line-soft); }
.apm-item:last-child { border-bottom: 0; }
.apm-item-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.apm-item-top .apm-method { min-width: 0; }
.apm-kv { margin-top: 14px; display: grid; gap: 9px; }
.apm-kv div { display: flex; justify-content: space-between; gap: 14px; font-size: 13px; }
.apm-kv span { color: var(--muted); flex: none; }
.apm-kv b { font-weight: 650; text-align: right; overflow-wrap: anywhere; min-width: 0; }
.apm-item-acts { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.apm-item-acts .apm-btn { min-height: 46px; font-size: 14px; }

.apm-empty { padding: 40px 16px; text-align: center; color: var(--muted); font-size: 13.5px; }

/* ---------- tablet ---------- */
@media (max-width: 900px) {
  .apm-in { padding: 18px 16px calc(30px + env(safe-area-inset-bottom, 0px)); }
  .apm-coins { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* ---------- mobile ---------- */
@media (max-width: 760px) {
  .apm-table-wrap { display: none; }
  .apm-list { display: block; margin-top: 14px; border-top: 1px solid var(--line-soft); }

  .apm-title { font-size: 21px; }
  .apm-sub { font-size: 12px; }
  .apm-hbtns { width: 100%; }
  .apm-hbtns .apm-btn { flex: 1; }

  .apm-stats { gap: 8px; }
  .apm-stat { padding: 13px 12px; border-radius: 14px; }
  .apm-stat-label { font-size: 10.5px; }
  .apm-stat-val { margin-top: 9px; font-size: 24px; }

  .apm-ch { padding: 14px; }
  .apm-cb { padding: 14px; }
  .apm-search-row { padding: 12px 14px 0; }
}

@media (max-width: 560px) {
  .apm-in { padding: 14px 12px calc(28px + env(safe-area-inset-bottom, 0px)); }
  .apm-grid { grid-template-columns: 1fr; gap: 14px; }
  .apm-field.full { grid-column: auto; }
  .apm-actions { flex-direction: column-reverse; }
  .apm-actions .apm-btn { width: 100%; }
  .apm-input, .apm-select { font-size: 16px; } /* prevents iOS zoom on focus */
  .apm-textarea { font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .apm * { transition: none !important; }
}
`;

export default function Admin_PaymentMethod({ go } = {}) {
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api("/admin/payment-methods");
      setMethods(normalizeMethods(response).filter(isCryptoMethod));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const selectCoin = (coin) => {
    setForm((prev) => ({
      ...prev,
      coin,
      name: coin,
      currency: coin,
      network: NETWORKS[coin]?.[0] || "",
    }));
  };

  const editMethod = (item) => {
    if (!isCryptoMethod(item)) {
      setError("Only cryptocurrency payment methods can be edited here.");
      return;
    }

    const coin = String(item.coin || item.currency || "USDT").toUpperCase();
    setEditingId(item.id);
    setForm({
      ...EMPTY_FORM,
      method_type: "crypto",
      name: item.name || coin,
      coin,
      network: item.network || NETWORKS[coin]?.[0] || "",
      currency: coin,
      address: item.address || "",
      qr_image_url: item.qr_image_url || "",
      instructions: item.instructions || "",
      rate_bdt_per_coin: String(item.rate_bdt_per_coin ?? DEFAULT_BDT_RATE),
      min_amount: String(item.min_amount ?? "1"),
      max_amount: String(item.max_amount ?? "10000"),
      is_active: Boolean(item.is_active),
    });

    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (item) => {
    if (togglingId !== null) return;
    setTogglingId(item.id);
    setError("");
    setSuccess("");

    try {
      await api(`/admin/payment-methods/${item.id}`, {
        method: "PATCH",
        body: { is_active: !item.is_active },
      });
      setSuccess(
        item.is_active
          ? `${item.name} has been disabled.`
          : `${item.name} has been enabled.`
      );
      await loadMethods();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const validateForm = (payload) => {
    if (!payload.name) return "Display name is required.";
    if (!COINS.includes(payload.coin)) return "Please select a supported coin.";

    if (!NETWORKS[payload.coin]?.includes(payload.network)) {
      return "Please select a valid network for this coin.";
    }

    if (!payload.address) return "Crypto wallet address is required.";

    if (!Number.isFinite(payload.min_amount) || !Number.isFinite(payload.max_amount)) {
      return "Please enter valid deposit limits.";
    }
    if (payload.min_amount <= 0) return "Minimum amount must be greater than zero.";
    if (payload.max_amount < payload.min_amount) {
      return "Maximum amount cannot be lower than minimum amount.";
    }
    if (!Number.isFinite(payload.rate_bdt_per_coin) || payload.rate_bdt_per_coin <= 0) {
      return "Exchange rate must be greater than zero.";
    }
    return "";
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      method_type: "crypto",
      name: form.name.trim(),
      coin: form.coin,
      currency: form.coin,
      network: form.network,
      address: form.address.trim(),
      account_name: null,
      bank_name: null,
      branch: null,
      qr_image_url: form.qr_image_url.trim() || null,
      instructions: form.instructions.trim() || null,
      rate_bdt_per_coin: Number(form.rate_bdt_per_coin),
      min_amount: Number(form.min_amount),
      max_amount: Number(form.max_amount),
      is_active: Boolean(form.is_active),
    };

    const validationError = validateForm(payload);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      if (editingId !== null) {
        await api(`/admin/payment-methods/${editingId}`, {
          method: "PATCH",
          body: payload,
        });
        setSuccess("Crypto payment method updated successfully.");
      } else {
        await api("/admin/payment-methods", {
          method: "POST",
          body: payload,
        });
        setSuccess("Crypto payment method created successfully.");
      }

      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      await loadMethods();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return methods;
    return methods.filter((item) =>
      [
        item.name,
        item.coin,
        item.network,
        item.address,
        item.instructions,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [methods, search]);

  const stats = useMemo(() => ({
    total: methods.length,
    active: methods.filter((item) => item.is_active).length,
    disabled: methods.filter((item) => !item.is_active).length,
  }), [methods]);

  return (
    <div className="apm">
      <style>{CSS}</style>

      <div className="apm-in">

        {/* Header */}
        <header className="apm-head">
          <div className="apm-brand">
            <div className="apm-mark">₿</div>
            <div>
              <h1 className="apm-title">Crypto Payment Methods</h1>
              <div className="apm-sub">
                Configure wallet addresses, blockchain networks and deposit limits.
              </div>
            </div>
          </div>

          <div className="apm-hbtns">
            {go && (
              <button
                type="button"
                className="apm-btn"
                onClick={() => go("admin")}
              >
                ‹ Dashboard
              </button>
            )}
            <button
              type="button"
              className="apm-btn primary"
              onClick={loadMethods}
              disabled={loading}
            >
              ↻ {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="apm-stats">
          <div className="apm-stat">
            <div className="apm-stat-top">
              <i className="apm-dot" style={{ background: "#1f7acb" }} />
              <span className="apm-stat-label">TOTAL</span>
            </div>
            <div className="apm-stat-val">{stats.total}</div>
          </div>
          <div className="apm-stat">
            <div className="apm-stat-top">
              <i className="apm-dot" style={{ background: "#0e9f6e" }} />
              <span className="apm-stat-label">ACTIVE</span>
            </div>
            <div className="apm-stat-val">{stats.active}</div>
          </div>
          <div className="apm-stat">
            <div className="apm-stat-top">
              <i className="apm-dot" style={{ background: "#e0415f" }} />
              <span className="apm-stat-label">DISABLED</span>
            </div>
            <div className="apm-stat-val">{stats.disabled}</div>
          </div>
        </div>

        {/* Form */}
        <section className="apm-card">
          <div className="apm-ch">
            <div>
              <h2 className="apm-ct">
                {editingId !== null
                  ? `Edit Crypto Method #${editingId}`
                  : "Add Crypto Payment Method"}
              </h2>
              <div className="apm-cs">
                Set the receiving wallet and supported blockchain network.
              </div>
            </div>
            {editingId !== null && <span className="apm-pill blue">EDITING</span>}
          </div>

          <div className="apm-cb">
            {error && <div className="apm-alert error">{error}</div>}
            {success && <div className="apm-alert success">{success}</div>}

            <form onSubmit={submit}>
              <div className="apm-grid">
                <div className="apm-field full">
                  <label>Select Cryptocurrency</label>
                  <div className="apm-coins">
                    {COINS.map((coin) => {
                      const meta = coinMeta(coin);
                      return (
                        <button
                          type="button"
                          key={coin}
                          className={"apm-coin-opt" + (form.coin === coin ? " on" : "")}
                          onClick={() => selectCoin(coin)}
                        >
                          <span className={`apm-logo ${meta.className}`}>
                            {meta.symbol}
                          </span>
                          <span className="apm-coin-name">{coin}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="apm-field">
                  <label htmlFor="apm-name">Display Name</label>
                  <input
                    id="apm-name"
                    className="apm-input"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Example: USDT TRC20"
                    required
                  />
                </div>

                <div className="apm-field">
                  <label htmlFor="apm-net">Blockchain Network</label>
                  <select
                    id="apm-net"
                    className="apm-select"
                    value={form.network}
                    onChange={(e) => update("network", e.target.value)}
                    required
                  >
                    {(NETWORKS[form.coin] || []).map((network) => (
                      <option key={network} value={network}>{network}</option>
                    ))}
                  </select>
                </div>

                <div className="apm-field full">
                  <label htmlFor="apm-addr">Receiving Wallet Address</label>
                  <input
                    id="apm-addr"
                    className="apm-input"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder={`Enter your ${form.coin} ${form.network} wallet address`}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                  />
                  <small className="apm-hint">
                    Make sure the selected network matches the wallet address.
                    Sending through a different network may result in permanent loss of funds.
                  </small>
                </div>

                <div className="apm-field">
                  <label htmlFor="apm-min">Minimum Deposit ({form.coin})</label>
                  <input
                    id="apm-min"
                    className="apm-input"
                    type="number"
                    inputMode="decimal"
                    min="0.00000001"
                    step="any"
                    value={form.min_amount}
                    onChange={(e) => update("min_amount", e.target.value)}
                    required
                  />
                </div>

                <div className="apm-field">
                  <label htmlFor="apm-max">Maximum Deposit ({form.coin})</label>
                  <input
                    id="apm-max"
                    className="apm-input"
                    type="number"
                    inputMode="decimal"
                    min="0.00000001"
                    step="any"
                    value={form.max_amount}
                    onChange={(e) => update("max_amount", e.target.value)}
                    required
                  />
                </div>

                <div className="apm-field">
                  <label htmlFor="apm-rate">Exchange Rate (BDT per 1 {form.coin})</label>
                  <input
                    id="apm-rate"
                    className="apm-input"
                    type="number"
                    inputMode="decimal"
                    min="0.00000001"
                    step="any"
                    value={form.rate_bdt_per_coin}
                    onChange={(e) => update("rate_bdt_per_coin", e.target.value)}
                    required
                  />
                  <small className="apm-hint">
                    Enter the BDT value of one unit of {form.coin}.
                  </small>
                </div>

                <div className="apm-field">
                  <label htmlFor="apm-qr">QR Image URL (Optional)</label>
                  <input
                    id="apm-qr"
                    className="apm-input"
                    value={form.qr_image_url}
                    onChange={(e) => update("qr_image_url", e.target.value)}
                    placeholder="https://your-domain.com/crypto-qr.png"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                <div className="apm-field full">
                  <label htmlFor="apm-ins">Deposit Instructions (Optional)</label>
                  <textarea
                    id="apm-ins"
                    className="apm-textarea"
                    value={form.instructions}
                    onChange={(e) => update("instructions", e.target.value)}
                    placeholder={`Enter instructions for ${form.coin} deposits on ${form.network}...`}
                  />
                </div>

                <div className="apm-field full">
                  <label className="apm-switch">
                    <span>
                      <b>Enable this crypto payment method</b>
                      <small>Users can deposit using this method when enabled.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => update("is_active", e.target.checked)}
                    />
                    <span className="apm-sw" />
                  </label>
                </div>
              </div>

              <div className="apm-actions">
                <button className="apm-btn primary" type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Crypto Method"
                      : "Create Crypto Method"}
                </button>
                {editingId !== null && (
                  <button
                    className="apm-btn"
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* List */}
        <section className="apm-card">
          <div className="apm-ch">
            <div>
              <h2 className="apm-ct">Configured Crypto Wallets ({filtered.length})</h2>
              <div className="apm-cs">
                Only supported cryptocurrency payment methods are listed.
              </div>
            </div>
          </div>

          <div className="apm-search-row">
            <input
              className="apm-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coin, network or address..."
            />
          </div>

          {loading ? (
            <div className="apm-empty">Loading crypto payment methods...</div>
          ) : !filtered.length ? (
            <div className="apm-empty">No crypto payment methods found.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="apm-table-wrap">
                <table className="apm-table">
                  <thead>
                    <tr>
                      <th>CRYPTO ASSET</th>
                      <th>NETWORK</th>
                      <th>WALLET ADDRESS</th>
                      <th>DEPOSIT LIMIT</th>
                      <th>RATE</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const meta = coinMeta(item.coin);
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="apm-method">
                              <span className={`apm-logo ${meta.className}`}>
                                {meta.symbol}
                              </span>
                              <div>
                                <div className="apm-mn">{item.name}</div>
                                <div className="apm-muted">{item.coin}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="apm-pill blue">{item.network || "—"}</span>
                          </td>
                          <td>
                            <div className="apm-addr">{item.address || "—"}</div>
                          </td>
                          <td>
                            {money(item.min_amount)} – {money(item.max_amount)}
                            <div className="apm-muted">{item.coin}</div>
                          </td>
                          <td>
                            ৳{money(item.rate_bdt_per_coin)}
                            <div className="apm-muted">per {item.coin}</div>
                          </td>
                          <td>
                            <span className={`apm-pill ${item.is_active ? "on" : "off"}`}>
                              {item.is_active ? "ACTIVE" : "DISABLED"}
                            </span>
                          </td>
                          <td>
                            <div className="apm-acts">
                              <button
                                type="button"
                                className="apm-btn sm edit"
                                onClick={() => editMethod(item)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={
                                  "apm-btn sm " + (item.is_active ? "disable" : "enable")
                                }
                                onClick={() => toggleActive(item)}
                                disabled={togglingId !== null}
                              >
                                {togglingId === item.id
                                  ? "..."
                                  : item.is_active
                                    ? "Disable"
                                    : "Enable"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="apm-list">
                {filtered.map((item) => {
                  const meta = coinMeta(item.coin);
                  return (
                    <div className="apm-item" key={item.id}>
                      <div className="apm-item-top">
                        <div className="apm-method">
                          <span className={`apm-logo ${meta.className}`}>
                            {meta.symbol}
                          </span>
                          <div>
                            <div className="apm-mn">{item.name}</div>
                            <div className="apm-muted">{item.coin}</div>
                          </div>
                        </div>
                        <span className={`apm-pill ${item.is_active ? "on" : "off"}`}>
                          {item.is_active ? "ACTIVE" : "DISABLED"}
                        </span>
                      </div>

                      <div className="apm-kv">
                        <div>
                          <span>Network</span>
                          <b>{item.network || "—"}</b>
                        </div>
                        <div>
                          <span>Wallet</span>
                          <b>{item.address || "—"}</b>
                        </div>
                        <div>
                          <span>Limit</span>
                          <b>
                            {money(item.min_amount)} – {money(item.max_amount)} {item.coin}
                          </b>
                        </div>
                        <div>
                          <span>Rate</span>
                          <b>৳{money(item.rate_bdt_per_coin)} / {item.coin}</b>
                        </div>
                      </div>

                      <div className="apm-item-acts">
                        <button
                          type="button"
                          className="apm-btn edit"
                          onClick={() => editMethod(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={"apm-btn " + (item.is_active ? "disable" : "enable")}
                          onClick={() => toggleActive(item)}
                          disabled={togglingId !== null}
                        >
                          {togglingId === item.id
                            ? "..."
                            : item.is_active
                              ? "Disable"
                              : "Enable"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  );
}
