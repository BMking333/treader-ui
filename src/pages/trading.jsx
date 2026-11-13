import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BLUE, GREEN, RED, CUP, CDN, COINS, MARKETS, QTY, SECS, YIELD, ASSET_COINS, TOPUP,
  useT, fmt, fmtV, api, Ic, ICON, Coin, List,
} from "./Home";

/* =====================================================================
   src/pages/trading.jsx — Market, Exchange (spot), Chart, Options, Assets
   ===================================================================== */

function CoinDrawer({ P, onPick, onClose }) {
  const t = useT();
  return (
    <div className="cx-over" onClick={onClose}>
      <div className="cx-drawer" onClick={(e) => e.stopPropagation()}>
        <h2>{t("spot")}</h2><h3>USDT</h3>
        {COINS.map((s) => (
          <button key={s} onClick={() => onPick(s)}>
            <span className="cx-dn"><Coin s={s} size={30} /><b>{s}<small>/USDT</small></b></span>
            <span style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{fmt(P[s].price)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Market ---- */
export function Market({ P, go }) {
  const t = useT();
  const [m, setM] = useState("USDT"), [sub, setSub] = useState("All");
  return (
    <>
      <div className="cx-top"><button onClick={() => go("home")}>‹</button><h1>{t("market")}</h1><span /></div>
      <div className="cx-tabs">{MARKETS.map((x) => <button key={x} className={m === x ? "on" : ""} onClick={() => setM(x)}>{x}</button>)}</div>
      <div className="cx-tabs two">{["All", "NFT"].map((x) => <button key={x} className={sub === x ? "on" : ""} onClick={() => setSub(x)}>{x === "All" ? t("all") : x}</button>)}</div>
      {m === "USDT" && sub === "All" ? <List P={P} go={go} names /> : <div className="cx-empty">{t("nodata")}</div>}
    </>
  );
}

/* ---- Exchange (spot) → POST /spot/order, GET /spot/orders ---- */
export function Exchange({ P, W, sym, setSym, go, spot }) {
  const t = useT();
  const [side, setSide] = useState("buy"), [price, setPrice] = useState(""), [q, setQ] = useState(""), [amt, setAmt] = useState("");
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [pick, setPick] = useState(false);
  const d = P[sym];
  const book = useMemo(() => {
    const mk = (k) => Array.from({ length: 5 }, (_, i) => [d.price * (1 + k * 0.0004 * (i + 1)), Math.random() * 1.2 + 0.001]);
    return { a: mk(1).reverse(), b: mk(-1) };
  }, [Math.round(d.price)]); // eslint-disable-line
  const usdt = W.w.USDT || 0, held = W.w[sym] || 0;
  const px = parseFloat(price) || d.price;
  const est = side === "buy" ? (parseFloat(amt) || 0) / px : (parseFloat(q) || 0);
  const pct = (p) => { if (side === "buy") setAmt(String(+(usdt * p).toFixed(2))); else setQ(String(+(held * p).toFixed(8))); };
  const submit = async () => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    setMsg("");
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
      setAmt(""); setQ(""); setMsg(t("ok"));
    } catch (e) { setMsg(t(e.message)); }
    setBusy(false);
  };
  const R = ({ r, c }) => (<div className="cx-bk"><b style={{ color: c }}>{r[0].toFixed(6)}</b><span>{r[1].toFixed(6)}</span></div>);
  return (
    <>
      <div className="cx-top">
        <button onClick={() => setPick(true)}><Ic d={ICON.menu} s={26} /></button>
        <h1 style={{ textAlign: "start", display: "flex", alignItems: "center", gap: 8 }}><Coin s={sym} size={28} />{sym}/USDT <small style={{ color: d.chg >= 0 ? GREEN : RED }}>{d.chg.toFixed(2)} %</small></h1>
        <button onClick={() => go("options")}><Ic d={ICON.market} s={26} /></button>
      </div>
      <div className="cx-ex">
        <div className="cx-book">
          <div className="cx-bh"><span>{t("price")}</span><span>{t("qty")}</span></div>
          {book.a.map((r, i) => <R key={"a" + i} r={r} c={RED} />)}
          <div className="cx-mid" style={{ color: d.chg >= 0 ? GREEN : RED }}>{fmt(d.price)}<small>≈ {d.price.toFixed(2)}</small></div>
          {book.b.map((r, i) => <R key={"b" + i} r={r} c={GREEN} />)}
        </div>
        <div className="cx-form">
          <div className="cx-bs">
            <button className={"bb" + (side === "buy" ? " on" : "")} onClick={() => setSide("buy")}>{t("buy")}</button>
            <button className={"sb" + (side === "sell" ? " on" : "")} onClick={() => setSide("sell")}>{t("sell")}</button>
          </div>
          <div className="cx-sel">{t("limit")} ⌄</div>
          <div className="cx-in"><input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t("price")} inputMode="decimal" /><button onClick={() => setPrice(fmt(px * 1.001))}>+</button><button onClick={() => setPrice(fmt(px * 0.999))}>−</button></div>
          <small>≈ {fmt(px)}</small>
          <div className="cx-in"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("qty")} inputMode="decimal" /><b>{sym}</b></div>
          <small>{t("avail")} {side === "buy" ? usdt.toFixed(8) + " USDT" : held.toFixed(8) + " " + sym}<br />{side === "buy" ? t("buy") : t("sell")} {est ? est.toFixed(6) : "0"} {sym}</small>
          <div className="cx-pc">{[0.25, 0.5, 0.75, 1].map((p) => <button key={p} onClick={() => pct(p)}>{p * 100}%</button>)}</div>
          <div className="cx-in"><input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={t("amt")} inputMode="decimal" /><b>USDT</b></div>
          {msg && <p className="cx-msg">{msg}</p>}
          <button className="cx-cta" style={{ background: side === "buy" ? GREEN : RED, opacity: busy ? 0.6 : 1 }} onClick={submit}>{busy ? t("wait2") : (side === "buy" ? t("buy") : t("sell")) + " " + sym}</button>
        </div>
      </div>
      <div className="cx-ent"><span>{t("entrust")} <b style={{ color: BLUE }}>{t("buy")} ⌄</b></span><span>{t("all")}</span></div>
      {spot.length ? spot.slice(0, 30).map((o) => (
        <div key={o.id} className="cx-tx">
          <span><b style={{ color: o.side === "buy" ? CUP : CDN }}>{o.side === "buy" ? t("buy") : t("sell")} {o.sym}/USDT</b><small>{fmt(o.price || 0)} · {(o.qty || 0).toFixed(6)} · {new Date(o.created_at).toLocaleString()}</small></span>
          <span>{(o.amount || 0).toFixed(2)} USDT</span>
        </div>
      )) : <div className="cx-empty" style={{ height: 120 }} />}
      {pick && <CoinDrawer P={P} onClose={() => setPick(false)} onPick={(s) => { setSym(s); setPick(false); }} />}
    </>
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

/* ---- Options → POST /options/open ---- */
export function Options({ P, W, sym, setSym, pos, orders }) {
  const t = useT();
  const [qty, setQty] = useState(10), [sec, setSec] = useState(20), [sheet, setSheet] = useState(false), [, tick] = useState(0);
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [view, setView] = useState("k"), [ptab, setPtab] = useState("list"), [pick, setPick] = useState(false);
  const d = P[sym];
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(id); }, []);
  const open = async (dir) => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    setMsg("");
    const bal = W.w.USDT || 0;
    if (qty < 10 || qty > 1000000) return setMsg(t("badQ"));
    if (qty > bal) return setMsg(t("iB"));
    setBusy(true);
    try {
      await api("/options/open", { method: "POST", body: { sym, direction: dir, qty, sec } });
      await W.reload();
      setSheet(false); setMsg(t("openMsg"));
    } catch (e) { setMsg(t(e.message)); }
    setBusy(false);
  };
  return (
    <>
      <div className="cx-top">
        <button onClick={() => setPick(true)}><Ic d={ICON.menu} s={26} /></button>
        <h1 style={{ textAlign: "start" }}>{sym}/USDT</h1>
        <button className="cx-link" onClick={() => setView(view === "k" ? "p" : "k")}>{view === "k" ? t("pos") : t("kl")} <Ic d={view === "k" ? ICON.doc : ICON.candle} s={22} /></button>
      </div>
      {view === "k" ? (
        <>
          <div className="cx-opt-h">
            <b style={{ color: d.chg >= 0 ? GREEN : RED }}>{d.price.toFixed(6)}<small>{d.chg.toFixed(2)} %</small></b>
            <div><span>{t("hi")}</span><i>{fmt(d.hi)}</i><span>{t("lo")}</span><i>{fmt(d.lo)}</i><span>{t("vol")}</span><i>{d.vol.toFixed(2)}</i></div>
          </div>
          <Chart sym={sym} price={d.price} />
          {msg && <p className="cx-msg">{msg}</p>}
          <div style={{ height: 110 }} />
          <div className="cx-obar">
            <button onClick={() => setSheet(true)}>{t("qty")} ⌄<b>{qty.toFixed(2)}</b></button>
            <button onClick={() => setSheet(true)}>{t("time")} ⌄<b>{sec}s</b></button>
            <button className="g" style={{ opacity: busy ? 0.6 : 1 }} onClick={() => open("long")}>{t("bl")}</button>
            <button className="r" style={{ opacity: busy ? 0.6 : 1 }} onClick={() => open("short")}>{t("ss")}</button>
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
            const win = p.dir === "long" ? c > p.open : c < p.open;
            return (
              <div key={p.id} className="cx-tbl">
                <span><Coin s={p.sym} size={18} /> {p.qty}<small>{p.sym} · {p.dir === "long" ? t("bl") : t("ss")} · {Math.max(0, Math.ceil((p.end - Date.now()) / 1000))}s</small></span>
                <span>{fmt(p.open)}</span><span>{fmt(c)}</span>
                <span style={{ color: win ? CUP : CDN }}>{win ? "+" : "-"}{(win ? p.qty * YIELD : p.qty).toFixed(2)}</span>
              </div>
            );
          })}
          {ptab === "rec" && orders.map((o) => (
            <div key={o.id} className="cx-tbl">
              <span><Coin s={o.sym} size={18} /> {o.qty}<small>{o.sym} · {o.dir === "long" ? t("bl") : t("ss")}</small></span>
              <span>{fmt(o.open)}</span><span>{fmt(o.close)}</span>
              <span style={{ color: o.pnl >= 0 ? CUP : CDN }}>{o.pnl >= 0 ? "+" : ""}{o.pnl.toFixed(2)}</span>
            </div>
          ))}
          {((ptab === "list" && !pos.length) || (ptab === "rec" && !orders.length)) && (
            <div className="cx-norec">
              <svg width="150" height="120" viewBox="0 0 150 120"><rect x="38" y="20" width="74" height="70" rx="4" fill="#eceef2" /><rect x="46" y="28" width="58" height="44" fill="#fff" /><rect x="54" y="38" width="42" height="5" fill="#e0e2e8" /><rect x="54" y="49" width="42" height="5" fill="#e0e2e8" /><rect x="54" y="60" width="42" height="5" fill="#e0e2e8" /><rect x="34" y="72" width="82" height="22" rx="3" fill="#e3e5ea" /><rect x="62" y="81" width="26" height="4" rx="2" fill="#fff" /></svg>
              <p>{t("norec")}</p>
            </div>
          )}
        </>
      )}
      {sheet && (
        <div className="cx-over end" onClick={() => setSheet(false)}>
          <div className="cx-sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t("mode")}</h4><div className="cx-chs"><button className="on">USDT</button></div>
            <h4>{t("oq")}</h4>
            <div className="cx-chs">{QTY.map((x) => <button key={x} className={qty === x ? "on" : ""} onClick={() => setQty(x)}>{x.toFixed(2)}</button>)}</div>
            <div className="cx-line"><input value={qty} inputMode="decimal" onChange={(e) => setQty(parseFloat(e.target.value) || 0)} /><button onClick={() => setQty(Math.floor(W.w.USDT || 0))}>{t("all")}</button></div>
            <h4>{t("ot")}</h4>
            <div className="cx-chs">{SECS.map((x) => <button key={x} className={sec === x ? "on" : ""} onClick={() => setSec(x)}>{x}s</button>)}</div>
            <div className="cx-info"><span>{t("bal")} : {(W.w.USDT || 0).toFixed(8)}</span><span>{t("yld")} : {YIELD * 100}%</span></div>
            <div className="cx-info"><span>{t("oq")} : 10.00 - 1000000.00</span></div>
            {msg && <p className="cx-msg" style={{ margin: "0 0 10px" }}>{msg}</p>}
            <div className="cx-two"><button className="g" onClick={() => open("long")}>{t("bl")}</button><button className="r" onClick={() => open("short")}>{t("ss")}</button></div>
          </div>
        </div>
      )}
      {pick && <CoinDrawer P={P} onClose={() => setPick(false)} onPick={(s) => { setSym(s); setPick(false); }} />}
    </>
  );
}

