import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../Home";

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

export default function Admin_PaymentMethod() {
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
      <style>{`
        .apm {
          --bg:#080e19;--panel:#101a2a;--panel2:#0b1524;
          --line:rgba(148,163,184,.15);--text:#edf4ff;--muted:#91a3bc;
          min-height:100%;padding:clamp(14px,2.4vw,30px);color:var(--text);
          background:
            radial-gradient(ellipse at 8% 0%,rgba(37,99,235,.14),transparent 34%),
            radial-gradient(ellipse at 100% 12%,rgba(14,165,233,.07),transparent 28%),
            var(--bg);
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
        }
        .apm *{box-sizing:border-box}
        .apm-head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:24px}
        .apm-brand{display:flex;align-items:center;gap:14px}
        .apm-brand-icon{width:50px;height:50px;display:grid;place-items:center;border-radius:16px;
          color:#c5dcff;font-size:25px;font-weight:900;background:linear-gradient(145deg,#24528c,#142b4c);
          border:1px solid rgba(125,175,255,.3);box-shadow:0 10px 30px rgba(0,0,0,.22)}
        .apm-title{font-size:clamp(21px,2.3vw,28px);font-weight:850;letter-spacing:-.7px;margin:0}
        .apm-sub{font-size:12px;color:var(--muted);margin-top:6px}
        .apm-secure{display:flex;align-items:center;gap:7px;margin-top:9px;color:#68dfb0;font-size:10px;font-weight:850;letter-spacing:.8px;text-transform:uppercase}
        .apm-dot{width:7px;height:7px;border-radius:50%;background:#43d6a0;box-shadow:0 0 12px #43d6a0}
        .apm-card,.apm-stat{background:linear-gradient(145deg,rgba(17,29,47,.97),rgba(11,21,36,.98));
          border:1px solid var(--line);border-radius:17px;box-shadow:0 14px 36px rgba(0,0,0,.16)}
        .apm-card{padding:clamp(14px,2vw,21px);margin-bottom:17px}
        .apm-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:18px}
        .apm-card-title{font-size:15px;font-weight:800;margin:0}
        .apm-card-sub{font-size:11px;color:var(--muted);margin-top:5px}
        .apm-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:17px}
        .apm-stat{padding:16px 18px;position:relative;overflow:hidden}
        .apm-stat:after{content:"";position:absolute;width:85px;height:85px;right:-30px;top:-35px;border-radius:50%;background:rgba(96,165,250,.07)}
        .apm-stat-label{font-size:10px;color:var(--muted);font-weight:850;letter-spacing:.9px}
        .apm-stat-value{font-size:26px;font-weight:850;letter-spacing:-.7px;margin-top:8px}
        .apm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
        .apm-field{display:flex;flex-direction:column;gap:7px;min-width:0}
        .apm-field.full{grid-column:1/-1}
        .apm-field label{font-size:11px;color:#a8b7cc;font-weight:750}
        .apm-input,.apm-select,.apm-textarea{width:100%;min-width:0;background:#091321;color:var(--text);
          border:1px solid var(--line);border-radius:10px;padding:12px 13px;outline:none;font-size:12px;transition:.18s}
        .apm-input:focus,.apm-select:focus,.apm-textarea:focus{border-color:#528fe5;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
        .apm-textarea{min-height:92px;resize:vertical}
        .apm-hint{font-size:10px;color:var(--muted);line-height:1.5}
        .apm-coin-select{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
        .apm-coin-option{display:flex;align-items:center;gap:8px;padding:10px 9px;border-radius:11px;
          border:1px solid var(--line);background:#0a1422;color:#c5d2e5;cursor:pointer;min-width:0;transition:.18s}
        .apm-coin-option:hover{border-color:rgba(114,167,255,.45)}
        .apm-coin-option.active{background:rgba(37,99,235,.16);border-color:#4b8be5;color:#eff6ff;box-shadow:0 5px 15px rgba(37,99,235,.1)}
        .apm-coin-logo{width:27px;height:27px;flex:0 0 27px;display:grid;place-items:center;border-radius:50%;font-size:13px;font-weight:900;color:#fff}
        .apm-coin-logo.usdt{background:#26a17b}.apm-coin-logo.btc{background:#f7931a}.apm-coin-logo.usdc{background:#2775ca}
        .apm-coin-logo.eth{background:#627eea}.apm-coin-logo.doge{background:#c2a633}.apm-coin-logo.xrp{background:#303b4a}
        .apm-coin-logo.sol{background:#6546c8}.apm-coin-logo.pyusd{background:#2775ca}.apm-coin-logo.default{background:#42648c}
        .apm-coin-name{font-size:11px;font-weight:850;overflow:hidden;text-overflow:ellipsis}
        .apm-check{display:flex;align-items:center;gap:9px;font-size:12px;color:#c8d5e8}
        .apm-check input{accent-color:#4388ed;width:15px;height:15px}
        .apm-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:19px}
        .apm-btn{border:1px solid transparent;border-radius:10px;padding:10px 15px;cursor:pointer;font-size:11px;font-weight:850;transition:.18s}
        .apm-btn:disabled{opacity:.5;cursor:not-allowed}
        .apm-primary{background:linear-gradient(135deg,#347ff0,#2057b4);color:#fff;border-color:rgba(125,175,255,.25);box-shadow:0 7px 18px rgba(37,99,235,.17)}
        .apm-primary:hover{filter:brightness(1.1);transform:translateY(-1px)}
        .apm-secondary{background:#26364e;color:#e3edfc;border-color:var(--line)}
        .apm-alert{padding:12px 14px;border-radius:10px;font-size:12px;margin-bottom:14px;border:1px solid transparent}
        .apm-error{color:#ffabb4;background:rgba(244,63,94,.1);border-color:rgba(244,63,94,.2)}
        .apm-success{color:#7be8ba;background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.2)}
        .apm-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:15px}
        .apm-search{max-width:320px}
        .apm-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px}
        .apm-table{width:100%;min-width:790px;border-collapse:collapse;background:rgba(7,14,25,.3)}
        .apm-table th{text-align:left;color:var(--muted);font-size:9px;letter-spacing:.8px;font-weight:850;padding:13px 12px;background:#0b1524;border-bottom:1px solid var(--line);white-space:nowrap}
        .apm-table td{padding:13px 12px;font-size:11px;border-bottom:1px solid rgba(148,163,184,.09);vertical-align:middle}
        .apm-table tbody tr:hover{background:rgba(59,130,246,.05)}
        .apm-table tbody tr:last-child td{border-bottom:0}
        .apm-method{display:flex;align-items:center;gap:9px;min-width:145px}
        .apm-method-name{font-size:11px;font-weight:850;color:#e7f0ff}
        .apm-muted{color:var(--muted);font-size:10px;margin-top:4px;overflow-wrap:anywhere}
        .apm-pill{display:inline-flex;align-items:center;border-radius:30px;padding:6px 9px;font-size:9px;font-weight:850;letter-spacing:.4px}
        .apm-pill.on{color:#6ee5b4;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.2)}
        .apm-pill.off{color:#ff9eaa;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.2)}
        .apm-row-actions{display:flex;gap:6px;flex-wrap:wrap}
        .apm-edit,.apm-toggle{border:1px solid transparent;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:850;cursor:pointer}
        .apm-edit{background:rgba(59,130,246,.15);color:#b8d2ff;border-color:rgba(59,130,246,.2)}
        .apm-toggle.disable{background:rgba(244,63,94,.12);color:#ff9ba8;border-color:rgba(244,63,94,.2)}
        .apm-toggle.enable{background:rgba(16,185,129,.12);color:#69e5ae;border-color:rgba(16,185,129,.2)}
        .apm-toggle:disabled{opacity:.5;cursor:not-allowed}
        .apm-empty{text-align:center;padding:38px 18px;color:var(--muted);font-size:12px}
        @media(max-width:700px){.apm{padding:13px}.apm-stats{gap:8px}.apm-stat{padding:12px}.apm-stat-value{font-size:21px}.apm-coin-select{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:520px){.apm-grid{grid-template-columns:1fr}.apm-field.full{grid-column:auto}.apm-card{padding:14px}.apm-brand-icon{width:43px;height:43px;border-radius:13px}}
      `}</style>

      <header className="apm-head">
        <div className="apm-brand">
          <div className="apm-brand-icon">₿</div>
          <div>
            <h1 className="apm-title">Crypto Payment Methods</h1>
            <div className="apm-sub">Configure wallet addresses, blockchain networks and deposit limits.</div>
            <div className="apm-secure"><span className="apm-dot" /> Cryptocurrency payments only</div>
          </div>
        </div>
        <button
          type="button"
          className="apm-btn apm-secondary"
          onClick={loadMethods}
          disabled={loading}
        >
          ↻ &nbsp;{loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      <div className="apm-stats">
        <div className="apm-stat">
          <div className="apm-stat-label">TOTAL CRYPTO METHODS</div>
          <div className="apm-stat-value">{stats.total}</div>
        </div>
        <div className="apm-stat">
          <div className="apm-stat-label">ACTIVE</div>
          <div className="apm-stat-value">{stats.active}</div>
        </div>
        <div className="apm-stat">
          <div className="apm-stat-label">DISABLED</div>
          <div className="apm-stat-value">{stats.disabled}</div>
        </div>
      </div>

      <section className="apm-card">
        <div className="apm-card-head">
          <div>
            <h2 className="apm-card-title">
              {editingId !== null ? `Edit Crypto Method #${editingId}` : "Add Crypto Payment Method"}
            </h2>
            <div className="apm-card-sub">Set the receiving wallet and supported blockchain network.</div>
          </div>
          {editingId !== null && <span className="apm-pill on">EDITING</span>}
        </div>

        {error && <div className="apm-alert apm-error">{error}</div>}
        {success && <div className="apm-alert apm-success">{success}</div>}

        <form onSubmit={submit}>
          <div className="apm-grid">
            <div className="apm-field full">
              <label>Select Cryptocurrency</label>
              <div className="apm-coin-select">
                {COINS.map((coin) => {
                  const meta = coinMeta(coin);
                  return (
                    <button
                      type="button"
                      key={coin}
                      className={`apm-coin-option ${form.coin === coin ? "active" : ""}`}
                      onClick={() => selectCoin(coin)}
                    >
                      <span className={`apm-coin-logo ${meta.className}`}>{meta.symbol}</span>
                      <span className="apm-coin-name">{coin}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="apm-field">
              <label>Display Name</label>
              <input
                className="apm-input"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Example: USDT TRC20"
                required
              />
            </div>

            <div className="apm-field">
              <label>Blockchain Network</label>
              <select
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
              <label>Receiving Wallet Address</label>
              <input
                className="apm-input"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder={`Enter your ${form.coin} ${form.network} wallet address`}
                required
              />
              <small className="apm-hint">Make sure the selected network matches the wallet address. Sending through a different network may result in permanent loss of funds.</small>
            </div>

            <div className="apm-field">
              <label>Minimum Deposit ({form.coin})</label>
              <input
                className="apm-input"
                type="number"
                min="0.00000001"
                step="any"
                value={form.min_amount}
                onChange={(e) => update("min_amount", e.target.value)}
                required
              />
            </div>

            <div className="apm-field">
              <label>Maximum Deposit ({form.coin})</label>
              <input
                className="apm-input"
                type="number"
                min="0.00000001"
                step="any"
                value={form.max_amount}
                onChange={(e) => update("max_amount", e.target.value)}
                required
              />
            </div>

            <div className="apm-field">
              <label>Exchange Rate (BDT per 1 {form.coin})</label>
              <input
                className="apm-input"
                type="number"
                min="0.00000001"
                step="any"
                value={form.rate_bdt_per_coin}
                onChange={(e) => update("rate_bdt_per_coin", e.target.value)}
                required
              />
              <small className="apm-hint">Enter the BDT value of one unit of {form.coin}.</small>
            </div>

            <div className="apm-field">
              <label>QR Image URL (Optional)</label>
              <input
                className="apm-input"
                value={form.qr_image_url}
                onChange={(e) => update("qr_image_url", e.target.value)}
                placeholder="https://your-domain.com/crypto-qr.png"
              />
            </div>

            <div className="apm-field full">
              <label>Deposit Instructions (Optional)</label>
              <textarea
                className="apm-textarea"
                value={form.instructions}
                onChange={(e) => update("instructions", e.target.value)}
                placeholder={`Enter instructions for ${form.coin} deposits on ${form.network}...`}
              />
            </div>

            <div className="apm-field full">
              <label className="apm-check">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => update("is_active", e.target.checked)}
                />
                Enable this crypto payment method
              </label>
            </div>
          </div>

          <div className="apm-actions">
            <button className="apm-btn apm-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId !== null ? "Update Crypto Method" : "Create Crypto Method"}
            </button>
            {editingId !== null && (
              <button className="apm-btn apm-secondary" type="button" onClick={resetForm} disabled={saving}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="apm-card">
        <div className="apm-toolbar">
          <div>
            <h2 className="apm-card-title">Configured Crypto Wallets ({filtered.length})</h2>
            <div className="apm-card-sub">Only supported cryptocurrency payment methods are listed.</div>
          </div>
          <input
            className="apm-input apm-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coin, network or address..."
          />
        </div>

        {loading ? (
          <div className="apm-empty">Loading crypto payment methods...</div>
        ) : (
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
                          <span className={`apm-coin-logo ${meta.className}`}>{meta.symbol}</span>
                          <div>
                            <div className="apm-method-name">{item.name}</div>
                            <div className="apm-muted">{item.coin}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="apm-pill on">{item.network || "—"}</span></td>
                      <td>
                        <div style={{ maxWidth: 190, overflowWrap: "anywhere" }}>
                          {item.address || "—"}
                        </div>
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
                        <div className="apm-row-actions">
                          <button type="button" className="apm-edit" onClick={() => editMethod(item)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`apm-toggle ${item.is_active ? "disable" : "enable"}`}
                            onClick={() => toggleActive(item)}
                            disabled={togglingId !== null}
                          >
                            {togglingId === item.id ? "..." : item.is_active ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan="7" className="apm-empty">No crypto payment methods found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
