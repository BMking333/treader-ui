import React, { useState, useEffect } from "react";
import { useT, api, COINS } from "./Home";
import { TopBar, Picker, useToast, SUB_CSS, num, goBack } from "./subpage";

/* =====================================================================
   src/pages/changemoney.jsx — Transfer (অ্যাকাউন্ট থেকে অ্যাকাউন্টে) পেজ   URL: /changemoney
   Props: W (wallet), go
   ডিজাইন: ছোট টেক্সট, প্রিমিয়াম কার্ড (exchange.jsx-এর সাথে মেলানো)
   ===================================================================== */

/* ====== backend অনুযায়ী বদলান ====== */
const TRANSFER_PATH = "/wallet/transfer";   /* POST {coin, from, to, amount} */
const ACCOUNTS_PATH = "/wallet/accounts";   /* GET -> { options: {COIN:{available}}, funds: {...} } */

const ACCOUNTS = [
  { value: "options", label: "Options account" },
  { value: "funds", label: "Funds account" },
];
const FIRST = ["USDT", "USDC", "ETH", "BTC"];
const TR_COINS = [...FIRST, ...COINS.filter((c) => !FIRST.includes(c))];
const coinOpts = TR_COINS.map((c) => ({ value: c, label: c }));
const accName = (v) => (ACCOUNTS.find((a) => a.value === v) || ACCOUNTS[0]).label;

/* SUB_CSS-এর বড় সাইজগুলো এখানে ছোট করে ওভাররাইড করা হয়েছে */
const CSS = `
.cx-sp{
  --x-ln:rgba(255,255,255,.08);--x-ln2:rgba(255,255,255,.14);--x-mu:rgba(210,222,240,.58);
  --x-card:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015));
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.cx-sp .cx-tr-top,.cx-sp .cx-tr-form{
  margin:14px 14px 0;border-radius:16px;border:1px solid var(--x-ln);background:var(--x-card);
  box-shadow:0 10px 28px -16px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.04);
}
.cx-sp .cx-tr-top{display:grid;grid-template-columns:30px 1fr auto;align-items:stretch;padding:18px 16px 18px 12px;min-height:0}
.cx-tr-tl{position:relative}
.cx-tr-tl .d{position:absolute;left:50%;top:7px;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#00c087}
.cx-tr-tl .ln{position:absolute;left:50%;top:13px;bottom:16px;width:2px;margin-left:-1px;border-radius:2px;
  background:linear-gradient(180deg,#00c087,rgba(0,192,135,.35))}
.cx-tr-tl .ck{position:absolute;left:50%;bottom:0;width:20px;height:20px;margin-left:-10px;border-radius:50%;background:#00c087;color:#fff;
  font-style:normal;font-size:11px;line-height:20px;text-align:center;box-shadow:0 4px 10px -4px rgba(0,192,135,.8)}
.cx-tr-tx{display:flex;flex-direction:column;justify-content:space-between;gap:22px;padding-inline-start:8px;min-width:0}
.cx-tr-tx .f{font-size:14px;font-weight:500}
.cx-sp .cx-tr-tx .t{font-size:14px;font-weight:500;color:#00c087;display:flex;align-items:center;gap:6px;padding:0;background:none;border:0;text-align:start}
.cx-sp .cx-tr-tx .t .cx-sp-chev{width:8px;height:8px}
.cx-tr-rt{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:16px}
.cx-sp .cx-tr-sw{
  width:44px;height:40px;border-radius:12px;border:0;padding:0;display:grid;place-items:center;
  background:linear-gradient(180deg,#2a95ee,#1a82d6);box-shadow:0 8px 16px -8px rgba(26,130,214,.9);
  transition:transform .3s cubic-bezier(.2,.8,.2,1),filter .15s ease;
}
.cx-sp .cx-tr-sw svg{width:22px;height:22px}
.cx-sp .cx-tr-sw:active{transform:rotate(180deg) scale(.94);filter:brightness(.94)}
.cx-sp .cx-tr-cn{
  font-size:16px;font-weight:600;letter-spacing:.2px;color:inherit;display:flex;align-items:center;gap:6px;
  padding:7px 11px;border-radius:10px;border:1px solid var(--x-ln);background:rgba(255,255,255,.03);
  transition:background .15s ease,transform .12s ease;
}
.cx-sp .cx-tr-cn:active{transform:scale(.96);background:rgba(255,255,255,.07)}
.cx-sp .cx-tr-cn .cx-sp-chev{width:8px;height:8px}

.cx-sp .cx-tr-form{margin-top:12px;padding:18px 16px 18px!important}
.cx-tr-form .cx-sp-lab{display:block;margin:0 0 8px;font-size:12.5px;font-weight:500;color:var(--x-mu)}
.cx-sp .cx-tr-form .cx-sp-inp{
  display:flex;align-items:center;gap:10px;height:48px;padding:0 12px;margin:0;
  border:1px solid var(--x-ln2);border-radius:12px;background:rgba(255,255,255,.025);
  transition:border-color .2s ease,box-shadow .2s ease;
}
.cx-sp .cx-tr-form .cx-sp-inp:focus-within{border-color:#1a82d6;box-shadow:0 0 0 3px rgba(26,130,214,.18)}
.cx-sp .cx-tr-form .cx-sp-inp input{
  flex:1;min-width:0;height:100%;padding:0;border:0;outline:0;background:transparent;color:inherit;
  font-size:14.5px;font-variant-numeric:tabular-nums;
}
.cx-sp .cx-tr-form .cx-sp-inp input::placeholder{color:var(--x-mu);opacity:.8;font-size:13px}
.cx-sp .cx-tr-form .cx-sp-inp span{font-size:13px;font-weight:600;white-space:nowrap}
.cx-sp .cx-tr-form .cx-sp-inp i{width:1px;height:16px;background:var(--x-ln2);flex:none}
.cx-sp .cx-tr-form .cx-sp-inp button{background:none;border:0;padding:4px 2px;font-size:13px;font-weight:600;color:#1a82d6;white-space:nowrap}
.cx-tr-av{padding:12px 2px 0;font-size:12.5px;color:var(--x-mu);font-variant-numeric:tabular-nums;letter-spacing:.1px}
.cx-sp .cx-tr-form .cx-sp-btn{
  margin-top:18px;width:100%;height:46px;border:0;border-radius:12px;color:#fff;font-size:15px;font-weight:600;letter-spacing:.3px;
  background:linear-gradient(180deg,#2a95ee,#1a82d6);box-shadow:0 8px 18px -10px rgba(26,130,214,.9);
  transition:transform .12s ease,filter .15s ease,opacity .2s ease;
}
.cx-sp .cx-tr-form .cx-sp-btn:active{transform:scale(.985);filter:brightness(.94)}
.cx-sp .cx-tr-form .cx-sp-btn:disabled{opacity:.45;box-shadow:none}
@media(max-width:380px){.cx-tr-tx .f,.cx-sp .cx-tr-tx .t{font-size:13px}.cx-sp .cx-tr-cn{font-size:14px}}
@media(prefers-reduced-motion:reduce){.cx-sp *{transition:none!important}}
`;

