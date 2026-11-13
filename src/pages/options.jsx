import React, { useEffect, useRef, useState } from "react";
import { useT, api, fmt, fmtV, Ic, ICON, COINS, Coin, QTY, SECS, YIELD, CUP, CDN } from "./Home";

/* =====================================================================
   src/pages/options.jsx — Options (সেকেন্ড কন্ট্রাক্ট) ট্রেডিং পেজ
   Props: P (prices), W (wallet), sym, setSym, pos, orders
   Mobile: নিচে Quantity / Time / Buy Long / Sell Short বার
   PC (≥900px): বামে চার্ট, ডানে ট্রেড প্যানেল
   ===================================================================== */

/* ====== ব্যাকএন্ডে মিল না থাকলে এখানে বদলান ====== */
const OPEN_PATH = "/options/open"; /* POST {sym, direction, qty, seconds} */
const DIR = { long: "long", short: "short" }; /* direction-এর মান */
const MIN_Q = 10, MAX_Q = 1000000;

const isLong = (d) => /long|up|buy|call|rise/i.test(String(d));

/* ---------------- TradingView চার্ট ---------------- */
let tvP = null;
const loadTV = () => {
  if (typeof window === "undefined") return Promise.reject();
  if (window.TradingView) return Promise.resolve();
  if (tvP) return tvP;
  tvP = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/tv.js";
    s.onload = res;
    s.onerror = () => { tvP = null; rej(); };
    document.head.appendChild(s);
  });
  return tvP;
};

function Chart({ sym }) {
  const id = useRef("cx-tv-" + Math.random().toString(36).slice(2, 8)).current;
  useEffect(() => {
    let dead = false;
    loadTV().then(() => {
      if (dead || !window.TradingView) return;
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
      new window.TradingView.widget({
        autosize: true,
        symbol: "BINANCE:" + sym + "USDT",
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0b1520",
        backgroundColor: "#0b1520",
        enable_publishing: false,
        hide_side_toolbar: true,
        allow_symbol_change: false,
        studies: ["MASimple@tv-basicstudies", "Volume@tv-basicstudies"],
        container_id: id,
      });
    }).catch(() => {});
    return () => { dead = true; };
  }, [sym, id]);
  return <div id={id} className="cx-op-tv" />;
}

/* ---------------- নিচ থেকে ওঠা শিট ---------------- */
function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="cx-op-ov" onClick={onClose}>
      <div className="cx-op-sh" onClick={(e) => e.stopPropagation()}>
        <div className="cx-op-sh-h"><b>{title}</b><button type="button" onClick={onClose} aria-label="close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

