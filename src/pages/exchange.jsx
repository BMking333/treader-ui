import React, { useState, useEffect } from "react";
import { useT, api, COINS } from "./Home";
import { TopBar, Picker, useToast, SUB_CSS, num, goBack } from "./subpage";

/* =====================================================================
   src/pages/exchange.jsx — Exchange (কয়েন সোয়াপ) পেজ   URL: /exchangeb
   Props: W (wallet), go
   ===================================================================== */

/* ====== backend অনুযায়ী বদলান ====== */
const EXCHANGE_PATH = "/exchange/swap";   /* POST {from, to, amount, account} */
const QUOTE_PATH = "/exchange/quote";     /* GET ?from_coin=&to_coin=&amount= */
const ACCOUNTS_PATH = "/wallet/accounts"; /* GET -> { options: {...}, funds: {...} } */
const FEE_PCT = "0.1";                    /* backend EX_FEE-এর সাথে মিল রাখুন */

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
.cx-ex2-rcv{margin-top:26px;padding:18px 20px;border-radius:14px;background:rgba(26,130,214,.08)}
.cx-ex2-rcv .r1{display:flex;justify-content:space-between;align-items:center;font-size:18px}
.cx-ex2-rcv .r1 b{font-size:22px;color:#00c087;word-break:break-all;text-align:end;padding-inline-start:12px}
.cx-ex2-rcv .r2{margin-top:8px;font-size:15px;opacity:.7}
@media(max-width:380px){.cx-sp .cx-ex2-pair>button.c{font-size:26px}.cx-ex2-form{padding:26px 20px 30px}}
`;

const fmt = (v, d = 8) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(d) : "--";
};

export default function Exchange({ W, go }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  const [from, setFrom] = useState("USDT");
  const [to, setTo] = useState("BTC");
  const [acc, setAcc] = useState("options");
  const [amt, setAmt] = useState("");
  const [pk, setPk] = useState(""); /* "", "from", "to", "acc" */
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState(null); /* { receive, rate } */
  const [qBusy, setQBusy] = useState(false);
  const [accs, setAccs] = useState({ options: {}, funds: {} });
  const [toast, flash] = useToast();

  /* ---- নির্বাচিত account-এর ব্যালেন্স ---- */
  const loadAccs = async () => {
    try {
      const r = await api(ACCOUNTS_PATH);
      setAccs({ options: (r && r.options) || {}, funds: (r && r.funds) || {} });
    } catch (_) {}
  };

  useEffect(() => {
    if (!(W && W.guest)) loadAccs();
  }, []);

  const rawAvail = accs[acc] && accs[acc][from] ? accs[acc][from].available : 0;
  const avail = num(rawAvail);
  const accLabel = (ACCOUNTS.find((a) => a.value === acc) || ACCOUNTS[0]).label;

  /* ---- লাইভ quote (debounce 350ms, পুরনো response বাতিল) ---- */
  useEffect(() => {
    const a = parseFloat(amt);
    if (!(a > 0) || from === to) {
      setQuote(null);
      setQBusy(false);
      return;
    }
    let dead = false;
    setQBusy(true);
    const id = setTimeout(async () => {
      try {
        const q = await api(
          `${QUOTE_PATH}?from_coin=${encodeURIComponent(from)}&to_coin=${encodeURIComponent(to)}&amount=${encodeURIComponent(amt)}`
        );
        if (!dead) setQuote(q);
      } catch (_) {
        if (!dead) setQuote(null);
      } finally {
        if (!dead) setQBusy(false);
      }
    }, 350);
    return () => { dead = true; clearTimeout(id); };
  }, [amt, from, to]);

  const swap = () => { setFrom(to); setTo(from); setAmt(""); setQuote(null); };

  const pickCoin = (side, v) => {
    if (side === "from") {
      if (v === to) setTo(from);
      setFrom(v);
    } else {
      if (v === from) setFrom(to);
      setTo(v);
    }
    setAmt("");
    setQuote(null);
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
      await api(EXCHANGE_PATH, {
        method: "POST",
        body: { from, to, amount: amt, account: acc }, /* string পাঠানো হচ্ছে, float precision সমস্যা এড়াতে */
      });
      flash(tt("exOk", "Exchange successful"), "ok");
      setAmt("");
      setQuote(null);
      await loadAccs();
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
          <button type="button" onClick={() => setAmt(avail > 0 ? String(rawAvail) : "")}>{tt("all", "All")}</button>
        </div>

        {/* ---- You will receive ---- */}
        <div className="cx-ex2-rcv">
          <div className="r1">
            <span>{tt("receive", "You will receive")}</span>
            <b>{qBusy ? "..." : quote ? `${fmt(quote.receive)} ${to}` : `-- ${to}`}</b>
          </div>
          <div className="r2">
            {quote ? `1 ${from} ≈ ${fmt(quote.rate, 8)} ${to}` : tt("rateHint", "Enter quantity to see the rate")}
          </div>
          <div className="r2">{tt("feeLbl", "Fee")}: {FEE_PCT}%</div>
        </div>

        <button type="button" className="cx-sp-btn" disabled={busy || qBusy || !quote} onClick={submit}>{tt("exchange", "Exchange")}</button>
      </div>

      {toast}

      <Picker open={pk === "from"} options={coinOpts} value={from} onCancel={() => setPk("")} onConfirm={(v) => pickCoin("from", v)} />
      <Picker open={pk === "to"} options={coinOpts} value={to} onCancel={() => setPk("")} onConfirm={(v) => pickCoin("to", v)} />
      <Picker open={pk === "acc"} options={ACCOUNTS} value={acc} onCancel={() => setPk("")} onConfirm={(v) => { setAcc(v); setAmt(""); setQuote(null); setPk(""); }} />
    </div>
  );
}
