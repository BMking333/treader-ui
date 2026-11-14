import React, { useEffect, useRef, useState } from "react";
import { useT, api, fmt, fmtV, Ic, ICON, COINS, Coin, QTY, SECS, YIELD, CUP, CDN } from "./Home";

/* =====================================================================
   src/pages/options.jsx — Options (second contract) trading page
   Props: P (prices), W (wallet), sym, setSym, pos, orders
   Mobile: Quantity / Time / Buy Long / Sell Short bar sits ABOVE the
           bottom navigation bar
   PC (>=900px): chart on the left, trade panel on the right
   Chart: custom canvas candlestick chart (Binance public klines), no logo
   ===================================================================== */

/* ====== Change these if they don't match your backend ====== */
const OPEN_PATH = "/options/open"; /* POST {sym, direction, qty, seconds} */
const DIR = { long: "long", short: "short" }; /* direction values */
const MIN_Q = 10, MAX_Q = 1000000;

const isLong = (d) => /long|up|buy|call|rise/i.test(String(d));

/* ---------------- Custom candlestick chart ---------------- */
const IVS = [["1m", "1m"], ["5m", "5m"], ["15m", "15m"], ["1h", "1h"], ["4h", "4h"], ["1d", "1D"]];
const KLINE = "https://api.binance.com/api/v3/klines";

const fp = (v) => (v >= 100 ? v.toFixed(2) : v >= 1 ? v.toFixed(4) : v.toFixed(6));

