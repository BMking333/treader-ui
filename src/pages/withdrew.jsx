import React, { useState } from "react";
import { useT, api } from "./Home";
import { NETS, Chips } from "./depsoted";

/* =====================================================================
   src/pages/withdrew.jsx — Withdraw পেজ (প্রিমিয়াম ডিজাইন, হিস্ট্রি সরানো)
   ===================================================================== */

const WFEE = { USDT: 1, USDC: 1, ETH: 0.002, BTC: 0.0002 };

const CSS = `
.wd{
  --w-card:#ffffff;--w-tx:#141b29;--w-mu:#8793a8;--w-ln:#e8ecf3;--w-ac:#1a82d6;--w-ac2:#4aa8ff;--w-rd:#d84d5a;--w-gr:#00a97a;--w-soft:#f1f5fb;
  --w-sh:0 10px 28px -18px rgba(20,40,80,.38);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;color:var(--w-tx);padding:0 14px 32px;
}
.cx.dark .wd{--w-card:#14233b;--w-tx:#eaf0f8;--w-mu:#8795ac;--w-ln:#22324f;--w-soft:#0f1c31;--w-sh:none}
.wd,.wd *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.wd button{font-family:inherit;cursor:pointer}

/* balance hero */
.wd-hero{position:relative;overflow:hidden;margin:12px 0;padding:18px 18px 16px;border-radius:18px;color:#fff;
  background:linear-gradient(135deg,#2a9bff 0%,#1a6fd0 55%,#1557a8 100%);box-shadow:0 14px 30px -16px rgba(26,111,208,.75)}
.wd-hero::after{content:"";position:absolute;right:-40px;top:-50px;width:170px;height:170px;border-radius:50%;background:rgba(255,255,255,.12)}
.wd-hero small{display:block;font-size:12px;opacity:.85}
.wd-hero b{position:relative;z-index:1;display:block;margin-top:6px;font-size:24px;font-weight:700;letter-spacing:-.3px;font-variant-numeric:tabular-nums;word-break:break-all}
.wd-hero b em{font-style:normal;font-size:13px;font-weight:600;opacity:.9;margin-inline-start:6px}

/* cards */
.wd-card{margin-bottom:12px;padding:14px 16px 16px;border-radius:16px;background:var(--w-card);border:1px solid var(--w-ln);box-shadow:var(--w-sh)}
.wd-card h4{margin:0 0 10px;font-size:12.5px;font-weight:600;color:var(--w-mu);letter-spacing:.2px}
.wd-card h4:not(:first-child){margin-top:16px}

/* inputs */
.wd-in{display:flex;align-items:center;gap:8px;height:48px;padding:0 12px 0 14px;border-radius:12px;background:var(--w-soft);border:1px solid var(--w-ln);transition:border-color .2s,box-shadow .2s}
.wd-in:focus-within{border-color:var(--w-ac);box-shadow:0 0 0 3px rgba(26,130,214,.14)}
.wd-in input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:var(--w-tx);font-size:14.5px;font-weight:500}
.wd-in input::placeholder{color:var(--w-mu);font-weight:400}
.wd-in b{font-size:13px;font-weight:700;color:var(--w-tx)}
.wd-in .all{padding:5px 12px;border:0;border-radius:20px;background:rgba(26,130,214,.12);color:var(--w-ac);font-size:12px;font-weight:600}
.wd-in .all:active{background:var(--w-ac);color:#fff}

/* summary rows */
.wd-sum{margin-bottom:12px;padding:6px 16px;border-radius:16px;background:var(--w-card);border:1px solid var(--w-ln);box-shadow:var(--w-sh)}
.wd-sum .r{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:11px 0;font-size:13px;border-bottom:1px dashed var(--w-ln)}
.wd-sum .r:last-child{border-bottom:0}
.wd-sum .r span{color:var(--w-mu)}
.wd-sum .r b{font-weight:600;text-align:end;font-variant-numeric:tabular-nums;word-break:break-all}
.wd-sum .r.rv b{font-size:15px;font-weight:700;color:var(--w-gr)}

/* message + submit */
.wd-msg{margin:0 0 12px;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.4;background:rgba(0,169,122,.12);color:var(--w-gr)}
.wd-msg.bad{background:rgba(216,77,90,.12);color:var(--w-rd)}
.wd-go{width:100%;height:50px;border:0;border-radius:14px;background:linear-gradient(135deg,var(--w-ac2),var(--w-ac));color:#fff;font-size:15px;font-weight:600;box-shadow:0 10px 22px -12px var(--w-ac);transition:transform .12s ease,opacity .2s}
.wd-go:active{transform:scale(.985)}
.wd-go:disabled{opacity:.6}
`;

export default function Withdraw({ W, go }) {
  const t = useT();
  const [coin, setCoin] = useState("USDT"), [net, setNet] = useState("TRC20"), [addr, setAddr] = useState(""), [amt, setAmt] = useState(""), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false });
  const nl = NETS[coin], nn = nl.includes(net) ? net : nl[0];
  const pickCoin = (c) => { setCoin(c); setNet(NETS[c][0]); };
  const held = W.w[coin] || 0, fee = WFEE[coin], a = parseFloat(amt) || 0;
  const submit = async () => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    const ad = addr.trim();
    if (!ad) return setMsg({ k: "eAddr", ok: false });
    if (!/^[A-Za-z0-9]{20,100}$/.test(ad)) return setMsg({ k: "bAddr", ok: false });
    if (!(a > 0)) return setMsg({ k: "eAmt", ok: false });
    if (a <= fee) return setMsg({ k: "feeLow", ok: false });
    if (a > held) return setMsg({ k: "iB", ok: false });
    setBusy(true);
    try {
      await api("/withdraw", { method: "POST", body: { coin, net: nn, address: ad, amount: a } });
      await W.reload();
      setAmt(""); setAddr(""); setMsg({ k: "wdOk", ok: true });
    } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  return (
    <>
      <style>{CSS}</style>
      <div className="cx-top"><button onClick={() => go("home")}>‹</button><h1>{t("wd")}</h1><span /></div>

      <div className="wd">
        <div className="wd-hero">
          <small>{t("avail")}</small>
          <b>{held.toFixed(8)}<em>{coin}</em></b>
        </div>

        <div className="wd-card">
          <h4>{t("coin")}</h4>
          <Chips list={Object.keys(NETS)} v={coin} set={pickCoin} />
          <h4>{t("net")}</h4>
          <Chips list={nl} v={nn} set={setNet} />
          <h4>{t("addr")}</h4>
          <div className="wd-in">
            <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder={t("addr")} autoComplete="off" />
          </div>
          <h4>{t("amount")}</h4>
          <div className="wd-in">
            <input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={t("amount")} inputMode="decimal" />
            <button type="button" className="all" onClick={() => setAmt(String(held))}>{t("all")}</button>
            <b>{coin}</b>
          </div>
        </div>

        <div className="wd-sum">
          <div className="r"><span>{t("avail")}</span><b>{held.toFixed(8)} {coin}</b></div>
          <div className="r"><span>{t("fee")}</span><b>{fee} {coin}</b></div>
          <div className="r rv"><span>{t("recv")}</span><b>{Math.max(0, a - fee).toFixed(8)} {coin}</b></div>
        </div>

        {msg.k && <p className={"wd-msg" + (msg.ok ? "" : " bad")}>{t(msg.k)}</p>}

        <button type="button" className="wd-go" disabled={busy} onClick={submit}>{t("submit")}</button>
      </div>
    </>
  );
}