/* ---- Assets (GET /wallet/total, POST /wallet/demo-topup) ---- */
export function Assets({ P, W }) {
  const t = useT();
  const [tab, setTab] = useState("assets"), [hide, setHide] = useState(false), [note, setNote] = useState({ k: "", ok: true }), [busy, setBusy] = useState(false);
  const val = (s, q) => (s === "USDT" || s === "USDC" ? q : q * (P[s]?.price || 0));
  const calc = Object.entries(W.w).reduce((x, [s, q]) => x + val(s, q), 0);
  const total = typeof W.total === "number" ? W.total : calc;
  const sub = tab === "assets" ? null : tab;
  const tabs = [["assets", t("assets")], ["funds", t("funds")], ["options", t("options")], ["quant", t("quant")]];
  const sec = [["ta", total], ["funds", total], ["options", 0], ["quant", 0]];
  const title = (k) => (k === "ta" ? t("ta") : t(k));
  const topup = async () => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    setBusy(true); setNote({ k: "wait2", ok: true });
    try {
      await api("/wallet/demo-topup", { method: "POST", body: { amount: TOPUP } });
      await W.reload();
      setNote({ k: "topOk", ok: true });
    } catch (e) { setNote({ k: e.message, ok: false }); }
    setBusy(false);
  };
  return (
    <>
      <div className="cx-tabs big">{tabs.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <button className="cx-a1" style={{ opacity: busy ? 0.6 : 1, marginBottom: 6 }} onClick={topup}>{t("topup")}</button>
      {note.k && <p className={"cx-msg" + (note.ok ? "" : " bad")}>{t(note.k)}</p>}
      {!sub ? (
        <div className="cx-cards">{sec.map(([k, v]) => (<div key={k} className="cx-ac"><h3>{title(k)} {t("conv")}</h3><small>{t("avail")}</small><b>{v.toFixed(2)}</b></div>))}</div>
      ) : (
        <>
          <div className="cx-sum">
            <div><h2>{title(sub)} {t("conv")}</h2><span>{t("ta")}</span><small>{t("cv")}</small></div>
            <button onClick={() => setHide(!hide)}><Ic d={ICON.eye} s={26} /></button>
            <b>$ {hide ? "••••••" : (sub === "funds" ? total : 0).toFixed(8)}</b><small>≈ $ {(sub === "funds" ? total : 0).toFixed(2)}</small>
          </div>
          <div className="cx-cards gray">
            {ASSET_COINS.map((s) => {
              const q = sub === "funds" ? W.w[s] || 0 : 0;
              const fz = sub === "funds" ? W.fz[s] || 0 : 0;
              return (
                <div key={s} className="cx-ac wide">
                  <h3><span className="cx-dn"><Coin s={s} size={30} />{s}</span> <i>›</i></h3>
                  <div className="cx-3"><span><small>{t("avail")}</small>{q.toFixed(8)}</span><span><small>{t("frozen")}</small>{fz.toFixed(8)}</span><span><small>{t("cv")}</small>$ {val(s, q).toFixed(2)}</span></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