function Chart({ sym }) {
  const wrap = useRef(null);
  const cv = useRef(null);
  const [iv, setIv] = useState("15m");
  const [data, setData] = useState([]);
  const [err, setErr] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  /* fetch candles (poll every 4s) */
  useEffect(() => {
    let dead = false, timer;
    const pull = async () => {
      try {
        const r = await fetch(KLINE + "?symbol=" + sym + "USDT&interval=" + iv + "&limit=120");
        const j = await r.json();
        if (dead) return;
        if (!Array.isArray(j)) throw new Error("bad");
        setData(j.map((k) => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] })));
        setErr(false);
      } catch (e) {
        if (!dead) setErr(true);
      }
      if (!dead) timer = setTimeout(pull, 4000);
    };
    setData([]);
    pull();
    return () => { dead = true; clearTimeout(timer); };
  }, [sym, iv]);

  /* track container size */
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const upd = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    upd();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", upd);
      return () => window.removeEventListener("resize", upd);
    }
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* draw */
  useEffect(() => {
    const c = cv.current;
    const { w, h } = size;
    if (!c || !w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const n = data.length;
    if (!n) return;

    const R = 62, B = 20, T = 8;
    const pw = w - R, ph = h - B - T;
    const volH = ph * 0.18;
    const cH = ph - volH - 6;

    let hi = -Infinity, lo = Infinity, vmax = 0;
    data.forEach((d) => { if (d.h > hi) hi = d.h; if (d.l < lo) lo = d.l; if (d.v > vmax) vmax = d.v; });
    const pad = (hi - lo) * 0.06 || hi * 0.001;
    const top = hi + pad, bot = lo - pad;
    const y = (v) => T + ((top - v) / (top - bot)) * cH;

    ctx.font = "11px sans-serif";
    ctx.textBaseline = "middle";

    /* grid + price axis */
    ctx.strokeStyle = "#1d2d42";
    ctx.fillStyle = "#9fb0c3";
    ctx.lineWidth = 1;
    ctx.textAlign = "left";
    for (let i = 0; i <= 5; i++) {
      const v = top - ((top - bot) * i) / 5;
      const yy = Math.round(y(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(pw, yy); ctx.stroke();
      ctx.fillText(fp(v), pw + 6, yy);
    }

    /* volume */
    const cw = pw / n;
    const bw = Math.max(1, cw * 0.65);
    data.forEach((d, i) => {
      const x = i * cw + cw / 2;
      const upc = d.c >= d.o;
      const vh = vmax ? (d.v / vmax) * volH : 0;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = upc ? CUP : CDN;
      ctx.fillRect(x - bw / 2, T + ph - vh, bw, vh);
      ctx.globalAlpha = 1;
    });

    /* candles */
    data.forEach((d, i) => {
      const x = i * cw + cw / 2;
      const upc = d.c >= d.o;
      const colr = upc ? CUP : CDN;
      ctx.strokeStyle = colr;
      ctx.fillStyle = colr;
      ctx.beginPath(); ctx.moveTo(x, y(d.h)); ctx.lineTo(x, y(d.l)); ctx.stroke();
      const yo = y(d.o), yc = y(d.c);
      ctx.fillRect(x - bw / 2, Math.min(yo, yc), bw, Math.max(1, Math.abs(yc - yo)));
    });

    /* MA20 */
    ctx.strokeStyle = "#f0b90b";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    let started = false;
    for (let i = 19; i < n; i++) {
      let s = 0;
      for (let k = i - 19; k <= i; k++) s += data[k].c;
      const x = i * cw + cw / 2, yy = y(s / 20);
      if (!started) { ctx.moveTo(x, yy); started = true; } else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    ctx.lineWidth = 1;

    /* last price line + label */
    const last = data[n - 1];
    const ly = Math.round(y(last.c)) + 0.5;
    const lc = last.c >= last.o ? CUP : CDN;
    ctx.strokeStyle = lc;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(pw, ly); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = lc;
    ctx.fillRect(pw, ly - 9, R, 18);
    ctx.fillStyle = "#fff";
    ctx.fillText(fp(last.c), pw + 6, ly);

    /* time labels */
    ctx.fillStyle = "#9fb0c3";
    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(n / 5));
    for (let i = step; i < n; i += step) {
      const dt = new Date(data[i].t);
      const p2 = (v) => String(v).padStart(2, "0");
      const lb = iv === "1d" ? p2(dt.getMonth() + 1) + "/" + p2(dt.getDate()) : p2(dt.getHours()) + ":" + p2(dt.getMinutes());
      ctx.fillText(lb, i * cw + cw / 2, h - B / 2);
    }
  }, [data, size, iv]);

  return (
    <div className="cx-op-chartbox">
      <div className="cx-op-ivs">
        {IVS.map(([k, l]) => (
          <button key={k} type="button" className={k === iv ? "on" : ""} onClick={() => setIv(k)}>{l}</button>
        ))}
      </div>
      <div className="cx-op-cv" ref={wrap}>
        <canvas ref={cv} style={{ width: "100%", height: "100%", display: "block" }} />
        {err && !data.length && <div className="cx-op-cvmsg">Chart unavailable</div>}
        {!err && !data.length && <div className="cx-op-cvmsg">...</div>}
      </div>
    </div>
  );
}

/* ---------------- Bottom sheet ---------------- */
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
/* Height of the bottom navigation bar (Home / Market / Trade / Options / Assets).
   Change this value if your nav is taller or shorter. */
.cx-op{--cx-nav-h:76px;--cx-bar-h:64px}

.cx-op{background:#0b1520;color:#fff;display:flex;flex-direction:column;height:100vh;box-sizing:border-box;padding-bottom:calc(var(--cx-bar-h) + var(--cx-nav-h) + env(safe-area-inset-bottom,0px))}
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

/* Custom chart */
.cx-op-chartbox{position:absolute;inset:0;display:flex;flex-direction:column;background:#0b1520}
.cx-op-ivs{display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid #1d2d42;flex:none}
.cx-op-ivs button{height:26px;padding:0 10px;border-radius:6px;border:0;background:none;font-size:12px;cursor:pointer;color:#9fb0c3!important}
.cx-op-ivs button.on{background:#17304f;color:#8fc4ff!important}
.cx-op-cv{flex:1;min-height:0;position:relative}
.cx-op-cv canvas{position:absolute;inset:0}
.cx-op-cvmsg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;color:#9fb0c3;pointer-events:none}

/* Trade bar: fixed ABOVE the bottom navigation */
.cx-op-bar{position:fixed;left:0;right:0;bottom:calc(var(--cx-nav-h) + env(safe-area-inset-bottom,0px));z-index:60;display:grid;grid-template-columns:1fr 1fr 1.2fr 1.2fr;gap:10px;align-items:center;padding:6px 12px;height:var(--cx-bar-h);background:#0f2030;border-top:1px solid #3a4b5e}
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

@media(min-width:900px){
.cx-op{height:auto;min-height:100vh;padding-bottom:70px}
.cx-op-body{flex-direction:row;height:calc(100vh - 46px - 70px - 70px)}
.cx-op-chart{min-height:520px}
.cx-op-bar{position:static;bottom:auto;z-index:auto;display:flex;flex-direction:column;align-items:stretch;gap:12px;width:340px;flex:none;height:auto;padding:16px;border-top:0;border-left:1px solid #3a4b5e}
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

      {/* ---- Header ---- */}
      <div className="cx-op-top">
        <button type="button" className="cx-op-pair" onClick={() => setSh("coin")}>
          <Ic d={ICON.menu} s={22} />{sym}/USDT
        </button>
        <button type="button" onClick={() => setPanel(true)}>
          {t("pos")} <Ic d={ICON.doc} s={22} />
        </button>
      </div>

      {/* ---- Price + High / Low / Volume ---- */}
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

      {/* ---- Chart + trade bar ---- */}
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

      {/* ---- Quantity sheet ---- */}
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

      {/* ---- Time sheet ---- */}
      <Sheet open={sh === "time"} onClose={() => setSh("")} title={t("time")}>
        <div className="cx-op-grid">
          {SECS.map((s) => (
            <button key={s} type="button" className={"cx-op-opt" + (s === secs ? " on" : "")} onClick={() => { setSecs(s); setSh(""); }}>{s}s</button>
          ))}
        </div>
      </Sheet>

      {/* ---- Coin picker ---- */}
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
