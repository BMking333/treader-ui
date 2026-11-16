import React, { useState, useEffect } from "react";
import { useT, api, COINS } from "./Home";
import { TopBar, SUB_CSS, num, goBack } from "./subpage";
import { XCSS, useToast, SheetPicker } from "./xui";


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
const coinOpts = EX_COINS.map((c) => ({ value: c, label: c, coin: true }));

const CSS = `
.cx-sp .cx-ex2-top,.cx-sp .cx-ex2-form{
  margin:14px 14px 0;border-radius:16px;border:1px solid var(--x-ln);background:var(--x-card);box-shadow:var(--x-sh);
}
.cx-sp .cx-ex2-top{padding:20px 18px 16px}
.cx-ex2-pair{display:flex;align-items:center;justify-content:space-between}
.cx-sp .cx-ex2-pair>button.c{
  font-size:19px;font-weight:700;letter-spacing:.2px;color:var(--x-tx);display:flex;align-items:center;gap:8px;
  padding:9px 13px;border-radius:12px;border:1px solid var(--x-ln2);background:var(--x-chip);
  transition:background .15s ease,transform .12s ease;
}
.cx-sp .cx-ex2-pair>button.c:active{transform:scale(.96)}
.cx-sp .cx-ex2-pair>button.c .cx-sp-chev{width:8px;height:8px}
.cx-sp .cx-ex2-logo{
  width:42px;height:42px;padding:0;display:grid;place-items:center;border:0;background:none;
  filter:drop-shadow(0 6px 12px rgba(26,130,214,.4));transition:transform .35s cubic-bezier(.2,.8,.2,1);
}
.cx-sp .cx-ex2-logo svg{width:42px;height:42px}
.cx-sp .cx-ex2-logo:active{transform:rotate(180deg) scale(.94)}
.cx-ex2-av{margin-top:16px;font-size:12.5px;color:var(--x-mu);font-variant-numeric:tabular-nums}
.cx-ex2-av b{color:var(--x-tx);font-weight:600}

.cx-sp .cx-ex2-form{padding:6px 16px 18px}
.cx-sp .cx-ex2-acc{
  display:flex;align-items:center;justify-content:space-between;width:100%;height:52px;padding:0;
  border:0;border-bottom:1px solid var(--x-ln);background:none;color:var(--x-tx);font-size:13.5px;
}
.cx-sp .cx-ex2-acc span{color:var(--x-mu)}
.cx-sp .cx-ex2-acc b{font-weight:600;display:flex;align-items:center;gap:8px}
.cx-sp .cx-ex2-acc .cx-sp-chev{width:8px;height:8px}
.cx-sp .cx-ex2-form .cx-sp-lab{display:block;margin:18px 0 8px;font-size:12.5px;font-weight:500;color:var(--x-mu)}
.cx-sp .cx-ex2-form .cx-sp-inp{
  display:flex;align-items:center;gap:10px;height:50px;padding:0 14px;margin:0;
  border:1px solid var(--x-ln2);border-radius:12px;background:var(--x-fld);
  transition:border-color .2s ease,box-shadow .2s ease;
}
.cx-sp .cx-ex2-form .cx-sp-inp:focus-within{border-color:var(--x-ac);box-shadow:0 0 0 3px rgba(26,130,214,.18)}
.cx-sp .cx-ex2-form .cx-sp-inp input{
  flex:1;min-width:0;height:100%;padding:0;border:0;outline:0;background:transparent;color:var(--x-tx);
  font-size:15px;font-weight:500;font-variant-numeric:tabular-nums;
}
.cx-sp .cx-ex2-form .cx-sp-inp input::placeholder{color:var(--x-mu);opacity:.9;font-size:13px;font-weight:400}
.cx-sp .cx-ex2-form .cx-sp-inp span{font-size:13px;font-weight:700;color:var(--x-tx);white-space:nowrap}
.cx-sp .cx-ex2-form .cx-sp-inp i{width:1px;height:16px;background:var(--x-ln2);flex:none}
.cx-sp .cx-ex2-form .cx-sp-inp button{background:none;border:0;padding:4px 2px;font-size:13px;font-weight:700;color:var(--x-ac);white-space:nowrap}
.cx-ex2-rcv{margin-top:16px;padding:14px;border-radius:12px;border:1px solid var(--x-rcvln);background:var(--x-rcv)}
.cx-ex2-rcv .r1{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--x-mu)}
.cx-ex2-rcv .r1 b{font-size:16px;font-weight:700;color:var(--x-up);word-break:break-all;text-align:end;padding-inline-start:12px;font-variant-numeric:tabular-nums}
.cx-ex2-rcv .r2{margin-top:6px;font-size:12px;color:var(--x-mu);font-variant-numeric:tabular-nums}
.cx-sp .cx-ex2-form .cx-sp-btn{
  margin-top:20px;width:100%;height:48px;border:0;border-radius:12px;color:#fff;font-size:15px;font-weight:700;letter-spacing:.3px;
  background:linear-gradient(180deg,#2a95ee,#1a82d6);box-shadow:0 10px 20px -10px rgba(26,130,214,.9);
  transition:transform .12s ease,filter .15s ease;
}
.cx-sp .cx-ex2-form .cx-sp-btn:active{transform:scale(.985);filter:brightness(.94)}
.cx-sp .cx-ex2-form .cx-sp-btn:disabled{background:var(--x-dis);color:var(--x-distx);box-shadow:none;opacity:1}
@media(max-width:380px){.cx-sp .cx-ex2-pair>button.c{font-size:16px}.cx-sp .cx-ex2-form{padding:4px 12px 14px}}
@media(prefers-reduced-motion:reduce){.cx-sp *{transition:none!important}}
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
      <style>{SUB_CSS + XCSS + CSS}</style>
      <TopBar title={tt("exchange", "Exchange")} onBack={() => goBack(go, "assets")} />

      {/* ---- from ⇄ to ---- */}
      <div className="w cx-ex2-top">
        <div className="cx-ex2-pair">
          <button type="button" className="c" onClick={() => setPk("from")}>{from}<i className="cx-sp-chev" /></button>
          <button type="button" className="cx-ex2-logo" onClick={swap} aria-label="swap">
            <svg width="42" height="42" viewBox="0 0 64 64">
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
        <div className="cx-ex2-av">{tt("avail", "Available")} <b>{avail.toFixed(8)} {from}</b></div>
      </div>

      {/* ---- form ---- */}
      <div className="w cx-ex2-form">
        <button type="button" className="cx-ex2-acc" onClick={() => setPk("acc")}>
          <span>{tt("account", "Account")}</span>
          <b>{accLabel}<i className="cx-sp-chev" /></b>
        </button>

        <span className="cx-sp-lab">{tt("qty", "Quantity")}</span>
        <div className="cx-sp-inp">
          <input type="number" inputMode="decimal" value={amt} placeholder={tt("exQtyPh", "Enter quantity")} onChange={(e) => setAmt(e.target.value)} />
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

      <SheetPicker open={pk === "from"} title={tt("from", "From")} options={coinOpts} value={from} onCancel={() => setPk("")} onConfirm={(v) => pickCoin("from", v)} />
      <SheetPicker open={pk === "to"} title={tt("to", "To")} options={coinOpts} value={to} onCancel={() => setPk("")} onConfirm={(v) => pickCoin("to", v)} />
      <SheetPicker open={pk === "acc"} title={tt("account", "Account")} options={ACCOUNTS} value={acc} onCancel={() => setPk("")} onConfirm={(v) => { setAcc(v); setAmt(""); setQuote(null); setPk(""); }} />
    </div>
  );
}
