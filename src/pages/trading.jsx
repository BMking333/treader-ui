import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BLUE, GREEN, RED, CUP, CDN, COINS, MARKETS, QTY, YIELD, ASSET_COINS,
  useT, fmt, fmtV, api, Ic, ICON, Coin, List, NftList,
} from "./Home";

/* =====================================================================
   src/pages/trading.jsx — Market, Exchange (spot), Chart, Options, Assets
   ডিজাইন: প্রিমিয়াম লুক
   ===================================================================== */

const DEFAULT_SECS = [30, 300, 600, 1800, 3600, 86400]; /* 30s, 5m, 10m, 30m, 1h, 1d */
const MIN_Q = 10, MAX_Q = 1000000; /* server থেকে না এলে ডিফল্ট */
const STABLE = ["USDT", "USDC", "PYUSD"];

/* ডিভাইস ভিউ: পিঞ্চ/ডাবল-ট্যাপ জুম বন্ধ (index.html এ meta দেওয়া থাকলেও এটা নিশ্চিত করে) */
(function lockZoom() {
  if (typeof document === "undefined") return;
  const content = "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
  let m = document.querySelector('meta[name="viewport"]');
  if (!m) { m = document.createElement("meta"); m.name = "viewport"; document.head.appendChild(m); }
  m.setAttribute("content", content);
  if (!document.getElementById("cx-nozoom")) {
    const s = document.createElement("style");
    s.id = "cx-nozoom";
    s.textContent = "html,body{touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%}";
    document.head.appendChild(s);
  }
  ["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
  );
})();

/* ---- কয়েন ড্রয়ার (৩ ডট/মেনু চাপলে): ছোট কয়েন + ছোট প্রাইস, প্রিমিয়াম লুক ---- */
const DR_CSS = `
.cxd-ov{position:fixed;inset:0;z-index:1000;background:rgba(8,14,26,.5);
  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:cxdf .18s ease}
.cxd{position:absolute;top:0;bottom:0;left:0;width:min(76%,290px);background:#fff;color:#1b2433;
  display:flex;flex-direction:column;box-shadow:12px 0 40px -18px rgba(0,0,0,.55);
  border-radius:0 18px 18px 0;animation:cxds .26s cubic-bezier(.2,.8,.2,1);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;padding-top:env(safe-area-inset-top,0px)}
.cxd-h{padding:22px 18px 12px}
.cxd-h h2{margin:0;font-size:18px;font-weight:700;letter-spacing:-.2px;line-height:1.2}
.cxd-h span{display:inline-flex;align-items:center;margin-top:10px;padding:4px 12px;border-radius:999px;
  background:rgba(26,130,214,.1);color:#1a82d6;font-size:12.5px;font-weight:600;letter-spacing:.3px}
.cxd-l{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:2px 12px max(16px,env(safe-area-inset-bottom))}
.cxd-l button{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:50px;padding:0 6px;
  background:none;border:0;border-bottom:1px solid #edf0f4;color:inherit;font-family:inherit;cursor:pointer;
  transition:background .15s ease;-webkit-tap-highlight-color:transparent}
.cxd-l button:last-child{border-bottom:0}
.cxd-l button:active{background:#f3f6fa;border-radius:10px}
.cxd-n{display:flex;align-items:center;gap:9px;min-width:0}
.cxd-n b{font-size:13.5px;font-weight:600;white-space:nowrap}
.cxd-n b small{font-size:10.5px;font-weight:500;color:#9aa4b4;margin-left:1px}
.cxd-p{font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.cx.dark .cxd{background:#101e34;color:#e9eef6;box-shadow:12px 0 40px -18px rgba(0,0,0,.9)}
.cx.dark .cxd-l button{border-bottom-color:#1f2f4a}
.cx.dark .cxd-l button:active{background:#0b1626}
.cx.dark .cxd-n b small{color:#8a97ad}
@keyframes cxdf{from{opacity:0}to{opacity:1}}
@keyframes cxds{from{transform:translateX(-30px);opacity:.6}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.cxd-ov,.cxd{animation:none!important}}
`;

