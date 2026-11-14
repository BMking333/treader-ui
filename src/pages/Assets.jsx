import React, { useState } from "react";
import { useT, Coin, COINS, CUP, CDN } from "./Home";

/* =====================================================================
   src/pages/Assets.jsx — Assets (wallet) page
   Props: P (prices), W (wallet), go (page navigation)
   W = { w: {COIN: available}, fz: {COIN: frozen}, total, reload, guest, needLogin }
   ===================================================================== */

const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);

const fmtAmt = (v) => {
  const n = num(v);
  if (n === 0) return "0.00000000";
  return n >= 1000 ? n.toFixed(4) : n.toFixed(8);
};
const fmtUsd = (v) => num(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CSS = `
.cx-as{background:#f3f5fa;min-height:100vh;padding-bottom:20px;color:#111}
.cx-as,.cx-as *{box-sizing:border-box}
.cx-as button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.cx-as-top{display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 16px;background:#fff;border-bottom:1px solid #eef0f3}
.cx-as-top h1{margin:0;font-size:19px;font-weight:700}
.cx-as-top button{font-size:14px;color:#1a82d6!important}
.cx-as-sum{margin:14px 12px;padding:22px 20px;border-radius:16px;background:linear-gradient(135deg,#2a8fe0,#1f7acb);color:#fff;box-shadow:0 8px 24px rgba(31,122,203,.3)}
.cx-as-sum small{display:block;color:rgba(255,255,255,.8)!important;font-size:14px}
.cx-as-sum b{display:block;margin:8px 0 2px;font-size:30px;font-weight:700;letter-spacing:.2px}
.cx-as-sum span{font-size:14px;color:rgba(255,255,255,.85)}
.cx-as-act{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}
.cx-as-act button{height:44px;border-radius:10px;background:rgba(255,255,255,.2);color:#fff!important;font-size:16px;font-weight:600;text-align:center}
.cx-as-act button:active{background:rgba(255,255,255,.32)}
.cx-as-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 18px 8px;font-size:15px;color:#6b7183}
.cx-as-bar label{display:flex;align-items:center;gap:8px;cursor:pointer}
.cx-as-bar input{width:18px;height:18px;accent-color:#1a82d6}
.cx-as-list{display:flex;flex-direction:column;gap:12px;padding:0 12px}
.cx-as-c{background:#fff;border-radius:14px;padding:16px 16px 14px}
.cx-as-h{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.cx-as-h b{font-size:18px}
.cx-as-h b i{font-style:normal;font-weight:400;color:#8a94a6;font-size:13px}
.cx-as-h em{margin-inline-start:auto;font-style:normal;font-size:15px;font-weight:600}
.cx-as-g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:14px}
.cx-as-g span small{display:block;color:#8a94a6!important;font-size:12px;margin-bottom:4px}
.cx-as-g span:nth-child(2){text-align:center}
.cx-as-g span:last-child{text-align:end}
.cx-as-g span{word-break:break-all}
.cx-as-none{text-align:center;color:#9aa0ad;padding:50px 0;font-size:15px}
.cx-as-guest{margin:30px 20px;padding:30px 20px;background:#fff;border-radius:16px;text-align:center}
.cx-as-guest p{margin:0 0 16px;color:#6b7183;font-size:15px}
.cx-as-guest button{padding:12px 34px;border-radius:12px;background:#1a82d6!important;color:#fff!important;font-size:16px;font-weight:600}

.cx.dark .cx-as{background:#0b1424;color:#e8ecf3}
.cx.dark .cx-as-top,.cx.dark .cx-as-c,.cx.dark .cx-as-guest{background:#17263d;border-color:#22304a}
.cx.dark .cx-as-bar,.cx.dark .cx-as-guest p{color:#9aa6bb}
.cx.dark .cx-as-g span small,.cx.dark .cx-as-h b i{color:#8d98ad!important}
`;

export default function Assets({ P, W, go }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  const [hideZero, setHideZero] = useState(false);

  const w = (W && W.w) || {};
  const fz = (W && W.fz) || {};
  const priceOf = (c) => (c === "USDT" ? 1 : num(P && P[c] && P[c].price));

  const coins = ["USDT", ...COINS.filter((c) => c !== "USDT")];
  const rows = coins
    .map((c) => {
      const a = num(w[c]), f = num(fz[c]);
      return { c, a, f, usd: (a + f) * priceOf(c) };
    })
    .filter((r) => !hideZero || r.a + r.f > 0)
    .sort((x, y) => y.usd - x.usd || (x.c === "USDT" ? -1 : 0));

  const computedTotal = coins.reduce((s, c) => s + (num(w[c]) + num(fz[c])) * priceOf(c), 0);
  const total = W && typeof W.total === "number" ? W.total : computedTotal;

  const toPage = (p) => { if (typeof go === "function") go(p); };

  return (
    <div className="cx-as">
      <style>{CSS}</style>

      <div className="cx-as-top">
        <h1>{tt("assets", "Assets")}</h1>
        {W && !W.guest && <button type="button" onClick={() => W.reload && W.reload()}>↻</button>}
      </div>

      {W && W.guest ? (
        <div className="cx-as-guest">
          <p>{tt("needLogin", "Please log in to view your assets")}</p>
          <button type="button" onClick={() => W.needLogin()}>{tt("login", "Login")}</button>
        </div>
      ) : (
        <>
          <div className="cx-as-sum">
            <small>{tt("totalAssets", "Total assets")} (USDT)</small>
            <b>{fmtUsd(total)}</b>
            <span>≈ ${fmtUsd(total)}</span>
            <div className="cx-as-act">
              <button type="button" onClick={() => toPage("deposit")}>{tt("deposit", "Deposit")}</button>
              <button type="button" onClick={() => toPage("withdraw")}>{tt("withdraw", "Withdraw")}</button>
              <button type="button" onClick={() => toPage("changemoney")}>{tt("transfer", "Transfer")}</button>
              <button type="button" onClick={() => toPage("exchangeb")}>{tt("exchange", "Exchange")}</button>
            </div>
          </div>

          <div className="cx-as-bar">
            <span>{tt("coins", "Coins")}</span>
            <label>
              <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} />
              {tt("hideZero", "Hide zero balances")}
            </label>
          </div>

          <div className="cx-as-list">
            {rows.length === 0 && <div className="cx-as-none">{tt("norec", "No records")}</div>}
            {rows.map((r) => (
              <div key={r.c} className="cx-as-c">
                <div className="cx-as-h">
                  <Coin s={r.c} size={34} />
                  <b>{r.c}<i>/USDT</i></b>
                  <em style={{ color: r.usd > 0 ? CUP : "#8a94a6" }}>≈ {fmtUsd(r.usd)}</em>
                </div>
                <div className="cx-as-g">
                  <span><small>{tt("avail", "Available")}</small>{fmtAmt(r.a)}</span>
                  <span><small>{tt("frozen", "Frozen")}</small>{fmtAmt(r.f)}</span>
                  <span><small>{tt("total", "Total")}</small>{fmtAmt(r.a + r.f)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