const CSS = `
.cx-op{background:#0b1520;color:#fff;display:flex;flex-direction:column;height:100vh;box-sizing:border-box;padding-bottom:114px}
.cx-op,.cx-op *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
.cx-op button{color:inherit}
.cx-op-top{display:flex;align-items:center;justify-content:space-between;height:46px;padding:0 14px;background:#0f2030;border-bottom:1px solid #3a4b5e;flex:none}
.cx-op-top button{display:flex;align-items:center;gap:8px;font-size:14px;background:none;border:0;cursor:pointer}
.cx-op-pair{font-size:17px!important;font-weight:700}
.cx-op-info{display:grid;grid-template-columns:1.1fr 1fr;gap:8px;padding:12px 14px;background:#0f2030;border-bottom:1px solid #3a4b5e;flex:none}
.cx-op-pr b{display:block;font-size:24px;font-weight:600;line-height:1.2}
.cx-op-pr span{font-size:13px}
.cx-op-st{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:13px;align-content:center}
.cx-op-st i{font-style:normal;color:#9fb0c3}
.cx-op-st b{text-align:right;font-weight:400;overflow-wrap:anywhere}
.cx-op-body{flex:1;min-height:0;display:flex;flex-direction:column}
.cx-op-chart{flex:1;min-height:300px;position:relative}
.cx-op-tv{position:absolute;inset:0}
.cx-op-bar{position:fixed;left:0;right:0;bottom:0;z-index:60;display:grid;grid-template-columns:1fr 1fr 1.2fr 1.2fr;gap:10px;align-items:center;padding:6px 12px;height:64px;background:#0f2030;border-top:1px solid #3a4b5e}
.cx-op-pick{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;background:none;border:0;cursor:pointer;line-height:1.4}
.cx-op-pick span{font-size:14px}
.cx-op-go{height:44px;border-radius:8px;border:0;font-size:14px;cursor:pointer;color:#fff!important}
.cx-op-go.up{background:#00c087}
.cx-op-go.dn{background:#d84d5a}
.cx-op-go:disabled{opacity:.6}
.cx-op-yl{display:none}
.cx-op-toast{position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:200;max-width:90%;padding:10px 16px;border-radius:8px;font-size:14px;background:#17304f;color:#8fc4ff;box-shadow:0 4px 16px rgba(0,0,0,.4)}
.cx-op-toast.bad{background:#3b1a20;color:#ff8a95}
.cx-op-toast.ok{background:#0f3a2c;color:#4be0a8}
.cx-op-ov{position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}
.cx-op-sh{width:100%;max-width:520px;max-height:80vh;overflow:auto;background:#0f2030;border-radius:14px 14px 0 0;padding:14px 16px 20px}
.cx-op-sh-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:16px}
.cx-op-sh-h button{background:none;border:0;font-size:18px;cursor:pointer}
.cx-op-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cx-op-opt{height:44px;border-radius:8px;border:1px solid #2a3a50;background:#101c2d;font-size:14px;cursor:pointer}
.cx-op-opt.on{border-color:#1a82d6;background:#17304f;color:#8fc4ff}
.cx-op-inp{width:100%;height:44px;margin-top:12px;padding:0 12px;border-radius:8px;border:1px solid #2a3a50;background:#101c2d;color:#fff;font-size:14px;outline:0}
.cx-op-ok{display:block;width:100%;height:44px;margin-top:12px;border-radius:8px;border:0;background:#1a82d6;color:#fff!important;font-size:14px;cursor:pointer}
.cx-op-hint{margin-top:8px;font-size:12px;color:#9fb0c3}
.cx-op-coin{display:flex;align-items:center;gap:10px;width:100%;padding:10px 4px;border:0;border-bottom:1px solid #1d2d42;background:none;font-size:15px;cursor:pointer;text-align:start}
.cx-op-coin.on{color:#8fc4ff}
.cx-op-coin small{margin-inline-start:auto;font-size:13px}
.cx-op-pn{position:fixed;inset:0;z-index:150;background:#0b1520;display:flex;flex-direction:column}
.cx-op-tabs{display:flex;border-bottom:1px solid #3a4b5e;background:#0f2030;flex:none}
.cx-op-tabs button{flex:1;height:44px;background:none;border:0;border-bottom:2px solid transparent;font-size:14px;cursor:pointer;color:#9fb0c3!important}
.cx-op-tabs button.on{color:#fff!important;border-bottom-color:#1a82d6}
.cx-op-list{flex:1;overflow:auto;padding:12px 14px}
.cx-op-card{background:#101c2d;border:1px solid #2a3a50;border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:13px}
.cx-op-card .h{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;font-size:15px}
.cx-op-card .r{display:flex;justify-content:space-between;padding:2px 0}
.cx-op-card .r i{font-style:normal;color:#9fb0c3}
.cx-op-tag{padding:2px 8px;border-radius:4px;font-size:12px;color:#fff}
.cx-op-none{text-align:center;color:#9fb0c3;padding:40px 0;font-size:14px}
@media(max-width:899px){
.cx-nav{bottom:64px!important}
}
@media(min-width:900px){
.cx-op{height:auto;min-height:100vh;padding-bottom:70px}
.cx-op-body{flex-direction:row;height:calc(100vh - 46px - 70px - 70px)}
.cx-op-chart{min-height:520px}
.cx-op-bar{position:static;z-index:auto;display:flex;flex-direction:column;align-items:stretch;gap:12px;width:340px;flex:none;height:auto;padding:16px;border-top:0;border-left:1px solid #3a4b5e}
.cx-op-pick{flex-direction:row;justify-content:space-between;height:46px;padding:0 12px;border:1px solid #2a3a50;border-radius:8px;background:#101c2d}
.cx-op-yl{display:flex;justify-content:space-between;font-size:13px;color:#9fb0c3}
.cx-op-yl b{color:#4be0a8;font-weight:400}
.cx-op-ov{align-items:center}
.cx-op-sh{border-radius:14px}
.cx-op-pn{left:auto;width:420px;border-left:1px solid #3a4b5e}
}
`;