function CoinDrawer({ P, onPick, onClose }) {
  const t = useT();
  return (
    <div className="cxd-ov" onClick={onClose}>
      <style>{DR_CSS}</style>
      <div className="cxd" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="cxd-h">
          <h2>{t("spot")}</h2>
          <span>USDT</span>
        </div>
        <div className="cxd-l">
          {COINS.map((s) => (
            <button key={s} type="button" onClick={() => onPick(s)}>
              <span className="cxd-n"><Coin s={s} size={24} /><b>{s}<small>/USDT</small></b></span>
              <span className="cxd-p" style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{fmt(P[s].price)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Market ---- */
/* প্রতিটি ট্যাবে (USDT/TRX/BTC/ETH/USDD/USDC) সব কয়েনের দাম ওই মার্কেটের হিসাবে দেখায়।
   NFT ট্যাব (উপরের মার্কেট ট্যাব বা নিচের All/NFT) চাপলে NFT কালেকশনের ডাটা দেখায় */
export function Market({ P, go }) {
  const t = useT();
  const [m, setM] = useState("USDT"), [sub, setSub] = useState("All");
  const showNft = m === "NFT" || sub === "NFT";
  return (
    <div className="hm">
      <div className="cx-top"><button onClick={() => go("home")}>‹</button><h1>{t("market")}</h1><span /></div>
      <div className="cx-tabs">{MARKETS.map((x) => <button key={x} className={m === x ? "on" : ""} onClick={() => setM(x)}>{x}</button>)}</div>
      <div className="cx-tabs two">{["All", "NFT"].map((x) => <button key={x} className={sub === x ? "on" : ""} onClick={() => setSub(x)}>{x === "All" ? t("all") : x}</button>)}</div>
      {showNft ? <NftList P={P} /> : <List P={P} go={go} names quote={m} />}
    </div>
  );
}

/* ---- Exchange (spot) styles: প্রিমিয়াম, স্মুথ (লেখা একটু বড়) ---- */
const EX_CSS = `
.cx2{
  --bg:#ffffff;--bg2:#f4f6f9;--tx:#1b2433;--mu:#9aa4b4;--ln:#e6e9ef;--fld:#d8dde6;--fh:#eef1f5;
  --up:#00c087;--dn:#e0485c;--bl:#1a82d6;--sheet:#ffffff;--dim:rgba(10,18,32,.45);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
  text-rendering:optimizeLegibility;font-kerning:normal;
  color:var(--tx);background:var(--bg);
}
.cx.dark .cx2{
  --bg:#11203a;--bg2:#0a1424;--tx:#e9eef6;--mu:#8a97ad;--ln:#1f2f4a;--fld:#24364f;--fh:#0b1626;
  --sheet:#101e34;--dim:rgba(2,6,12,.72);
  background:var(--bg);
}
.cx2 *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.cx2 button{font-family:inherit;-webkit-font-smoothing:antialiased;cursor:pointer}
.cx2 input{font-family:inherit;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
.cx2 .num{font-variant-numeric:tabular-nums;letter-spacing:.1px}

.cx2-main{display:grid;grid-template-columns:47% 1fr;gap:10px;padding:10px 10px 14px;border-top:1px solid var(--ln)}

/* order book */
.cx2-book{min-width:0;display:flex;flex-direction:column}
.cx2-bh{display:flex;justify-content:space-between;font-size:12px;color:var(--mu);padding:2px 2px 6px;font-weight:500}
.cx2-row{position:relative;display:flex;justify-content:space-between;align-items:center;height:30px;padding:0 2px;font-size:12px;cursor:pointer;
  transition:background .15s ease}
.cx2-row:active{background:var(--fh)}
.cx2-row b{font-weight:500;position:relative;z-index:1}
.cx2-row span{color:var(--mu);position:relative;z-index:1}
.cx2-row i{position:absolute;right:0;top:3px;bottom:3px;opacity:.1;border-radius:2px;transition:width .35s ease}
.cx2-mid{padding:10px 2px 8px;line-height:1.15}
.cx2-mid b{display:block;font-size:18px;font-weight:600;letter-spacing:-.2px;white-space:nowrap}
.cx2-mid small{display:block;margin-top:3px;font-size:12px;color:var(--mu)}
.cx2-bv{display:flex;gap:6px;margin-top:10px}
.cx2-bv button{background:none;border:1px solid transparent;border-radius:4px;padding:2px;line-height:0;transition:border-color .15s ease}
.cx2-bv button.on{border-color:var(--bl)}
.cx2-bv svg{width:22px;height:20px}

/* order form */
.cx2-form{min-width:0;display:flex;flex-direction:column}
.cx2-bs{position:relative;height:42px;border-radius:8px;overflow:hidden;background:var(--fh)}
.cx2-bs button{position:absolute;top:0;bottom:0;margin:0;border:0;background:var(--fh);color:var(--tx);font-size:14.5px;font-weight:600;line-height:1;
  display:flex;align-items:center;justify-content:center;text-align:center;transition:background .2s ease,color .2s ease}
.cx2-bs .bb{left:0;width:calc(50% + 7px);padding:0 7px 0 0;clip-path:polygon(0 0,100% 0,calc(100% - 12px) 100%,0 100%)}
.cx2-bs .sb{left:calc(50% - 7px);width:calc(50% + 7px);padding:0 0 0 7px;clip-path:polygon(12px 0,100% 0,100% 100%,0 100%)}
.cx2-bs .bb.on{background:var(--up);color:#fff}
.cx2-bs .sb.on{background:var(--dn);color:#fff}
.cx2-sel{display:flex;justify-content:space-between;align-items:center;height:40px;padding:0 4px 0 4px;font-size:14px;font-weight:500}
.cx2-sel svg{opacity:.7;width:18px;height:18px}
.cx2-fld{display:flex;align-items:center;gap:6px;border:1px solid var(--ln);border-radius:8px;padding:0 10px;height:48px;
  background:transparent;transition:border-color .2s ease,box-shadow .2s ease}
.cx2-fld:focus-within{border-color:rgba(26,130,214,.5);background:var(--fh)}
.cx2 .cx2-fld input,.cx2 .cx2-fld input:focus,.cx2 .cx2-fld input:focus-visible,.cx2 .cx2-fld input:active{
  flex:1;min-width:0;border:0!important;background:transparent!important;color:var(--tx);
  font-size:14.5px;height:30px;outline:none!important;box-shadow:none!important;
  -webkit-appearance:none;appearance:none;padding:0;border-radius:0;caret-color:var(--bl)}
.cx2-fld input::placeholder{color:var(--mu);opacity:1;font-size:13.5px}
.cx2-fld>b{font-size:13.5px;font-weight:600}
.cx2-fld button.pm{width:30px;height:30px;flex:none;background:var(--fh);border:0;border-radius:6px;color:var(--tx);
  font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;transition:transform .12s ease,background .15s ease}
.cx2-fld button.pm:active{transform:scale(.92)}
.cx2-est{font-size:12px;color:var(--mu);margin:6px 0 10px;min-height:14px}
.cx2-av{margin:8px 0 8px;font-size:12px;color:var(--mu)}
.cx2-av div{display:flex;justify-content:space-between;align-items:center;gap:6px;line-height:1.85;white-space:nowrap}
.cx2-av b{font-weight:600;color:var(--tx);font-variant-numeric:tabular-nums}
.cx2-pc{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:0 0 12px}
.cx2-pc button{height:30px;width:100%;padding:0;margin:0;background:var(--fh);border:0;border-radius:6px;color:var(--tx);
  font-size:12.5px;font-weight:600;line-height:1;
  display:flex;align-items:center;justify-content:center;text-align:center;
  transition:transform .12s ease,background .15s ease}
.cx2-pc button:active{transform:scale(.95)}
.cx2-msg{font-size:12.5px;margin:8px 0 0;color:var(--dn);line-height:1.4}
.cx2-msg.ok{color:var(--up)}
.cx2-cta{display:flex;align-items:center;justify-content:center;text-align:center;width:100%;padding:0;line-height:1;white-space:nowrap;
  margin-top:16px;height:44px;border:0;border-radius:10px;color:#fff;font-size:15px;font-weight:600;letter-spacing:.3px;
  box-shadow:0 8px 18px -10px rgba(0,0,0,.55);transition:transform .12s ease,filter .15s ease,opacity .2s ease}
.cx2-cta:active{transform:scale(.985);filter:brightness(.94)}

/* entrust */
.cx2-gap{height:10px;background:var(--bg2)}
.cx2-eh{display:flex;justify-content:space-between;align-items:center;padding:14px 14px 12px;border-bottom:1px solid var(--ln)}
.cx2-eh h2{margin:0;font-size:17px;font-weight:600;display:flex;align-items:baseline;gap:8px}
.cx2-eh h2 button{background:none;border:0;color:var(--bl);font-size:14px;font-weight:500;padding:0;display:flex;align-items:center;gap:3px}
.cx2-eh h2 button svg{width:15px;height:15px}
.cx2-eh>button{background:none;border:0;color:var(--tx);font-size:14px;display:flex;align-items:center;gap:4px;padding:0;
  opacity:.9}
.cx2-eh>button svg{width:17px;height:17px}
.cx2-eh>button.on{color:var(--bl)}
.cx2-list{min-height:130px;background:var(--bg)}
.cx2-tx{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--ln);font-size:13.5px}
.cx2-tx span:first-child{display:flex;flex-direction:column;gap:3px;min-width:0}
.cx2-tx small{font-size:12px;color:var(--mu)}
.cx2-tx>span:last-child{font-weight:600;white-space:nowrap}
.cx2-empty{height:130px;display:flex;align-items:center;justify-content:center;color:var(--mu);font-size:13.5px}

/* picker sheet */
.cx2-ov{position:fixed;inset:0;z-index:1000;background:var(--dim);display:flex;align-items:flex-end;animation:cx2f .18s ease}
.cx2-pk{width:100%;min-height:34vh;background:var(--sheet);color:var(--tx);border-radius:18px 18px 0 0;display:flex;flex-direction:column;
  box-shadow:0 -12px 40px -16px rgba(0,0,0,.5);
  animation:cx2u .26s cubic-bezier(.2,.8,.2,1);padding-bottom:max(8px,env(safe-area-inset-bottom))}
.cx2-pkh{display:flex;justify-content:space-between;padding:14px 18px}
.cx2-pkh button{background:none;border:0;font-size:15px;color:var(--mu);padding:0}
.cx2-pkh button.ok{color:var(--bl);font-weight:600}
.cx2-pkb{margin:auto 18px 10px;display:flex;flex-direction:column}
.cx2-pkb button{height:48px;background:none;border:0;border-top:1px solid var(--ln);color:var(--mu);font-size:16px;font-weight:500;
  transition:color .15s ease}
.cx2-pkb button.on{color:var(--tx);font-weight:600}
@keyframes cx2f{from{opacity:0}to{opacity:1}}
@keyframes cx2u{from{transform:translateY(40px);opacity:.6}to{transform:none;opacity:1}}
@media(max-width:380px){
  .cx2-row{font-size:11.5px;height:28px}.cx2-mid b{font-size:16px}
  .cx2-fld{height:44px}.cx2-bs{height:38px}.cx2-cta{height:42px}
}
@media(prefers-reduced-motion:reduce){.cx2 *,.cx2-ov,.cx2-pk{animation:none!important;transition:none!important}}
`;

/* অর্ডার বুকের ভিউ আইকন */
const BvIc = ({ k }) => {
  const R = "#e0485c", G = "#00c087";
  const lines = (c, y0) => [0, 1, 2].map((i) => <rect key={c + i} x="2" y={y0 + i * 4} width="22" height="2.4" rx="1" fill={c} />);
  return (
    <svg width="28" height="26" viewBox="0 0 28 26" fill="none">
      {k === "all" && <>{lines(R, 2)}{lines(G, 14)}</>}
      {k === "b" && <>{[0, 1, 2, 3, 4].map((i) => <rect key={i} x="2" y={2 + i * 4.6} width="22" height="2.4" rx="1" fill={G} opacity={i % 2 ? 1 : 0.55} />)}</>}
      {k === "a" && <>{[0, 1, 2, 3, 4].map((i) => <rect key={i} x="2" y={2 + i * 4.6} width="22" height="2.4" rx="1" fill={R} opacity={i % 2 ? 1 : 0.55} />)}</>}
    </svg>
  );
};

/* ---- Exchange (spot) → POST /spot/order, GET /spot/orders ---- */
export function Exchange({ P, W, sym, setSym, go, spot }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };
  const [side, setSide] = useState("buy"), [price, setPrice] = useState(""), [q, setQ] = useState(""), [amt, setAmt] = useState("");
  const [msg, setMsg] = useState(""), [ok, setOk] = useState(false), [busy, setBusy] = useState(false), [pick, setPick] = useState(false);
  const [bv, setBv] = useState("all");
  const [ent, setEnt] = useState("buy"), [entAll, setEntAll] = useState(false), [entPick, setEntPick] = useState(false), [entTmp, setEntTmp] = useState("buy");

  const src = P[sym] || {};
  const base = Number(src.price) > 0 ? Number(src.price) : 0; /* NaN আটকাতে */
  const chg = Number(src.chg) || 0;
  const col = chg >= 0 ? GREEN : RED;

  const book = useMemo(() => {
    const mk = (k) => Array.from({ length: 10 }, (_, i) => [base * (1 + k * 0.0004 * (i + 1)), Math.random() * 1.2 + 0.001]);
    return { a: mk(1), b: mk(-1) };
  }, [Math.round(base)]); // eslint-disable-line
  const rows = bv === "all" ? 5 : 10;
  const asks = bv === "b" ? [] : book.a.slice(0, rows).reverse();
  const bids = bv === "a" ? [] : book.b.slice(0, rows);
  const qmax = Math.max(0.0001, ...asks.map((r) => r[1]), ...bids.map((r) => r[1]));

  const usdt = (W.w && W.w.USDT) || 0, held = (W.w && W.w[sym]) || 0;
  const px = parseFloat(price) || base;
  const est = side === "buy" ? (px ? (parseFloat(amt) || 0) / px : 0) : (parseFloat(q) || 0);

  /* Quantity ↔ USDT একসাথে মেলানো */
  const onQty = (v) => { setQ(v); const n = parseFloat(v); setAmt(n > 0 && px ? String(+(n * px).toFixed(2)) : ""); };
  const onAmt = (v) => { setAmt(v); const a = parseFloat(v); setQ(a > 0 && px ? String(+(a / px).toFixed(8)) : ""); };
  const pct = (p) => {
    if (side === "buy") onAmt(String(+(usdt * p).toFixed(2)));
    else { const n = +(held * p).toFixed(8); setQ(String(n)); setAmt(px ? String(+(n * px).toFixed(2)) : ""); }
  };
  const setPx = (v) => {
    setPrice(v);
    const p = parseFloat(v);
    const n = parseFloat(q);
    if (p > 0 && n > 0) setAmt(String(+(n * p).toFixed(2)));
  };
  const step = (k) => { const v = px * (1 + k * 0.001); setPx(String(+v.toFixed(v >= 100 ? 2 : 6))); };
  const switchSide = (s) => { setSide(s); setMsg(""); setQ(""); setAmt(""); };

  const submit = async () => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    setMsg(""); setOk(false);
    try {
      if (side === "buy") {
        const a = parseFloat(amt) || 0;
        if (a <= 0) return setMsg(t("eAmt"));
        if (a > usdt) return setMsg(t("iU"));
        setBusy(true);
        await api("/spot/order", { method: "POST", body: { sym, side: "buy", amount: a } });
      } else {
        const n = parseFloat(q) || 0;
        if (n <= 0) return setMsg(t("eQty"));
        if (n > held) return setMsg(t("iC") + " " + sym);
        setBusy(true);
        await api("/spot/order", { method: "POST", body: { sym, side: "sell", qty: n } });
      }
      await W.reload();
      setAmt(""); setQ(""); setMsg(t("ok")); setOk(true);
    } catch (e) { setMsg(t(e.message)); }
    setBusy(false);
  };

  const Row = ({ r, c, side: sd }) => (
    <div className="cx2-row num" onClick={() => setPx(String(+r[0].toFixed(r[0] >= 100 ? 2 : 6)))}>
      <i style={{ width: Math.max(6, (r[1] / qmax) * 100) + "%", background: c }} />
      <b style={{ color: c }}>{base ? r[0].toFixed(6) : "--"}</b><span>{r[1].toFixed(6)}</span>
    </div>
  );

  const list = (spot || []).filter((o) => entAll || o.side === ent);

  return (
    <div className="cx2">
      <style>{EX_CSS}</style>
      <div className="cx-top">
        <button onClick={() => setPick(true)}><Ic d={ICON.menu} s={22} /></button>
        <h1 style={{ textAlign: "start", display: "flex", alignItems: "center", gap: 8, fontSize: 17 }}>{sym}/USDT <small style={{ color: col, fontWeight: 500, fontSize: 13 }}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)} %</small></h1>
        <button onClick={() => go("options")}><Ic d={ICON.market} s={22} /></button>
      </div>

      <div className="cx2-main">
        {/* ---- Order book ---- */}
        <div className="cx2-book">
          <div className="cx2-bh"><span>{t("price")}</span><span>{t("qty")}</span></div>
          {asks.map((r, i) => <Row key={"a" + i} r={r} c={RED} />)}
          <div className="cx2-mid num">
            <b style={{ color: col }}>{base ? base.toFixed(8) : "--"}</b>
            <small>≈ {base ? base.toFixed(2) : "--"}</small>
          </div>
          {bids.map((r, i) => <Row key={"b" + i} r={r} c={GREEN} />)}
          <div className="cx2-bv">
            {["all", "b", "a"].map((k) => <button key={k} className={bv === k ? "on" : ""} onClick={() => setBv(k)} aria-label={"book " + k}><BvIc k={k} /></button>)}
          </div>
        </div>

        {/* ---- Order form ---- */}
        <div className="cx2-form">
          <div className="cx2-bs">
            <button className={"bb" + (side === "buy" ? " on" : "")} onClick={() => switchSide("buy")}>{t("buy")}</button>
            <button className={"sb" + (side === "sell" ? " on" : "")} onClick={() => switchSide("sell")}>{t("sell")}</button>
          </div>
          <div className="cx2-sel"><span>{t("limit")}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l7 7 7-7" /></svg></div>

          <div className="cx2-fld">
            <input className="num" value={price} onChange={(e) => setPx(e.target.value)} placeholder={t("price")} inputMode="decimal" />
            <button className="pm" type="button" onClick={() => step(1)}>+</button>
            <button className="pm" type="button" onClick={() => step(-1)}>−</button>
          </div>
          <div className="cx2-est num">≈ {px ? px.toFixed(2) : "--"}</div>

          <div className="cx2-fld">
            <input className="num" value={q} onChange={(e) => onQty(e.target.value)} placeholder={t("qty")} inputMode="decimal" />
            <b>{sym}</b>
          </div>
          <div className="cx2-av num">
            <div><span>{t("avail")}</span><b>{side === "buy" ? usdt.toFixed(4) + " USDT" : held.toFixed(6) + " " + sym}</b></div>
            <div><span>{side === "buy" ? t("buy") : t("sell")}</span><b>{est ? est.toFixed(6) : "0.000000"} {sym}</b></div>
          </div>
          <div className="cx2-pc">{[0.25, 0.5, 0.75, 1].map((p) => <button key={p} type="button" onClick={() => pct(p)}>{p * 100}%</button>)}</div>

          <div className="cx2-fld">
            <input className="num" value={amt} onChange={(e) => onAmt(e.target.value)} placeholder={t("amt")} inputMode="decimal" />
            <b>USDT</b>
          </div>
          {msg && <p className={"cx2-msg" + (ok ? " ok" : "")}>{msg}</p>}
          <button className="cx2-cta" style={{ background: side === "buy" ? GREEN : RED, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={submit}>
            {busy ? t("wait2") : (side === "buy" ? t("buy") : t("sell")) + " " + sym}
          </button>
        </div>
      </div>

      <div className="cx2-gap" />
      <div className="cx2-eh">
        <h2>{t("entrust")}
          <button onClick={() => { setEntTmp(ent); setEntPick(true); }}>{t(ent)}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l7 7 7-7" /></svg>
          </button>
        </h2>
        <button className={entAll ? "on" : ""} onClick={() => setEntAll(!entAll)}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>
          {t("all")}
        </button>
      </div>
      <div className="cx2-list">
        {list.length ? list.slice(0, 30).map((o) => (
          <div key={o.id} className="cx2-tx">
            <span><b style={{ color: o.side === "buy" ? CUP : CDN, fontWeight: 600 }}>{o.side === "buy" ? t("buy") : t("sell")} {o.sym}/USDT</b><small className="num">{fmt(o.price || 0)} · {(o.qty || 0).toFixed(6)} · {new Date(o.created_at).toLocaleString()}</small></span>
            <span className="num">{(o.amount || 0).toFixed(2)} USDT</span>
          </div>
        )) : <div className="cx2-empty" />}
      </div>

      {/* ---- Buy / Sell picker (Cancel / Confirm) ---- */}
      {entPick && (
        <div className="cx2-ov" onClick={() => setEntPick(false)}>
          <div className="cx2-pk" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="cx2-pkh">
              <button type="button" onClick={() => setEntPick(false)}>{tt("cancel", "Cancel")}</button>
              <button type="button" className="ok" onClick={() => { setEnt(entTmp); setEntAll(false); setEntPick(false); }}>{tt("confirm", "Confirm")}</button>
            </div>
            <div className="cx2-pkb">
              {["buy", "sell"].map((k) => <button key={k} type="button" className={entTmp === k ? "on" : ""} onClick={() => setEntTmp(k)}>{t(k)}</button>)}
              <button type="button" style={{ height: 0, padding: 0, borderTop: "1px solid var(--ln)", pointerEvents: "none" }} aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {pick && <CoinDrawer P={P} onClose={() => setPick(false)} onPick={(s) => { setSym(s); setPick(false); }} />}
    </div>
  );
}

/* ---- Candle chart ---- */
const IVS = [["1m", "1m"], ["5m", "5m"], ["15m", "15m"], ["1h", "1H"], ["4h", "4H"], ["1d", "D"]];
const IVMS = { "1m": 6e4, "5m": 3e5, "15m": 9e5, "1h": 36e5, "4h": 144e5, "1d": 864e5 };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function synth(price, iv, n = 200) {
  const ms = IVMS[iv], now = Math.floor(Date.now() / ms) * ms;
  let seed = (Math.round(price * 100) % 9973) + iv.length + 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const vol = iv === "1d" ? 0.025 : iv === "4h" ? 0.012 : iv === "1h" ? 0.006 : 0.002;
  const arr = []; let c = price;
  for (let i = 0; i < n; i++) {
    const o = c / (1 + (rnd() - 0.5) * vol * 2);
    const h = Math.max(o, c) * (1 + rnd() * vol * 0.5), l = Math.min(o, c) * (1 - rnd() * vol * 0.5);
    arr.unshift({ t: now - i * ms, o, h, l, c, v: (rnd() * 0.8 + 0.2) * 1000 });
    c = o;
  }
  return arr;
}
const niceStep = (range, target) => { const raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag; return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag; };
const decOf = (p) => (p >= 100 ? 2 : p >= 1 ? 4 : p >= 0.01 ? 6 : 8);
const fmtT = (ts, iv) => { const d = new Date(ts), z = (x) => String(x).padStart(2, "0"); return iv === "1d" ? d.getDate() + " " + MON[d.getMonth()] : z(d.getHours()) + ":" + z(d.getMinutes()); };

function Chart({ sym, price }) {
  const t = useT();
  const wrap = useRef(null);
  const [w, setW] = useState(360), [iv, setIv] = useState("1d"), [ivOpen, setIvOpen] = useState(false), [data, setData] = useState([]);
  const [n, setN] = useState(150), [off, setOff] = useState(0), [hov, setHov] = useState(null);
  const priceRef = useRef(price); priceRef.current = price;

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 360));
    ro.observe(el); setW(el.clientWidth || 360);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let stop = false;
    setOff(0); setHov(null);
    const load = async () => {
      try {
        if (sym === "BSV") throw 0;
        const j = await api(`/market/klines?sym=${sym}&interval=${iv}&limit=300`);
        if (!j || !j.length) throw 0;
        if (!stop) setData(j);
      } catch { if (!stop) setData((o) => (o.length && o.__sym === sym + iv ? o : Object.assign(synth(priceRef.current, iv), { __sym: sym + iv }))); }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { stop = true; clearInterval(id); };
  }, [sym, iv]);

  const cs = useMemo(() => {
    if (!data.length || !price) return data;
    const a = data.slice(), l = a[a.length - 1];
    a[a.length - 1] = { ...l, c: price, h: Math.max(l.h, price), l: Math.min(l.l, price) };
    return a;
  }, [data, price]);
  const ma = useMemo(() => cs.map((_, i) => (i < 8 ? null : cs.slice(i - 8, i + 1).reduce((s, x) => s + x.c, 0) / 9)), [cs]);

  const AX = 66, H1 = 340, GAP = 12, H2 = 90, TA = 28, H = H1 + GAP + H2 + TA;
  const pw = Math.max(100, w - AX);
  const end = Math.max(1, cs.length - off), start = Math.max(0, end - n);
  const vis = cs.slice(start, end), len = vis.length;
  const step = pw / n, x0 = pw - len * step;
  const cx = (k) => x0 + (k + 0.5) * step;

  let hi = -Infinity, lo = Infinity, vmax = 0;
  vis.forEach((c, k) => { hi = Math.max(hi, c.h); lo = Math.min(lo, c.l); vmax = Math.max(vmax, c.v); const m = ma[start + k]; if (m) { hi = Math.max(hi, m); lo = Math.min(lo, m); } });
  if (!isFinite(hi) || !len) { hi = 1; lo = 0; vmax = 1; }
  const padp = (hi - lo) * 0.06 || hi * 0.01;
  hi += padp; lo -= padp;
  const y = (p) => 6 + ((hi - p) / (hi - lo)) * (H1 - 12);
  const vy = (v) => H1 + GAP + H2 - 4 - (v / (vmax || 1)) * (H2 - 14);
  const dec = decOf(price || 1);
  const ps = niceStep(hi - lo, 8);
  const ticks = [];
  for (let p = Math.ceil(lo / ps) * ps; p <= hi; p += ps) ticks.push(p);
  const every = Math.max(1, Math.ceil(len / 5));
  const labs = [];
  if (iv === "1d") vis.forEach((c, k) => { const d = new Date(c.t), pv = k ? vis[k - 1] : (start > 0 ? cs[start - 1] : null); if (!pv || new Date(pv.t).getMonth() !== d.getMonth()) labs.push([k, MON[d.getMonth()]]); });
  if (iv !== "1d" || labs.length < 2) { labs.length = 0; vis.forEach((c, k) => { if (k % every === 0) labs.push([k, fmtT(c.t, iv)]); }); }
  const last = vis[len - 1];
  const cur = hov && vis[hov.k] ? vis[hov.k] : last;
  const curIdx = hov && vis[hov.k] ? start + hov.k : start + len - 1;
  const up = (c) => c.c >= c.o;
  const colr = cur ? (up(cur) ? CUP : CDN) : CUP;
  const lastCol = cs.length && up(cs[cs.length - 1]) ? CUP : CDN;
  const maPts = vis.map((c, k) => ({ m: ma[start + k], k })).filter((a) => a.m).map((a) => `${cx(a.k)},${y(a.m)}`).join(" ");

  const ptr = useRef(new Map()), gs = useRef({}), offR = useRef(0), nR = useRef(150);
  offR.current = off; nR.current = n;
  const maxOff = Math.max(0, cs.length - 10);
  const hover = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    if (px > pw || px < x0 || !len) return setHov(null);
    setHov({ k: Math.max(0, Math.min(len - 1, Math.floor((px - x0) / step))), x: px, y: py });
  };
  const dist = () => { const a = [...ptr.current.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };
  const onDown = (e) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    ptr.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.current.size === 2) { gs.current = { d: dist(), n: nR.current }; setHov(null); }
    else gs.current = { x: e.clientX, off: offR.current, mv: false };
    hover(e);
  };
  const onMv = (e) => {
    if (ptr.current.has(e.pointerId)) ptr.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.current.size >= 2) { setN(Math.max(10, Math.min(200, Math.round(gs.current.n * gs.current.d / dist())))); return; }
    if (ptr.current.size === 1) {
      const dx = e.clientX - gs.current.x;
      if (gs.current.mv || Math.abs(dx) > 6) { gs.current.mv = true; setHov(null); setOff(Math.max(0, Math.min(maxOff, gs.current.off + Math.round(dx / step)))); return; }
    }
    hover(e);
  };
  const onUp = (e) => {
    ptr.current.delete(e.pointerId);
    const r = [...ptr.current.values()][0];
    if (r) gs.current = { x: r.x, off: offR.current, mv: true };
  };
  const onWheel = (e) => setN((x) => Math.max(10, Math.min(200, Math.round(x * (e.deltaY > 0 ? 1.1 : 0.9)))));
  const chgv = cur ? cur.c - cur.o : 0;
  const vma = (() => { const i = curIdx; const s = cs.slice(Math.max(0, i - 19), i + 1); return s.length ? s.reduce((a, x) => a + x.v, 0) / s.length : 0; })();
  const ivl = (IVS.find((a) => a[0] === iv) || [])[1];

  return (
    <div className="cx-chartw" ref={wrap}>
      <div className="cx-ctool">
        <div className="cx-ivw">
          <button onClick={() => setIvOpen(!ivOpen)}>{ivl}</button>
          {ivOpen && <div className="cx-ivm">{IVS.map(([k, l]) => <button key={k} className={k === iv ? "on" : ""} onClick={() => { setIv(k); setIvOpen(false); }}>{l}</button>)}</div>}
        </div>
        <span className="cx-cti"><Ic d={ICON.candle} s={18} /></span>
        <span className="cx-cti ind">∿ {t("ind")}</span>
      </div>
      <div className="cx-cwrap" style={{ height: H }}>
        {cur && (
          <div className="cx-chead" style={{ color: colr }}>
            <div><span className="cx-sq" /><span className="cx-gt2">{sym.toLowerCase()}usdt, {ivl} ⌄</span>{" "}O{cur.o.toFixed(dec)} H{cur.h.toFixed(dec)} L{cur.l.toFixed(dec)} C{cur.c.toFixed(dec)} {chgv >= 0 ? "+" : ""}{chgv.toFixed(dec)} ({chgv >= 0 ? "+" : ""}{((chgv / cur.o) * 100).toFixed(2)}%)</div>
            <div className="cx-gt2">MA (9, close, 0) ⌄ <span style={{ color: "#e8914f" }}>{ma[curIdx] ? ma[curIdx].toFixed(4) : "n/a"}</span></div>
          </div>
        )}
        <svg width={w} height={H} onPointerDown={onDown} onPointerMove={onMv} onPointerUp={onUp} onPointerCancel={onUp}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") setHov(null); }} onWheel={onWheel} style={{ touchAction: "none", display: "block" }}>
          {ticks.map((p) => (
            <g key={p}>
              <line x1="0" x2={pw} y1={y(p)} y2={y(p)} className="cx-gl" />
              <line x1={pw} x2={pw + 4} y1={y(p)} y2={y(p)} className="cx-ax" />
              <text x={pw + 8} y={y(p) + 4} className="cx-gt" fontSize="11">{p.toFixed(dec > 2 ? dec : 2)}</text>
            </g>
          ))}
          <line x1={pw} x2={pw} y1="0" y2={H - TA} className="cx-ax" />
          <line x1="0" x2={w} y1={H1 + GAP / 2} y2={H1 + GAP / 2} className="cx-ax" />
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={pw} x2={pw + 4} y1={vy(vmax * f)} y2={vy(vmax * f)} className="cx-ax" />
              <text x={pw + 8} y={vy(vmax * f) + 4} className="cx-gt" fontSize="11">{fmtV(vmax * f)}</text>
            </g>
          ))}
          {labs.filter(([k]) => cx(k) > 18 && cx(k) < pw - 18).map(([k, lb]) => (
            <g key={"t" + k}>
              <line x1={cx(k)} x2={cx(k)} y1="0" y2={H - TA} className="cx-gl" />
              <text x={cx(k)} y={H - 9} textAnchor="middle" className="cx-gt" fontSize="11">{lb}</text>
            </g>
          ))}
          {vis.map((c, k) => {
            const col = up(c) ? CUP : CDN, bw = Math.max(2, step * 0.7), top = y(Math.max(c.o, c.c)), bh = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
            return (
              <g key={c.t}>
                <rect x={cx(k) - bw / 2} y={vy(c.v)} width={bw} height={H1 + GAP + H2 - 4 - vy(c.v)} fill={col} opacity=".4" />
                <line x1={cx(k)} x2={cx(k)} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1.6" />
                <rect x={cx(k) - bw / 2} y={top} width={bw} height={bh} fill={col} />
              </g>
            );
          })}
          {maPts && <polyline points={maPts} fill="none" stroke="#e8a46b" strokeWidth="1" />}
          {off === 0 && price > lo && price < hi && (
            <g>
              <line x1="0" x2={pw} y1={y(price)} y2={y(price)} stroke={lastCol} strokeWidth="1" strokeDasharray="1 2" />
              <rect x={pw} y={y(price) - 10} width={AX} height="20" fill={lastCol} />
              <text x={pw + 6} y={y(price) + 4} fill="#fff" fontSize="11">{price.toFixed(dec > 2 ? dec : 2)}</text>
            </g>
          )}
          {hov && vis[hov.k] && (
            <g>
              <line x1={cx(hov.k)} x2={cx(hov.k)} y1="0" y2={H - TA} className="cx-ch" />
              {hov.y < H1 && <>
                <line x1="0" x2={pw} y1={hov.y} y2={hov.y} className="cx-ch" />
                <rect x={pw} y={hov.y - 10} width={AX} height="20" fill="#4a5568" />
                <text x={pw + 6} y={hov.y + 4} fill="#fff" fontSize="11">{(hi - ((hov.y - 6) / (H1 - 12)) * (hi - lo)).toFixed(dec > 2 ? dec : 2)}</text>
              </>}
              <rect x={Math.max(0, Math.min(pw - 74, cx(hov.k) - 37))} y={H - TA + 2} width="74" height="20" fill="#4a5568" />
              <text x={Math.max(0, Math.min(pw - 74, cx(hov.k) - 37)) + 37} y={H - TA + 16} textAnchor="middle" fill="#fff" fontSize="11">{fmtT(vis[hov.k].t, iv)}</text>
            </g>
          )}
          <text x="8" y={H1 + GAP + 14} className="cx-gt" fontSize="11">Volume (20) ⌄ <tspan fill={colr}>{cur ? fmtV(cur.v) : ""}</tspan> <tspan fill="#e8914f">{fmtV(vma)}</tspan></text>
        </svg>
        <div className="cx-zoom">
          <button onClick={() => setN((x) => Math.min(200, Math.round(x * 1.3)))}>−</button>
          <button onClick={() => setN((x) => Math.max(10, Math.round(x / 1.3)))}>+</button>
          <button onClick={() => setOff((o) => Math.min(Math.max(0, cs.length - 10), o + Math.max(1, Math.round(n / 4))))}>‹</button>
          <button onClick={() => setOff((o) => Math.max(0, o - Math.max(1, Math.round(n / 4))))}>›</button>
        </div>
        <button className="cx-gear" onClick={() => { setOff(0); setN(150); }} aria-label="reset"><Ic d={ICON.gear} s={18} /></button>
      </div>
    </div>
  );
}

