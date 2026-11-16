import React, { useEffect, useState } from "react";
import { useT, api } from "./Home";
import { NETS } from "./depsoted";

/* =====================================================================
   src/pages/withdrew.jsx — Withdraw পেজ (ন্যাচারাল প্রিমিয়াম ডিজাইন, নীল রঙ নেই, হিস্ট্রি নেই)
   নোটিফিকেশন: স্ক্রিনের ঠিক মাঝখানে কার্ড-স্টাইল টোস্ট
   ===================================================================== */

const WFEE = { USDT: 1, USDC: 1, ETH: 0.002, BTC: 0.0002 };
const TOAST_MS = 2600;

const CSS = `
.wd{
  --w-card:#ffffff;--w-tx:#141b29;--w-mu:#8590a3;--w-ln:#e8ebf0;--w-bd:#c3cad6;--w-soft:#f4f6f9;
  --w-ink:#141b29;--w-inkx:#ffffff;--w-gr:#0a9f72;--w-rd:#d84d5a;
  --w-sh:0 10px 28px -18px rgba(20,27,41,.35);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;color:var(--w-tx);padding:0 14px 32px;
}
.cx.dark .wd{--w-card:#14233b;--w-tx:#eaf0f8;--w-mu:#8795ac;--w-ln:#22324f;--w-bd:#3d4f70;--w-soft:#0f1c31;--w-ink:#eaf0f8;--w-inkx:#0d1626;--w-sh:none}
.wd,.wd *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.wd button{font-family:inherit;cursor:pointer}

/* balance hero (ন্যাচারাল ডার্ক কার্ড) */
.wd-hero{position:relative;overflow:hidden;margin:12px 0;padding:20px 20px 18px;border-radius:18px;color:#fff;text-align:center;
  background:linear-gradient(135deg,#1d222c 0%,#2a303c 100%);box-shadow:0 14px 30px -18px rgba(0,0,0,.6)}
.wd-hero::after{content:"";position:absolute;right:-50px;top:-60px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.06)}
.wd-hero small{display:block;font-size:12px;opacity:.7;letter-spacing:.3px}
.wd-hero b{position:relative;z-index:1;display:block;margin-top:8px;font-size:24px;font-weight:700;letter-spacing:-.3px;font-variant-numeric:tabular-nums;word-break:break-all}
.wd-hero b em{font-style:normal;font-size:13px;font-weight:600;opacity:.8;margin-inline-start:6px}

/* cards */
.wd-card{margin-bottom:12px;padding:16px;border-radius:16px;background:var(--w-card);border:1px solid var(--w-ln);box-shadow:var(--w-sh)}
.wd-card h4{margin:0 0 10px;font-size:12.5px;font-weight:600;color:var(--w-mu);letter-spacing:.3px}
.wd-card h4:not(:first-child){margin-top:18px}

/* coin / network pills */
.wd-pills{display:flex;flex-wrap:wrap;gap:8px}
.wd .wd-pill{display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;
  min-width:68px;height:40px;padding:0 16px!important;border-radius:11px!important;
  border:1.5px solid var(--w-bd)!important;background:var(--w-card)!important;color:var(--w-tx)!important;
  font-size:13.5px;font-weight:600;line-height:1;transition:background .15s ease,border-color .15s ease,color .15s ease}
.wd .wd-pill:active{transform:scale(.97)}
.wd .wd-pill.on{background:var(--w-ink)!important;border-color:var(--w-ink)!important;color:var(--w-inkx)!important}

/* inputs */
.wd-in{display:flex;align-items:center;gap:8px;height:50px;padding:0 8px 0 14px;border-radius:12px;background:var(--w-soft);border:1.5px solid var(--w-bd);transition:border-color .2s,box-shadow .2s}
.wd-in:focus-within{border-color:var(--w-ink);box-shadow:none}
.wd .wd-in input{flex:1;min-width:0;height:100%;margin:0;padding:0;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;
  -webkit-appearance:none;appearance:none;background:transparent!important;color:var(--w-tx);caret-color:var(--w-tx);font-size:14.5px;font-weight:500;line-height:normal}
.wd .wd-in input:focus,.wd .wd-in input:focus-visible,.wd .wd-in input:active{border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important}
.wd .wd-in input::placeholder{color:var(--w-mu);font-weight:400}
.wd .wd-in input:-webkit-autofill{-webkit-box-shadow:0 0 0 40px var(--w-soft) inset!important;-webkit-text-fill-color:var(--w-tx)!important}
.wd-in b{display:flex;align-items:center;font-size:13px;font-weight:700;color:var(--w-tx);padding-inline-end:4px}
.wd .wd-in .all{display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;
  height:34px;padding:0 14px!important;border-radius:9px!important;border:1px solid var(--w-bd)!important;
  background:var(--w-card)!important;color:var(--w-tx)!important;font-size:12.5px;font-weight:700;line-height:1}
.wd .wd-in .all:active{background:var(--w-ink)!important;color:var(--w-inkx)!important}

/* summary rows */
.wd-sum{margin-bottom:12px;padding:6px 16px;border-radius:16px;background:var(--w-card);border:1px solid var(--w-ln);box-shadow:var(--w-sh)}
.wd-sum .r{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;font-size:13px;border-bottom:1px dashed var(--w-bd)}
.wd-sum .r:last-child{border-bottom:0}
.wd-sum .r span{color:var(--w-mu)}
.wd-sum .r b{font-weight:600;text-align:end;font-variant-numeric:tabular-nums;word-break:break-all}
.wd-sum .r.rv b{font-size:15px;font-weight:700;color:var(--w-gr)}

/* submit */
.wd .wd-go{display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;
  width:100%;height:52px;padding:0 20px!important;border:0!important;border-radius:14px!important;
  background:linear-gradient(135deg,#2a303c,#141b29)!important;color:#fff!important;font-size:15px;font-weight:600;letter-spacing:.3px;line-height:1;
  box-shadow:0 12px 24px -14px rgba(20,27,41,.8);transition:transform .12s ease,opacity .2s}
.cx.dark .wd .wd-go{background:linear-gradient(135deg,#f4f7fb,#cfd7e4)!important;color:#0d1626!important;box-shadow:0 12px 24px -14px rgba(0,0,0,.7)}
.wd .wd-go:active{transform:scale(.985)}
.wd .wd-go:disabled{opacity:.6}

/* ===== নোটিফিকেশন: স্ক্রিনের ঠিক মাঝখানে কার্ড ===== */
.wd-tov{position:fixed;inset:0;z-index:700;display:flex;align-items:center;justify-content:center;padding:0 28px;
  background:rgba(8,14,26,.28);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);animation:wdfade .18s ease}
.wd-toast{width:100%;max-width:300px;padding:24px 22px 22px;border-radius:20px;text-align:center;background:var(--w-card);color:var(--w-tx);
  border:1px solid var(--w-ln);box-shadow:0 28px 60px -22px rgba(0,0,0,.55);animation:wdpop .22s cubic-bezier(.2,.8,.2,1)}
.wd-toast i{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 14px;border-radius:50%;font-style:normal;font-size:26px;font-weight:700;line-height:1;color:#fff}
.wd-toast.ok i{background:linear-gradient(135deg,#22c493,#0a9f72);box-shadow:0 10px 20px -10px var(--w-gr)}
.wd-toast.bad i{background:linear-gradient(135deg,#ee6a75,#d84d5a);box-shadow:0 10px 20px -10px var(--w-rd)}
.wd-toast p{margin:0;font-size:14.5px;font-weight:600;line-height:1.45;word-break:break-word}
.wd-toast em{display:block;margin-top:14px;height:3px;border-radius:3px;background:var(--w-ln);overflow:hidden;font-style:normal}
.wd-toast em::after{content:"";display:block;height:100%;border-radius:3px;transform-origin:left;animation:wdbar ${TOAST_MS}ms linear forwards}
.wd-toast.ok em::after{background:var(--w-gr)}
.wd-toast.bad em::after{background:var(--w-rd)}
@keyframes wdpop{from{transform:scale(.9) translateY(6px);opacity:0}to{transform:none;opacity:1}}
@keyframes wdfade{from{opacity:0}to{opacity:1}}
@keyframes wdbar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@media(prefers-reduced-motion:reduce){.wd-tov,.wd-toast,.wd-toast em::after{animation:none!important}}
`;

