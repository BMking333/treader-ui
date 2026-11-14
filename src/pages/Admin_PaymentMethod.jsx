
import React, { useCallback, useEffect, useState } from "react";
import { api } from "./Home";

const COINS = [
  "USDT", "BTC", "USDC", "ETH",
  "DOGE", "XRP", "SOL", "PYUSD",
];

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
  rate_bdt_per_coin: "122",
  min_amount: "1",
  max_amount: "10000",
  is_active: true,
};

function unwrap(res) {
  if (res?.data !== undefined) return res.data;
  if (res?.result !== undefined) return res.result;
  return res;
}

function money(value) {
  const n = Number(value || 0);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { maximumFractionDigits: 8 })
    : "0";
}

export default function Admin_PaymentMethod() {
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const isCrypto = form.method_type === "crypto";

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api("/admin/payment-methods");
      const data = unwrap(res);
      setMethods(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(err?.message || "Payment methods load failed.");
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
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const selectType = (type) => {
    if (type === "crypto") {
      setForm((prev) => ({
        ...prev,
        method_type: "crypto",
        coin: "USDT",
        name: "USDT",
        network: "TRC20",
        currency: "USDT",
        rate_bdt_per_coin: "1",
        address: "",
        bank_name: "",
        account_name: "",
        branch: "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        method_type: type,
        coin: "USDT",
        name:
          type === "bkash" ? "bKash" :
          type === "nagad" ? "Nagad" : "Bank Transfer",
        network: "",
        currency: "BDT",
        rate_bdt_per_coin: "122",
        address: "",
        bank_name: "",
        account_name: "",
        branch: "",
      }));
    }
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
    setEditingId(item.id);

    setForm({
      method_type: item.method_type || "crypto",
      name: item.name || "",
      coin: item.coin || "USDT",
      network: item.network || "",
      currency: item.currency || "BDT",
      address: item.address || "",
      account_name: item.account_name || "",
      bank_name: item.bank_name || "",
      branch: item.branch || "",
      qr_image_url: item.qr_image_url || "",
      instructions: item.instructions || "",
      rate_bdt_per_coin: String(item.rate_bdt_per_coin ?? "1"),
      min_amount: String(item.min_amount ?? "1"),
      max_amount: String(item.max_amount ?? "10000"),
      is_active: Boolean(item.is_active),
    });

    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      method_type: form.method_type,
      coin: form.coin,
      currency: isCrypto ? form.coin : "BDT",
      network: isCrypto ? form.network : null,
      rate_bdt_per_coin: Number(form.rate_bdt_per_coin),
      min_amount: Number(form.min_amount),
      max_amount: Number(form.max_amount),
      address: form.address.trim() || null,
      account_name: form.account_name.trim() || null,
      bank_name: form.bank_name.trim() || null,
      branch: form.branch.trim() || null,
      qr_image_url: form.qr_image_url.trim() || null,
      instructions: form.instructions.trim() || null,
    };

    if (!payload.name.trim()) {
      setError("Payment method name is required.");
      setSaving(false);
      return;
    }

    if (payload.min_amount <= 0 || payload.max_amount < payload.min_amount) {
      setError("Please enter a valid minimum and maximum amount.");
      setSaving(false);
      return;
    }

    if (payload.rate_bdt_per_coin <= 0) {
      setError("Exchange rate must be greater than zero.");
      setSaving(false);
      return;
    }

    if (isCrypto && (!payload.network || !payload.address)) {
      setError("Crypto network and wallet address are required.");
      setSaving(false);
      return;
    }

    if (!isCrypto && !payload.address && form.method_type !== "bank") {
      setError("Payment number is required.");
      setSaving(false);
      return;
    }

    if (form.method_type === "bank" && !payload.bank_name) {
      setError("Bank name is required.");
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        await api(`/admin/payment-methods/${editingId}`, {
          method: "PATCH",
          body: payload,
        });

        setSuccess("Payment method updated successfully.");
      } else {
        await api("/admin/payment-methods", {
          method: "POST",
          body: payload,
        });

        setSuccess("Payment method created successfully.");
      }

      resetForm();
      await loadMethods();
    } catch (err) {
      setError(err?.message || "Unable to save payment method.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = methods.filter((item) => {
    const text = [
      item.name,
      item.coin,
      item.network,
      item.method_type,
      item.address,
    ].join(" ").toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="apm">
      <style>{`
        .apm {
          --apm-bg: #0b1020;
          --apm-card: #121a2b;
          --apm-border: #26334a;
          --apm-text: #edf3ff;
          --apm-muted: #91a0b8;
          --apm-green: #16c784;
          --apm-red: #ea3943;
          color: var(--apm-text);
          background: var(--apm-bg);
          min-height: 100%;
          padding: 22px;
          font-family: Inter, Arial, sans-serif;
        }
        .apm * { box-sizing: border-box; }
        .apm-head {
          display:flex; justify-content:space-between;
          align-items:center; gap:12px; flex-wrap:wrap;
          margin-bottom:22px;
        }
        .apm-title { font-size:23px; font-weight:800; margin:0; }
        .apm-sub { color:var(--apm-muted); font-size:13px; margin-top:6px; }
        .apm-card {
          background:var(--apm-card);
          border:1px solid var(--apm-border);
          border-radius:14px;
          padding:20px;
          margin-bottom:18px;
        }
        .apm-card-title {
          font-size:16px; font-weight:750; margin:0 0 17px;
        }
        .apm-grid {
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:15px;
        }
        .apm-field { display:flex; flex-direction:column; gap:7px; }
        .apm-field.full { grid-column:1/-1; }
        .apm-field label {
          font-size:12px; color:var(--apm-muted); font-weight:650;
        }
        .apm-input, .apm-select, .apm-textarea {
          width:100%; min-width:0;
          background:#0c1424; color:var(--apm-text);
          border:1px solid var(--apm-border);
          border-radius:9px; padding:12px;
          outline:none; font-size:13px;
        }
        .apm-input:focus, .apm-select:focus, .apm-textarea:focus {
          border-color:#3478f6;
        }
        .apm-textarea { min-height:90px; resize:vertical; }
        .apm-type-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:17px; }
        .apm-type {
          padding:9px 15px; border-radius:9px;
          background:#0c1424; color:var(--apm-muted);
          border:1px solid var(--apm-border);
          cursor:pointer; font-weight:700; font-size:12px;
        }
        .apm-type.active {
          color:#fff; border-color:#397df6; background:#17366c;
        }
        .apm-actions { display:flex; gap:9px; flex-wrap:wrap; margin-top:18px; }
        .apm-btn {
          border:0; border-radius:9px; padding:11px 16px;
          cursor:pointer; font-weight:750; font-size:12px;
        }
        .apm-primary { background:#246bfd; color:#fff; }
        .apm-secondary { background:#253149; color:#fff; }
        .apm-btn:disabled { opacity:.55; cursor:not-allowed; }
        .apm-alert {
          padding:11px 13px; border-radius:9px; font-size:13px;
          margin-bottom:14px;
        }
        .apm-error { color:#ff9ba1; background:#3a1c28; }
        .apm-success { color:#6de5b1; background:#12372d; }
        .apm-toolbar {
          display:flex; align-items:center; justify-content:space-between;
          gap:12px; flex-wrap:wrap; margin-bottom:14px;
        }
        .apm-search { max-width:330px; }
        .apm-table-wrap { overflow-x:auto; }
        .apm-table { width:100%; border-collapse:collapse; min-width:750px; }
        .apm-table th {
          color:var(--apm-muted); font-size:11px;
          text-align:left; padding:12px;
          border-bottom:1px solid var(--apm-border);
        }
        .apm-table td {
          padding:13px 12px; font-size:12px;
          border-bottom:1px solid var(--apm-border);
          vertical-align:middle;
        }
        .apm-name { font-weight:750; }
        .apm-muted { color:var(--apm-muted); margin-top:4px; }
        .apm-pill {
          display:inline-block; padding:5px 9px;
          border-radius:30px; font-size:10px; font-weight:800;
          background:#24334c; color:#b7c8e4;
        }
        .apm-pill.on { color:#69e5ae; background:#12372d; }
        .apm-pill.off { color:#ff9ba1; background:#3a1c28; }
        .apm-edit {
          background:#203d70; color:#b8d2ff;
          border:0; border-radius:7px; padding:8px 11px;
          cursor:pointer; font-weight:700;
        }
        .apm-empty { text-align:center; padding:35px; color:var(--apm-muted); }
        .apm-check { display:flex; align-items:center; gap:9px; font-size:13px; }
        @media(max-width:650px) {
          .apm { padding:13px; }
          .apm-grid { grid-template-columns:1fr; }
          .apm-field.full { grid-column:auto; }
          .apm-card { padding:15px; }
          .apm-title { font-size:20px; }
        }
      `}</style>

      <div className="apm-head">
        <div>
          <h1 className="apm-title">Payment Methods</h1>
          <div className="apm-sub">
            Configure crypto, mobile banking and bank deposit methods
          </div>
        </div>
        <button className="apm-btn apm-secondary" onClick={loadMethods}>
          ↻ Refresh
        </button>
      </div>

      <section className="apm-card">
        <h2 className="apm-card-title">
          {editingId ? `Edit Payment Method #${editingId}` : "Add New Payment Method"}
        </h2>

        {error && <div className="apm-alert apm-error">{error}</div>}
        {success && <div className="apm-alert apm-success">{success}</div>}

        <form onSubmit={submit}>
          <div className="apm-type-row">
            {["crypto", "bkash", "nagad", "bank"].map((type) => (
              <button
                key={type}
                type="button"
                className={`apm-type ${form.method_type === type ? "active" : ""}`}
                onClick={() => selectType(type)}
              >
                {type === "crypto" ? "₿ Crypto" :
                  type === "bkash" ? "bKash" :
                  type === "nagad" ? "Nagad" : "Bank Transfer"}
              </button>
            ))}
          </div>

          <div className="apm-grid">
            {isCrypto && (
              <>
                <div className="apm-field">
                  <label>Coin</label>
                  <select
                    className="apm-select"
                    value={form.coin}
                    onChange={(e) => selectCoin(e.target.value)}
                  >
                    {COINS.map((coin) => (
                      <option key={coin} value={coin}>{coin}</option>
                    ))}
                  </select>
                </div>

                <div className="apm-field">
                  <label>Network</label>
                  <select
                    className="apm-select"
                    value={form.network}
                    onChange={(e) => update("network", e.target.value)}
                  >
                    {(NETWORKS[form.coin] || []).map((network) => (
                      <option key={network} value={network}>{network}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

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
              <label>{isCrypto ? "Wallet Address" : "Payment Number / Account"}</label>
              <input
                className="apm-input"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Enter payment address"
              />
            </div>

            {!isCrypto && (
              <>
                <div className="apm-field">
                  <label>Account Holder Name</label>
                  <input
                    className="apm-input"
                    value={form.account_name}
                    onChange={(e) => update("account_name", e.target.value)}
                    placeholder="Account name"
                  />
                </div>

                {form.method_type === "bank" && (
                  <>
                    <div className="apm-field">
                      <label>Bank Name</label>
                      <input
                        className="apm-input"
                        value={form.bank_name}
                        onChange={(e) => update("bank_name", e.target.value)}
                        placeholder="Bank name"
                      />
                    </div>

                    <div className="apm-field">
                      <label>Branch</label>
                      <input
                        className="apm-input"
                        value={form.branch}
                        onChange={(e) => update("branch", e.target.value)}
                        placeholder="Branch name"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="apm-field">
              <label>Minimum Deposit ({isCrypto ? form.coin : "BDT"})</label>
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
              <label>Maximum Deposit ({isCrypto ? form.coin : "BDT"})</label>
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
              <label>Rate (BDT per 1 {form.coin})</label>
              <input
                className="apm-input"
                type="number"
                min="0.00000001"
                step="any"
                value={form.rate_bdt_per_coin}
                onChange={(e) => update("rate_bdt_per_coin", e.target.value)}
                required
              />
              <small className="apm-muted">
                Used for BDT payment conversion. Crypto deposits are credited directly.
              </small>
            </div>

            <div className="apm-field">
              <label>QR Image URL</label>
              <input
                className="apm-input"
                value={form.qr_image_url}
                onChange={(e) => update("qr_image_url", e.target.value)}
                placeholder="https://your-domain.com/qr.png"
              />
            </div>

            <div className="apm-field full">
              <label>Payment Instructions</label>
              <textarea
                className="apm-textarea"
                value={form.instructions}
                onChange={(e) => update("instructions", e.target.value)}
                placeholder="Write payment instructions for users..."
              />
            </div>

            <div className="apm-field full">
              <label className="apm-check">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => update("is_active", e.target.checked)}
                />
                Enable this payment method
              </label>
            </div>
          </div>

          <div className="apm-actions">
            <button
              className="apm-btn apm-primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : editingId ? "Update Method" : "Create Method"}
            </button>

            {editingId && (
              <button
                className="apm-btn apm-secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="apm-card">
        <div className="apm-toolbar">
          <h2 className="apm-card-title" style={{ margin: 0 }}>
            Configured Methods ({filtered.length})
          </h2>
          <input
            className="apm-input apm-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment method..."
          />
        </div>

        {loading ? (
          <div className="apm-empty">Loading payment methods...</div>
        ) : (
          <div className="apm-table-wrap">
            <table className="apm-table">
              <thead>
                <tr>
                  <th>METHOD</th>
                  <th>TYPE / NETWORK</th>
                  <th>LIMIT</th>
                  <th>RATE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="apm-name">{item.name}</div>
                      <div className="apm-muted">
                        {item.coin} · {item.currency}
                      </div>
                    </td>
                    <td>
                      <div>{item.method_type}</div>
                      <div className="apm-muted">{item.network || "—"}</div>
                    </td>
                    <td>
                      {money(item.min_amount)} – {money(item.max_amount)}
                      <div className="apm-muted">{item.currency}</div>
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
                      <button
                        className="apm-edit"
                        onClick={() => editMethod(item)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {!filtered.length && (
                  <tr>
                    <td colSpan="6" className="apm-empty">
                      No payment methods found.
                    </td>
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