export default function Options({ P, W, sym, setSym, pos = [], orders = [] }) {
  const t = useT();
  const [qty, setQty] = useState(QTY[0]);
  const [secs, setSecs] = useState(SECS[0]);
  const [sh, setSh] = useState(""); /* "", "qty", "time", "coin" */
  const [panel, setPanel] = useState(false);
  const [tab, setTab] = useState("pos");
  const [qIn, setQIn] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", s: "bad" });
  const [now, setNow] = useState(Date.now());
  const tm = useRef(null);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => () => clearTimeout(tm.current), []);

  const flash = (k, s = "bad") => {
    setMsg({ k, s });
    clearTimeout(tm.current);
    tm.current = setTimeout(() => setMsg({ k: "", s: "bad" }), 3000);
  };

  const p = (P && P[sym]) || { price: 0, chg: 0, hi: 0, lo: 0, vol: 0 };
  const up = p.chg >= 0;
  const col = up ? CUP : CDN;

  const open = async (dir) => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    if (!(qty >= MIN_Q && qty <= MAX_Q)) return flash(t("badQ"));
    if ((W.w && W.w.USDT ? W.w.USDT : 0) < qty) return flash(t("iB"));
    setBusy(true);
    try {
      await api(OPEN_PATH, { method: "POST", body: { sym, direction: dir, qty, seconds: secs } });
      flash(t("openMsg"), "ok");
      await W.reload();
    } catch (e) {
      flash(t(e && e.message ? e.message : "err"));
    } finally {
      setBusy(false);
    }
  };

  const applyQty = () => {
    const v = parseFloat(qIn);
    if (!(v >= MIN_Q && v <= MAX_Q)) return flash(t("badQ"));
    setQty(v);
    setSh("");
  };

  const left = (end) => {
    const s = Math.max(0, Math.ceil((end - now) / 1000));
    return s + "s";
  };

  const myPos = pos;
  const myOrd = orders;

  return (
    <div className="cx-op">
      <style>{CSS}</style>

      {/* ---- হেডার ---- */}
      <div className="cx-op-top">
        <button type="button" className="cx-op-pair" onClick={() => setSh("coin")}>
          <Ic d={ICON.menu} s={22} />{sym}/USDT
        </button>
        <button type="button" onClick={() => setPanel(true)}>
          {t("pos")} <Ic d={ICON.doc} s={22} />
        </button>
      </div>

      {/* ---- দাম + High/Low/Volume ---- */}
      <div className="cx-op-info">
        <div className="cx-op-pr">
          <b style={{ color: col }}>{p.price ? p.price.toFixed(p.price >= 100 ? 6 : 8) : "--"}</b>
          <span style={{ color: col }}>{up ? "+" : ""}{(p.chg || 0).toFixed(2)} %</span>
        </div>
        <div className="cx-op-st">
          <i>{t("hi")}</i><b>{p.hi ? fmt(p.hi) : "--"}</b>
          <i>{t("lo")}</i><b>{p.lo ? fmt(p.lo) : "--"}</b>
          <i>{t("vol")}</i><b>{typeof p.vol === "number" ? fmtV(p.vol) : "--"}</b>
        </div>
      </div>

      {/* ---- চার্ট + ট্রেড বার ---- */}
      <div className="cx-op-body">
        <div className="cx-op-chart"><Chart sym={sym} /></div>

        <div className="cx-op-bar">
          <button type="button" className="cx-op-pick" onClick={() => { setQIn(String(qty)); setSh("qty"); }}>
            <span>{t("qty")} ⌄</span><span>{qty.toFixed(2)}</span>
          </button>
          <button type="button" className="cx-op-pick" onClick={() => setSh("time")}>
            <span>{t("time")} ⌄</span><span>{secs}s</span>
          </button>
          <div className="cx-op-yl">
            <span>{t("yld")}</span><b>+{(qty * YIELD).toFixed(2)} USDT</b>
          </div>
          <div className="cx-op-yl">
            <span>{t("bal")}</span><span>{(W.w && W.w.USDT ? W.w.USDT : 0).toFixed(2)} USDT</span>
          </div>
          <button type="button" className="cx-op-go up" disabled={busy} onClick={() => open(DIR.long)}>{t("bl")}</button>
          <button type="button" className="cx-op-go dn" disabled={busy} onClick={() => open(DIR.short)}>{t("ss")}</button>
        </div>
      </div>

      {msg.k && <div className={"cx-op-toast " + msg.s}>{msg.k}</div>}

      {/* ---- Quantity শিট ---- */}
      <Sheet open={sh === "qty"} onClose={() => setSh("")} title={t("oq")}>
        <div className="cx-op-grid">
          {QTY.map((q) => (
            <button key={q} type="button" className={"cx-op-opt" + (q === qty ? " on" : "")} onClick={() => { setQty(q); setSh(""); }}>{q}</button>
          ))}
        </div>
        <input className="cx-op-inp" type="number" inputMode="decimal" value={qIn} onChange={(e) => setQIn(e.target.value)} placeholder={MIN_Q + " - " + MAX_Q} />
        <div className="cx-op-hint">{t("badQ")}</div>
        <button type="button" className="cx-op-ok" onClick={applyQty}>OK</button>
      </Sheet>

      {/* ---- Time শিট ---- */}
      <Sheet open={sh === "time"} onClose={() => setSh("")} title={t("time")}>
        <div className="cx-op-grid">
          {SECS.map((s) => (
            <button key={s} type="button" className={"cx-op-opt" + (s === secs ? " on" : "")} onClick={() => { setSecs(s); setSh(""); }}>{s}s</button>
          ))}
        </div>
      </Sheet>

      {/* ---- কয়েন বাছাই ---- */}
      <Sheet open={sh === "coin"} onClose={() => setSh("")} title="BTC/USDT">
        {COINS.map((c) => {
          const pc = P && P[c] ? P[c] : null;
          return (
            <button key={c} type="button" className={"cx-op-coin" + (c === sym ? " on" : "")} onClick={() => { setSym(c); setSh(""); }}>
              <Coin s={c} size={28} />
              <b>{c}<small style={{ opacity: 0.6 }}>/USDT</small></b>
              {pc && <small style={{ color: pc.chg >= 0 ? CUP : CDN }}>{fmt(pc.price)}</small>}
            </button>
          );
        })}
      </Sheet>

      {/* ---- Positions / Order records ---- */}
      {panel && (
        <div className="cx-op-pn">
          <div className="cx-op-top">
            <button type="button" className="cx-op-pair" onClick={() => setPanel(false)}>‹ {t("pos")}</button>
            <span />
          </div>
          <div className="cx-op-tabs">
            <button type="button" className={tab === "pos" ? "on" : ""} onClick={() => setTab("pos")}>{t("pl")}</button>
            <button type="button" className={tab === "rec" ? "on" : ""} onClick={() => setTab("rec")}>{t("orec")}</button>
          </div>
          <div className="cx-op-list">
            {tab === "pos" && (myPos.length === 0
              ? <div className="cx-op-none">{t("norec")}</div>
              : myPos.map((x) => (
                <div key={x.id} className="cx-op-card">
                  <div className="h">
                    <b>{x.sym}/USDT</b>
                    <span className="cx-op-tag" style={{ background: isLong(x.dir) ? CUP : CDN }}>{isLong(x.dir) ? t("bl") : t("ss")}</span>
                  </div>
                  <div className="r"><i>{t("oq")}</i><span>{Number(x.qty).toFixed(2)}</span></div>
                  <div className="r"><i>{t("pp")}</i><span>{fmt(Number(x.open))}</span></div>
                  <div className="r"><i>{t("time")}</i><span>{left(x.end)}</span></div>
                </div>
              )))}
            {tab === "rec" && (myOrd.length === 0
              ? <div className="cx-op-none">{t("norec")}</div>
              : myOrd.map((x) => (
                <div key={x.id} className="cx-op-card">
                  <div className="h">
                    <b>{x.sym}/USDT</b>
                    <span className="cx-op-tag" style={{ background: isLong(x.dir) ? CUP : CDN }}>{isLong(x.dir) ? t("bl") : t("ss")}</span>
                  </div>
                  <div className="r"><i>{t("oq")}</i><span>{Number(x.qty).toFixed(2)}</span></div>
                  <div className="r"><i>{t("pp")}</i><span>{fmt(Number(x.open))}</span></div>
                  <div className="r"><i>{t("fp")}</i><span>{x.close != null ? fmt(Number(x.close)) : "--"}</span></div>
                  <div className="r"><i>{t("pnl")}</i><b style={{ color: x.pnl >= 0 ? CUP : CDN, fontWeight: 400 }}>{x.pnl > 0 ? "+" : ""}{Number(x.pnl).toFixed(2)}</b></div>
                </div>
              )))}
          </div>
        </div>
      )}
    </div>
  );
}