/* coin / network বাছাইয়ের বাটন */
function Pills({ list, v, set }) {
  return (
    <div className="wd-pills">
      {list.map((x) => (
        <button key={x} type="button" className={"wd-pill" + (x === v ? " on" : "")} onClick={() => set(x)}>{x}</button>
      ))}
    </div>
  );
}

export default function Withdraw({ W, go }) {
  const t = useT();
  const [coin, setCoin] = useState("USDT"), [net, setNet] = useState("TRC20"), [addr, setAddr] = useState(""), [amt, setAmt] = useState(""), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false, n: 0 });
  const nl = NETS[coin], nn = nl.includes(net) ? net : nl[0];
  const pickCoin = (c) => { setCoin(c); setNet(NETS[c][0]); };
  const held = W.w[coin] || 0, fee = WFEE[coin], a = parseFloat(amt) || 0;

  /* টোস্ট দেখানো (একই মেসেজ আবার এলেও টাইমার নতুন করে চলে) */
  const flash = (k, ok = false) => setMsg({ k, ok, n: Date.now() });

  /* অটো বন্ধ */
  useEffect(() => {
    if (!msg.k) return undefined;
    const id = setTimeout(() => setMsg((m) => ({ ...m, k: "" })), TOAST_MS);
    return () => clearTimeout(id);
  }, [msg.n, msg.k]);

  const submit = async () => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    const ad = addr.trim();
    if (!ad) return flash("eAddr");
    if (!/^[A-Za-z0-9]{20,100}$/.test(ad)) return flash("bAddr");
    if (!(a > 0)) return flash("eAmt");
    if (a <= fee) return flash("feeLow");
    if (a > held) return flash("iB");
    setBusy(true);
    try {
      await api("/withdraw", { method: "POST", body: { coin, net: nn, address: ad, amount: a } });
      await W.reload();
      setAmt(""); setAddr(""); flash("wdOk", true);
    } catch (e) { flash(e.message, false); }
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
          <Pills list={Object.keys(NETS)} v={coin} set={pickCoin} />
          <h4>{t("net")}</h4>
          <Pills list={nl} v={nn} set={setNet} />
          <h4>{t("addr")}</h4>
          <div className="wd-in">
            <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder={t("addr")} autoComplete="off" />
          </div>
          <h4>{t("amount")}</h4>
          <div className="wd-in">
            <input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={t("amount")} inputMode="decimal" />
            <b>{coin}</b>
            <button type="button" className="all" onClick={() => setAmt(String(held))}>{t("all")}</button>
          </div>
        </div>

        <div className="wd-sum">
          <div className="r"><span>{t("avail")}</span><b>{held.toFixed(8)} {coin}</b></div>
          <div className="r"><span>{t("fee")}</span><b>{fee} {coin}</b></div>
          <div className="r rv"><span>{t("recv")}</span><b>{Math.max(0, a - fee).toFixed(8)} {coin}</b></div>
        </div>

        <button type="button" className="wd-go" disabled={busy} onClick={submit}>{t("submit")}</button>

        {/* ---- নোটিফিকেশন কার্ড (মাঝখানে) ---- */}
        {msg.k && (
          <div className="wd-tov" key={msg.n} onClick={() => setMsg((m) => ({ ...m, k: "" }))}>
            <div className={"wd-toast " + (msg.ok ? "ok" : "bad")} role="alert" onClick={(e) => e.stopPropagation()}>
              <i>{msg.ok ? "✓" : "!"}</i>
              <p>{t(msg.k)}</p>
              <em />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
