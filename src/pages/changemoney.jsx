import React, { useState, useEffect } from "react";
import { useT, api, COINS } from "./Home";
import { TopBar, Picker, useToast, SUB_CSS, num, goBack } from "./subpage";

/* =====================================================================
   src/pages/changemoney.jsx — Transfer (অ্যাকাউন্ট থেকে অ্যাকাউন্টে) পেজ   URL: /changemoney
   Props: W (wallet), go
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

const CSS = `
.cx-tr-top{display:grid;grid-template-columns:44px 1fr auto;align-items:stretch;padding:26px 20px 26px 16px;min-height:170px}
.cx-tr-tl{position:relative}
.cx-tr-tl .d{position:absolute;left:50%;top:8px;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:#00c087}
.cx-tr-tl .ln{position:absolute;left:50%;top:14px;bottom:20px;width:2px;margin-left:-1px;background:#00c087}
.cx-tr-tl .ck{position:absolute;left:50%;bottom:0;width:30px;height:30px;margin-left:-15px;border-radius:50%;background:#00c087;color:#fff;font-style:normal;font-size:17px;line-height:30px;text-align:center}
.cx-tr-tx{display:flex;flex-direction:column;justify-content:space-between;padding-inline-start:14px;min-width:0}
.cx-tr-tx .f{font-size:20px}
.cx-sp .cx-tr-tx .t{font-size:20px;color:#00c087;display:flex;align-items:center;padding:0}
.cx-tr-rt{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:10px}
.cx-sp .cx-tr-sw{width:68px;height:62px;border-radius:14px;background:#1a82d6;display:grid;place-items:center;padding:0}
.cx-sp .cx-tr-cn{font-size:32px;font-weight:700;color:inherit;display:flex;align-items:center;padding:0}
.cx-sp .cx-tr-cn .cx-sp-chev{width:12px;height:12px}
.cx-tr-form{margin-top:30px;padding:30px 28px 28px}
.cx-tr-form .cx-sp-lab{display:block;margin-bottom:4px}
.cx-tr-form .cx-sp-inp{padding-inline-start:46px;font-size:20px}
.cx-tr-form .cx-sp-inp input{font-size:19px}
.cx-tr-av{padding:24px 0 22px 28px;font-size:20px}
.cx-tr-form .cx-sp-btn{height:62px;border-radius:14px}
@media(max-width:380px){.cx-tr-tx .f,.cx-sp .cx-tr-tx .t{font-size:17px}.cx-sp .cx-tr-cn{font-size:26px}}
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
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 8H5M9 4L5 8l4 4" />
              <path d="M4 16h15M15 12l4 4-4 4" />
            </svg>
          </button>
          <button type="button" className="cx-tr-cn" onClick={() => setPk("coin")}>{coin}<i className="cx-sp-chev" /></button>
        </div>
      </div>

      {/* ---- quantity ---- */}
      <div className="w cx-tr-form" style={{ paddingInline: 0, paddingBottom: 0 }}>
        <div style={{ padding: "0 28px" }}>
          <span className="cx-sp-lab">{tt("trQty", "Transfer quantity")}</span>
          <div className="cx-sp-inp">
            <input type="number" inputMode="decimal" value={amt} placeholder={tt("trPh", "Please enter the transfer quantity")} onChange={(e) => setAmt(e.target.value)} />
            <span>{coin}</span><i />
            {/* All: backend-এর string মানই বসে, তাই রাউন্ডিং-এ ব্যালেন্সের বেশি হয় না */}
            <button type="button" onClick={() => setAmt(avail > 0 ? String(rawAvail) : "")}>{tt("all", "All")}</button>
          </div>
        </div>
        <div className="cx-tr-av">{tt("avail", "Available")} {avail.toFixed(8)} {coin}</div>
        <div style={{ padding: "0 28px 28px" }}>
          <button type="button" className="cx-sp-btn" disabled={busy} onClick={submit}>{tt("transfer", "Transfer")}</button>
        </div>
      </div>

      {toast}

      <Picker open={pk === "coin"} options={coinOpts} value={coin} onCancel={() => setPk("")} onConfirm={(v) => { setCoin(v); setAmt(""); setPk(""); }} />
      <Picker open={pk === "to"} options={ACCOUNTS} value={to} onCancel={() => setPk("")} onConfirm={pickTo} />
    </div>
  );
}
