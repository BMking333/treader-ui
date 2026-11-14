import React, { useState } from "react";
import { useT, api, COINS } from "./Home";
import { TopBar, Picker, useToast, SUB_CSS, num, goBack } from "./subpage";

/* =====================================================================
   src/pages/exchange.jsx — Exchange (কয়েন সোয়াপ) পেজ   URL: /exchangeb
   Props: W (wallet), go
   ===================================================================== */

/* ====== backend অনুযায়ী বদলান ====== */
const EXCHANGE_PATH = "/exchange/swap"; /* POST {from, to, amount, account} */

const ACCOUNTS = [
  { value: "options", label: "Options account" },
  { value: "funds", label: "Funds account" },
];
const FIRST = ["USDT", "USDC", "ETH", "BTC"];
const EX_COINS = [...FIRST, ...COINS.filter((c) => !FIRST.includes(c))];
const coinOpts = EX_COINS.map((c) => ({ value: c, label: c }));

const CSS = `
.cx-ex2-top{margin-top:12px;padding:34px 28px 22px}
.cx-ex2-pair{display:flex;align-items:center;justify-content:space-between}
.cx-sp .cx-ex2-pair>button.c{font-size:34px;color:inherit;display:flex;align-items:center}
.cx-sp .cx-ex2-pair>button.c .cx-sp-chev{width:12px;height:12px}
.cx-sp .cx-ex2-logo{width:64px;height:64px;padding:0;display:grid;place-items:center}
.cx-ex2-av{margin-top:24px;font-size:20px}
.cx-ex2-form{margin-top:12px;padding:34px 36px 40px}
.cx-sp .cx-ex2-acc{display:flex;align-items:center;justify-content:space-between;width:100%;height:70px;border-bottom:1px solid #d7dbe3;font-size:20px;padding:0}
.cx-sp .cx-ex2-acc b{font-weight:400}
.cx-ex2-form .cx-sp-lab{display:block;margin:26px 0 4px;font-size:20px}
.cx-ex2-form .cx-sp-inp{padding-inline-start:44px}
.cx-ex2-form .cx-sp-btn{margin-top:46px}
@media(max-width:380px){.cx-sp .cx-ex2-pair>button.c{font-size:26px}.cx-ex2-form{padding:26px 20px 30px}}
`;

export default function Exchange({ W, go }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  const [from, setFrom] = useState("USDT");
  const [to, setTo] = useState("USDC");
  const [acc, setAcc] = useState("options");
  const [amt, setAmt] = useState("");
  const [pk, setPk] = useState(""); /* "", "from", "to", "acc" */
  const [busy, setBusy] = useState(false);
  const [toast, flash] = useToast();

  const avail = num(W && W.w && W.w[from]);
  const accLabel = (ACCOUNTS.find((a) => a.value === acc) || ACCOUNTS[0]).label;

  const swap = () => { setFrom(to); setTo(from); setAmt(""); };

  const pickCoin = (side, v) => {
    if (side === "from") {
      if (v === to) setTo(from);
      setFrom(v);
    } else {
      if (v === from) setFrom(to);
      setTo(v);
    }
    setAmt("");
    setPk("");
  };

  const submit = async () => {
    if (busy) return;
    if (W && W.guest) return W.needLogin();
    const a = parseFloat(amt);
    if (!(a > 0)) return flash(tt("badAmt", "Please enter a valid quantity"));
    if (a > avail) return flash(t("iB") !== "iB" ? t("iB") : "Insufficient balance");
    if (from === to) return flash(tt("sameCoin", "Choose two different coins"));
    setBusy(true);
    try {
      await api(EXCHANGE_PATH, { method: "POST", body: { from, to, amount: a, account: acc } });
      flash(tt("exOk", "Exchange successful"), "ok");
      setAmt("");
      if (W && W.reload) await W.reload();
    } catch (e) {
      flash(tt(e && e.message ? e.message : "err", (e && e.message) || "Failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cx-sp">
      <style>{SUB_CSS + CSS}</style>
      <TopBar title={tt("exchange", "Exchange")} onBack={() => goBack(go, "assets")} />

      {/* ---- from ⇄ to ---- */}
      <div className="w cx-ex2-top">
        <div className="cx-ex2-pair">
          <button type="button" className="c" onClick={() => setPk("from")}>{from}<i className="cx-sp-chev" /></button>
          <button type="button" className="cx-ex2-logo" onClick={swap} aria-label="swap">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <defs>
                <linearGradient id="cxsw" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#1de9f6" />
                  <stop offset="1" stopColor="#1a82d6" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="30" fill="url(#cxsw)" />
              <path d="M16 26h26l-6-6M48 38H22l6 6" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="c" onClick={() => setPk("to")}>{to}<i className="cx-sp-chev" /></button>
        </div>
        <div className="cx-ex2-av">{tt("avail", "Available")} {avail.toFixed(8)} {from}</div>
      </div>

      {/* ---- form ---- */}
      <div className="w cx-ex2-form">
        <button type="button" className="cx-ex2-acc" onClick={() => setPk("acc")}>
          <span>{tt("account", "Account")}</span>
          <b>{accLabel}<i className="cx-sp-chev" /></b>
        </button>

        <span className="cx-sp-lab">{tt("qty", "Quantity")}</span>
        <div className="cx-sp-inp">
          <input type="number" inputMode="decimal" value={amt} placeholder="0.00000000" onChange={(e) => setAmt(e.target.value)} />
          <span>{from}</span><i />
          <button type="button" onClick={() => setAmt(avail > 0 ? String(avail) : "")}>{tt("all", "All")}</button>
        </div>

        <button type="button" className="cx-sp-btn" disabled={busy} onClick={submit}>{tt("exchange", "Exchange")}</button>
      </div>

      {toast}

      <Picker open={pk === "from"} options={coinOpts} value={from} onCancel={() => setPk("")} onConfirm={(v) => pickCoin("from", v)} />
      <Picker open={pk === "to"} options={coinOpts} value={to} onCancel={() => setPk("")} onConfirm={(v) => pickCoin("to", v)} />
      <Picker open={pk === "acc"} options={ACCOUNTS} value={acc} onCancel={() => setPk("")} onConfirm={(v) => { setAcc(v); setPk(""); }} />
    </div>
  );
}