export default function ChangeMoney({ W, go }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  const [from, setFrom] = useState("options");
  const [to, setTo] = useState("funds");
  const [coin, setCoin] = useState("USDT");
  const [amt, setAmt] = useState("");
  const [pk, setPk] = useState(""); /* "", "to", "coin" */
  const [busy, setBusy] = useState(false);
  const [accs, setAccs] = useState({ options: {}, funds: {} });
  const [toast, flash] = useToast();

  /* ---- দুই account-এর ব্যালেন্স ---- */
  const loadAccs = async () => {
    try {
      const r = await api(ACCOUNTS_PATH);
      setAccs({ options: (r && r.options) || {}, funds: (r && r.funds) || {} });
    } catch (_) {}
  };

  useEffect(() => {
    if (!(W && W.guest)) loadAccs();
  }, []);

  const rawAvail = accs[from] && accs[from][coin] ? accs[from][coin].available : 0;
  const avail = num(rawAvail);

  const swap = () => { setFrom(to); setTo(from); setAmt(""); };

  const pickTo = (v) => {
    if (v === from) setFrom(to);
    setTo(v);
    setAmt("");
    setPk("");
  };

  const submit = async () => {
    if (busy) return;
    if (W && W.guest) return W.needLogin();
    const a = parseFloat(amt);
    if (!(a > 0)) return flash(tt("badAmt", "Please enter the transfer quantity"));
    if (a > avail) return flash(t("iB") !== "iB" ? t("iB") : "Insufficient balance");
    if (from === to) return flash(tt("sameAccount", "Choose two different accounts"));
    setBusy(true);
    try {
      await api(TRANSFER_PATH, {
        method: "POST",
        body: { coin, from, to, amount: amt }, /* string পাঠানো হচ্ছে, float precision সমস্যা এড়াতে */
      });
      flash(tt("trOk", "Transfer successful"), "ok");
      setAmt("");
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
      <TopBar title={tt("transfer", "Transfer")} onBack={() => goBack(go, "assets")} />

      {/* ---- from / to + coin ---- */}
      <div className="w cx-tr-top">
        <div className="cx-tr-tl"><i className="d" /><b className="ln" /><em className="ck">✓</em></div>
        <div className="cx-tr-tx">
          <div className="f">{tt("from", "From")} {accName(from)}</div>
          <button type="button" className="t" onClick={() => setPk("to")}>{tt("to", "To")} {accName(to)}<i className="cx-sp-chev" /></button>
        </div>
        <div className="cx-tr-rt">
          <button type="button" className="cx-tr-sw" onClick={swap} aria-label="swap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 8H5M9 4L5 8l4 4" />
              <path d="M4 16h15M15 12l4 4-4 4" />
            </svg>
          </button>
          <button type="button" className="cx-tr-cn" onClick={() => setPk("coin")}>{coin}<i className="cx-sp-chev" /></button>
        </div>
      </div>

      {/* ---- quantity ---- */}
      <div className="w cx-tr-form">
        <span className="cx-sp-lab">{tt("trQty", "Transfer quantity")}</span>
        <div className="cx-sp-inp">
          <input type="number" inputMode="decimal" value={amt} placeholder={tt("trPh", "Enter transfer quantity")} onChange={(e) => setAmt(e.target.value)} />
          <span>{coin}</span><i />
          {/* All: backend-এর string মানই বসে, তাই রাউন্ডিং-এ ব্যালেন্সের বেশি হয় না */}
          <button type="button" onClick={() => setAmt(avail > 0 ? String(rawAvail) : "")}>{tt("all", "All")}</button>
        </div>
        <div className="cx-tr-av">{tt("avail", "Available")} {avail.toFixed(8)} {coin}</div>
        <button type="button" className="cx-sp-btn" disabled={busy} onClick={submit}>{tt("transfer", "Transfer")}</button>
      </div>

      {toast}

      <Picker open={pk === "coin"} options={coinOpts} value={coin} onCancel={() => setPk("")} onConfirm={(v) => { setCoin(v); setAmt(""); setPk(""); }} />
      <Picker open={pk === "to"} options={ACCOUNTS} value={to} onCancel={() => setPk("")} onConfirm={pickTo} />
    </div>
  );
}