/* ---- Options helpers ---- */
const fmtPnl = (v) => {
  const a = Math.abs(Number(v) || 0);
  return a > 0 && a < 0.01 ? a.toFixed(4) : a.toFixed(2);
};

/* বাকি সময়: 30s / 5m 03s / 1h 02m 03s / 1d 2h 3m */
const durLeft = (end) => {
  let s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m ${s}s`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
};

/* কনফার্ম ডায়ালগ: প্রিমিয়াম কার্ড */
const CF_CSS = `
.cx-cfo{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:0 24px;
  animation:cxcf .18s ease}
.cx-cf{width:100%;max-width:320px;background:#fff;color:#1a1a1a;border-radius:16px;overflow:hidden;
  box-shadow:0 24px 60px -20px rgba(0,0,0,.6);animation:cxcu .24s cubic-bezier(.2,.8,.2,1);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali",Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
.cx-cf-t{padding:16px 16px 13px;text-align:center;font-size:16px;font-weight:600;letter-spacing:.2px;border-bottom:1px solid #e4e8ee}
.cx-cf-b{padding:14px 22px 18px;font-size:14px;line-height:1.5;border-bottom:1px solid #e4e8ee}
.cx-cf-b p{margin:0 0 8px;display:flex;justify-content:space-between;gap:12px}
.cx-cf-b p:last-child{margin-bottom:0}
.cx-cf-b p b{font-weight:600;font-variant-numeric:tabular-nums}
.cx-cf-a{display:grid;grid-template-columns:1fr 1fr}
.cx-cf-a button{height:48px;background:none;border:0;font-size:15px;cursor:pointer;color:inherit;font-family:inherit;
  transition:background .15s ease}
.cx-cf-a button:active{background:rgba(0,0,0,.04)}
.cx-cf-a button+button{border-left:1px solid #e4e8ee;font-weight:600;color:#1a82d6}
.cx-cf-a button:disabled{opacity:.5}
.cx.dark .cx-cf{background:#12203a;color:#e8ecf3}
.cx.dark .cx-cf-t,.cx.dark .cx-cf-b{border-bottom-color:#2a3a56}
.cx.dark .cx-cf-a button+button{border-left-color:#2a3a56}
.cx.dark .cx-cf-a button:active{background:rgba(255,255,255,.05)}
.cx-line input,.cx-line input:focus,.cx-line input:focus-visible{outline:none!important;box-shadow:none!important;-webkit-appearance:none;appearance:none}
@keyframes cxcf{from{opacity:0}to{opacity:1}}
@keyframes cxcu{from{transform:translateY(14px) scale(.97);opacity:.5}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.cx-cfo,.cx-cf{animation:none!important}}
`;

/* ---- Options → POST /options/open, GET /options/status ---- */
export function Options({ P, W, sym, setSym, pos, orders }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };
  const [qty, setQty] = useState(10), [sec, setSec] = useState(DEFAULT_SECS[0]), [sheet, setSheet] = useState(false), [, tick] = useState(0);
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [view, setView] = useState("k"), [ptab, setPtab] = useState("list"), [pick, setPick] = useState(false);
  const [cf, setCf] = useState(null);   /* confirm dialog: { dir } */
  const [st, setSt] = useState(null);   /* অ্যাডমিন সেটিংস */
  const [extra, setExtra] = useState({}); /* position id -> { mode, leverage, yield_rate } */
  const d = P[sym];
  const guest = !!(W && W.guest);

  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(id); }, []);

  /* অ্যাডমিন সেটিংস: enabled, disabled_syms, qty_min/max, mode, leverage, yield, secs, blocked */
  useEffect(() => {
    if (guest) { setSt(null); return undefined; }
    let on = true;
    const load = async () => {
      try { const r = await api("/options/status"); if (on) setSt(r); } catch (_) {}
    };
    load();
    const id = setInterval(load, 15000);
    return () => { on = false; clearInterval(id); };
  }, [guest]);

  /* খোলা ট্রেডের নিয়ম (mode/leverage) যাতে লাইভ লাভ-লস ঠিক দেখায় */
  const loadExtra = async () => {
    try {
      const r = await api("/options/positions");
      const m = {};
      (r || []).forEach((x) => { m[x.id] = { mode: x.mode, leverage: x.leverage, yield_rate: x.yield_rate }; });
      setExtra(m);
    } catch (_) {}
  };
  useEffect(() => {
    if (guest) { setExtra({}); return undefined; }
    loadExtra();
    const id = setInterval(loadExtra, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [guest, (pos || []).length]);

  /* সময়ের তালিকা: server থেকে, না এলে ডিফল্ট */
  const secList = st && Array.isArray(st.secs) && st.secs.length ? st.secs : DEFAULT_SECS;
  useEffect(() => {
    if (!secList.includes(sec)) setSec(secList[0]);
    // eslint-disable-next-line
  }, [secList.join(",")]);

  /* 30 -> 30s, 300 -> 5m, 3600 -> 1h, 86400 -> 1d */
  const fmtDur = (s) => {
    s = Number(s) || 0;
    if (s >= 86400 && s % 86400 === 0) return (s / 86400) + tt("dday", "d");
    if (s >= 3600 && s % 3600 === 0) return (s / 3600) + tt("dhour", "h");
    if (s >= 60 && s % 60 === 0) return (s / 60) + tt("dmin", "m");
    return s + tt("dsec", "s");
  };

  const bal = (W && W.w && W.w.USDT) || 0;
  const minQ = st && st.qty_min > 0 ? st.qty_min : MIN_Q;
  const maxQ = st && st.qty_max > 0 ? st.qty_max : MAX_Q;
  const pausedMsg = !st ? ""
    : !st.enabled ? tt("optionsOff", "Options trading is paused")
    : st.blocked ? tt("userBlocked", "Trading is disabled for your account")
    : (st.disabled_syms || []).includes(sym) ? tt("symOff", "This coin is paused")
    : "";
  const paused = !!pausedMsg;
  const isProp = !!st && st.mode === "proportional";
  const yld = st && st.yield > 0 ? st.yield : YIELD;

  /* খোলা ট্রেডের এখনকার লাভ/লস (সার্ভারের হিসাবের মতোই) */
  const calcLive = (p, c) => {
    const ex = extra[p.id];
    const mode = ex ? (ex.mode || "fixed") : (st ? st.mode : "fixed");
    const q = Number(p.qty) || 0, o = Number(p.open) || 0;
    if (mode === "proportional") {
      const lev = ex && ex.leverage ? Number(ex.leverage) : (st ? Number(st.leverage || 1) : 1);
      let mv = o ? (c - o) / o : 0;
      if (p.dir !== "long") mv = -mv;
      return Math.max(q * mv * lev, -q);
    }
    const rate = ex && ex.yield_rate != null ? Number(ex.yield_rate) : YIELD;
    const win = p.dir === "long" ? c > o : c < o;
    return win ? q * rate : -q;
  };

  /* ট্রেড খোলার আগের যাচাই */
  const check = () => {
    if (guest) { W.needLogin(); return false; }
    if (paused) { setMsg(pausedMsg); return false; }
    if (qty < minQ || qty > maxQ) { setMsg(t("badQ")); return false; }
    if (qty > bal) { setMsg(t("iB")); return false; }
    return true;
  };

  const open = async (dir) => {
    if (busy) return;
    setMsg("");
    if (!check()) return;
    setBusy(true);
    try {
      await api("/options/open", { method: "POST", body: { sym, direction: dir, qty, sec } });
      await W.reload();
      loadExtra();
      setSheet(false); setMsg(t("openMsg"));
    } catch (e) { setMsg(t(e.message)); }
    setBusy(false);
  };

  /* Buy Long / Sell Short → আগে কনফার্ম কার্ড; Confirm চাপলে তবেই ট্রেড */
  const ask = (dir) => {
    if (busy) return;
    setMsg("");
    if (!check()) return;
    setCf({ dir });
  };
  const doConfirm = () => {
    const c = cf;
    setCf(null);
    if (c) open(c.dir);
  };

  return (
    <>
      <style>{CF_CSS}</style>
      <div className="cx-top">
        <button onClick={() => setPick(true)}><Ic d={ICON.menu} s={22} /></button>
        <h1 style={{ textAlign: "start", fontSize: 17 }}>{sym}/USDT</h1>
        <button className="cx-link" style={{ fontSize: 14 }} onClick={() => setView(view === "k" ? "p" : "k")}>{view === "k" ? t("pos") : t("kl")} <Ic d={view === "k" ? ICON.doc : ICON.candle} s={19} /></button>
      </div>
      {view === "k" ? (
        <>
          <div className="cx-opt-h">
            <b style={{ color: d.chg >= 0 ? GREEN : RED }}>{d.price.toFixed(6)}<small>{d.chg.toFixed(2)} %</small></b>
            <div><span>{t("hi")}</span><i>{fmt(d.hi)}</i><span>{t("lo")}</span><i>{fmt(d.lo)}</i><span>{t("vol")}</span><i>{d.vol.toFixed(2)}</i></div>
          </div>
          {paused && <p className="cx-msg bad">{pausedMsg}</p>}
          <Chart sym={sym} price={d.price} />
          {msg && <p className="cx-msg">{msg}</p>}
          <div style={{ height: 110 }} />
          <div className="cx-obar">
            <button onClick={() => setSheet(true)}>{t("qty")} ⌄<b>{qty.toFixed(2)}</b></button>
            <button onClick={() => setSheet(true)}>{t("time")} ⌄<b>{fmtDur(sec)}</b></button>
            <button className="g" style={{ opacity: busy || paused ? 0.6 : 1 }} disabled={busy || paused} onClick={() => ask("long")}>{t("bl")}</button>
            <button className="r" style={{ opacity: busy || paused ? 0.6 : 1 }} disabled={busy || paused} onClick={() => ask("short")}>{t("ss")}</button>
          </div>
        </>
      ) : (
        <>
          <div className="cx-tabs two cx-ptabs">
            <button className={ptab === "list" ? "on" : ""} onClick={() => setPtab("list")}>{t("pl")}</button>
            <button className={ptab === "rec" ? "on" : ""} onClick={() => setPtab("rec")}>{t("orec")}</button>
          </div>
          <div className="cx-tbl cx-tbh"><span>{t("qty")}</span><span>{t("pp")}</span><span>{t("fp")}</span><span>{t("pnl")}</span></div>
          {ptab === "list" && pos.map((p) => {
            const c = P[p.sym] ? P[p.sym].price : p.open;
            const pnl = calcLive(p, c);
            return (
              <div key={p.id} className="cx-tbl">
                <span><Coin s={p.sym} size={18} /> {p.qty}<small>{p.sym} · {p.dir === "long" ? t("bl") : t("ss")} · {durLeft(p.end)}</small></span>
                <span>{fmt(p.open)}</span><span>{fmt(c)}</span>
                <span style={{ color: pnl >= 0 ? CUP : CDN }}>{pnl >= 0 ? "+" : "-"}{fmtPnl(pnl)}</span>
              </div>
            );
          })}
          {ptab === "rec" && orders.map((o) => {
            const pn = Number(o.pnl || 0);
            return (
              <div key={o.id} className="cx-tbl">
                <span><Coin s={o.sym} size={18} /> {o.qty}<small>{o.sym} · {o.dir === "long" ? t("bl") : t("ss")}</small></span>
                <span>{fmt(o.open)}</span><span>{o.close != null ? fmt(o.close) : "--"}</span>
                <span style={{ color: pn >= 0 ? CUP : CDN }}>{pn >= 0 ? "+" : "-"}{fmtPnl(pn)}</span>
              </div>
            );
          })}
          {((ptab === "list" && !pos.length) || (ptab === "rec" && !orders.length)) && (
            <div className="cx-norec">
              <svg width="150" height="120" viewBox="0 0 150 120"><rect x="38" y="20" width="74" height="70" rx="4" fill="#eceef2" /><rect x="46" y="28" width="58" height="44" fill="#fff" /><rect x="54" y="38" width="42" height="5" fill="#e0e2e8" /><rect x="54" y="49" width="42" height="5" fill="#e0e2e8" /><rect x="54" y="60" width="42" height="5" fill="#e0e2e8" /><rect x="34" y="72" width="82" height="22" rx="3" fill="#e3e5ea" /><rect x="62" y="81" width="26" height="4" rx="2" fill="#fff" /></svg>
              <p>{t("norec")}</p>
            </div>
          )}
        </>
      )}

      {/* ---- Trade sheet ---- */}
      {sheet && (
        <div className="cx-over end" onClick={() => setSheet(false)}>
          <div className="cx-sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t("mode")}</h4><div className="cx-chs"><button className="on">USDT</button></div>
            <h4>{t("oq")}</h4>
            <div className="cx-chs">{QTY.map((x) => <button key={x} className={qty === x ? "on" : ""} onClick={() => setQty(x)}>{x.toFixed(2)}</button>)}</div>
            <div className="cx-line"><input value={qty} inputMode="decimal" onChange={(e) => setQty(parseFloat(e.target.value) || 0)} /><button onClick={() => setQty(Math.min(Math.floor(bal), maxQ))}>{t("all")}</button></div>
            <h4>{t("ot")}</h4>
            <div className="cx-chs" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {secList.map((x) => <button key={x} className={sec === x ? "on" : ""} onClick={() => setSec(x)}>{fmtDur(x)}</button>)}
            </div>
            <div className="cx-info">
              <span>{t("bal")} : {bal.toFixed(8)}</span>
              <span>{isProp ? tt("lev", "Leverage") + " : x" + Number(st.leverage || 1) : t("yld") + " : " + Math.round(yld * 100) + "%"}</span>
            </div>
            <div className="cx-info"><span>{t("oq")} : {Number(minQ).toFixed(2)} - {Number(maxQ).toFixed(2)}</span></div>
            {paused && <p className="cx-msg bad" style={{ margin: "0 0 10px" }}>{pausedMsg}</p>}
            {msg && <p className="cx-msg" style={{ margin: "0 0 10px" }}>{msg}</p>}
            <div className="cx-two">
              <button className="g" disabled={busy || paused} onClick={() => ask("long")}>{t("bl")}</button>
              <button className="r" disabled={busy || paused} onClick={() => ask("short")}>{t("ss")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Confirm dialog (Cancel / Confirm) ---- */}
      {cf && (
        <div className="cx-cfo" onClick={() => setCf(null)}>
          <div className="cx-cf" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="cx-cf-t">{cf.dir === "long" ? t("bl") : t("ss")}</div>
            <div className="cx-cf-b">
              <p><span>{t("oq")}</span><b>{qty.toFixed(2)}</b></p>
              <p><span>{t("ot")}</span><b>{fmtDur(sec)}</b></p>
            </div>
            <div className="cx-cf-a">
              <button type="button" onClick={() => setCf(null)}>{tt("cancel", "Cancel")}</button>
              <button type="button" disabled={busy} onClick={doConfirm}>{tt("confirm", "Confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {pick && <CoinDrawer P={P} onClose={() => setPick(false)} onPick={(s) => { setSym(s); setPick(false); }} />}
    </>
  );
}

/* ---- Assets (GET /wallet/accounts) : Options + Funds আলাদা ---- */
export function Assets({ P, W }) {
  const t = useT();
  const [tab, setTab] = useState("assets"), [hide, setHide] = useState(false);
  const [accs, setAccs] = useState({ options: {}, funds: {} });
  const guest = !!(W && W.guest);

  const loadAccs = async () => {
    try {
      const r = await api("/wallet/accounts");
      setAccs({ options: (r && r.options) || {}, funds: (r && r.funds) || {} });
    } catch (_) {}
  };
  useEffect(() => { if (!guest) loadAccs(); }, [guest, W && W.w]); // eslint-disable-line

  const val = (s, q) => (STABLE.includes(s) ? q : q * ((P[s] && P[s].price) || 0));
  const av = (acc, s) => Number(acc && acc[s] && acc[s].available) || 0;
  const fzv = (acc, s) => Number(acc && acc[s] && acc[s].frozen) || 0;
  const totOf = (acc) => Object.keys(acc || {}).reduce((x, s) => x + val(s, av(acc, s) + fzv(acc, s)), 0);

  const totOpt = totOf(accs.options), totFun = totOf(accs.funds);
  const totAll = totOpt + totFun;
  const sub = tab === "assets" ? null : tab;
  const tabs = [["assets", t("assets")], ["funds", t("funds")], ["options", t("options")], ["quant", t("quant")]];
  const sec = [["ta", totAll], ["funds", totFun], ["options", totOpt], ["quant", 0]];
  const title = (k) => (k === "ta" ? t("ta") : t(k));
  const subAcc = sub === "funds" ? accs.funds : sub === "options" ? accs.options : {};
  const subTotal = sub === "funds" ? totFun : sub === "options" ? totOpt : 0;

  return (
    <>
      <div className="cx-tabs big">{tabs.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      {!sub ? (
        <div className="cx-cards">{sec.map(([k, v]) => (<div key={k} className="cx-ac"><h3>{title(k)} {t("conv")}</h3><small>{t("avail")}</small><b>{v.toFixed(2)}</b></div>))}</div>
      ) : (
        <>
          <div className="cx-sum">
            <div><h2>{title(sub)} {t("conv")}</h2><span>{t("ta")}</span><small>{t("cv")}</small></div>
            <button onClick={() => setHide(!hide)}><Ic d={ICON.eye} s={26} /></button>
            <b>$ {hide ? "••••••" : subTotal.toFixed(8)}</b><small>≈ $ {subTotal.toFixed(2)}</small>
          </div>
          <div className="cx-cards gray">
            {ASSET_COINS.map((s) => {
              const q = av(subAcc, s);
              const fz = fzv(subAcc, s);
              return (
                <div key={s} className="cx-ac wide">
                  <h3><span className="cx-dn"><Coin s={s} size={30} />{s}</span> <i>›</i></h3>
                  <div className="cx-3"><span><small>{t("avail")}</small>{q.toFixed(8)}</span><span><small>{t("frozen")}</small>{fz.toFixed(8)}</span><span><small>{t("cv")}</small>$ {val(s, q + fz).toFixed(2)}</span></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
