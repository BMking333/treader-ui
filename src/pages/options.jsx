import React, { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";
import { useT, api, fmt, fmtV, Ic, ICON, COINS, Coin, YIELD, CUP, CDN } from "./Home";

const OPEN_PATH = "/options/open"; /* POST {sym, direction, qty, seconds} */
const STATUS_PATH = "/options/status"; /* GET -> {enabled, disabled_syms, yield, qty_min, qty_max, secs, blocked} */
const DIR = { long: "long", short: "short" };
const MIN_Q = 10, MAX_Q = 1000000; /* server থেকে না এলে ডিফল্ট */
/* অ্যামাউন্ট অপশন: শুধু এই ৪টি */
const QTY = [50, 100, 500, 1000];
/* সময় (সেকেন্ড): 30s, 5m, 10m, 30m, 1h, 1d — server থেকে "secs" এলে সেটাই ব্যবহার হয় */
const DEFAULT_SECS = [30, 300, 600, 1800, 3600, 86400];

const isLong = (d) => /long|up|buy|call|rise/i.test(String(d));
const fq = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

/* ---------------- Chart helpers ---------------- */
const TF = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];
const TF_LABEL = { "1d": "D", "1w": "W" };
const tfLabel = (tf) => TF_LABEL[tf] || tf;
const CHART_LIMIT = 500;

const UP = "#1fa67a";
const DOWN = "#e5101d";

/* চার্টের রঙ: লাইট / নাইট */
const THEME = {
  light: {
    bg: "#ffffff", text: "#5b6574", grid: "#f1f2f4", border: "#c9ced6",
    cross: "#8a94a6", sep: "#c9ced6", sepHover: "rgba(26,130,214,.2)",
  },
  dark: {
    bg: "#131a2a", text: "#aab3c5", grid: "#1e2a3f", border: "#2a3548",
    cross: "#8a93a6", sep: "#2a3548", sepHover: "rgba(74,163,240,.25)",
  },
};

/* status keys (start with "@") are translated at render time */
const ST_LIVE = "@live";
const ST_LOADING = "@loading";
const ST_RECONN = "@reconn";

const fmtP = (v) => {
  const n = Number(v);
  if (!isFinite(n)) return "--";
  return n >= 100 ? n.toFixed(2) : n >= 1 ? n.toFixed(4) : n.toFixed(8);
};

function calcSMA(data, period) {
  const out = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
    out.push({ time: data[i].time, value: sum / period });
  }
  return out;
}
function calcEMA(data, period) {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  let value = data.slice(0, period).reduce((a, x) => a + x.close, 0) / period;
  const out = [{ time: data[period - 1].time, value }];
  for (let i = period; i < data.length; i++) {
    value = data[i].close * k + value * (1 - k);
    out.push({ time: data[i].time, value });
  }
  return out;
}
function calcBollinger(data, period = 20, mult = 2) {
  const mid = [], upper = [], lower = [];
  for (let i = period - 1; i < data.length; i++) {
    const values = data.slice(i - period + 1, i + 1).map((x) => x.close);
    const avg = values.reduce((a, b) => a + b, 0) / period;
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / period;
    const sd = Math.sqrt(variance);
    mid.push({ time: data[i].time, value: avg });
    upper.push({ time: data[i].time, value: avg + mult * sd });
    lower.push({ time: data[i].time, value: avg - mult * sd });
  }
  return { mid, upper, lower };
}
function calcRSI(data, period = 14) {
  if (data.length <= period) return [];
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = data[i].close - data[i - 1].close;
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  const out = [{ time: data[period].time, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) }];
  for (let i = period + 1; i < data.length; i++) {
    const d = data[i].close - data[i - 1].close;
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    out.push({ time: data[i].time, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) });
  }
  return out;
}
function calcMACD(data) {
  const fast = calcEMA(data, 12), slow = calcEMA(data, 26);
  const slowMap = new Map(slow.map((x) => [x.time, x.value]));
  const line = fast.filter((x) => slowMap.has(x.time)).map((x) => ({ time: x.time, value: x.value - slowMap.get(x.time) }));
  if (!line.length) return { line: [], signal: [], hist: [] };
  const k = 2 / 10;
  let signalValue = line.slice(0, 9).reduce((a, x) => a + x.value, 0) / Math.min(9, line.length);
  const signal = [{ time: line[Math.min(8, line.length - 1)].time, value: signalValue }];
  for (let i = 9; i < line.length; i++) {
    signalValue = line[i].value * k + signalValue * (1 - k);
    signal.push({ time: line[i].time, value: signalValue });
  }
  const signalMap = new Map(signal.map((x) => [x.time, x.value]));
  const hist = line.filter((x) => signalMap.has(x.time)).map((x) => ({ time: x.time, value: x.value - signalMap.get(x.time), color: x.value >= signalMap.get(x.time) ? UP : DOWN }));
  return { line, signal, hist };
}

const IND_LIST = [["volume", "Volume"], ["ma", "MA (9)"], ["ema", "EMA (20)"], ["bb", "BOLL"], ["rsi", "RSI"], ["macd", "MACD"]];

/* ---------------- Independent market chart ---------------- */
function Chart({ sym, tt, dark }) {
  const hostRef = useRef(null);
  const [timeframe, setTimeframe] = useState("1d");
  const [chartType, setChartType] = useState("candle");
  const [indicators, setIndicators] = useState({ volume: true, ma: true, ema: false, bb: false, rsi: false, macd: false });
  const [status, setStatus] = useState("");
  const [menu, setMenu] = useState(""); /* "", "tf", "type", "ind" */
  const [legend, setLegend] = useState(null);

  const toggle = (key) => setIndicators((old) => ({ ...old, [key]: !old[key] }));

  /* translate status keys at render time */
  const statusText =
    status === ST_LIVE ? tt("live", "Live")
    : status === ST_LOADING ? tt("loading", "Loading...")
    : status === ST_RECONN ? tt("reconn", "Reconnecting...")
    : status;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let alive = true;
    let socket = null;
    let retryTimer = null;
    let candles = [];
    let idxMap = new Map();
    let maMap = new Map();
    let hover = false;
    const th = dark ? THEME.dark : THEME.light;
    const cleanSymbol = String(sym || "BTC").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const pair = cleanSymbol.endsWith("USDT") ? cleanSymbol : cleanSymbol + "USDT";
    const interval = timeframe;
    const supported = /^[A-Z0-9]{5,20}$/.test(pair);
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches;

    const chart = createChart(host, {
      autoSize: true,
      layout: {
        background: { type: "solid", color: th.bg },
        textColor: th.text,
        fontFamily: "Inter, Arial, sans-serif",
        attributionLogo: false,
        panes: { separatorColor: th.sep, separatorHoverColor: th.sepHover, enableResize: true },
      },
      grid: { vertLines: { color: th.grid }, horzLines: { color: th.grid } },
      crosshair: { mode: 0, vertLine: { color: th.cross, width: 1, style: 2 }, horzLine: { color: th.cross, width: 1, style: 2 } },
      rightPriceScale: {
        borderColor: th.border,
        scaleMargins: { top: 0.14, bottom: 0.06 },
        minimumWidth: isMobile ? 70 : 80,
      },
      timeScale: {
        borderColor: th.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: isMobile ? 4 : 6,
        barSpacing: isMobile ? 12 : 10,
        minBarSpacing: 3,
        lockVisibleTimeRangeOnResize: true,
      },
      localization: { locale: "en-US" },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    let nextPane = 1;
    const volPane = indicators.volume ? nextPane++ : 0;
    const rsiPane = indicators.rsi ? nextPane++ : 0;
    const macdPane = indicators.macd ? nextPane++ : 0;

    const candlesSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP, downColor: DOWN,
      borderUpColor: UP, borderDownColor: DOWN,
      wickUpColor: UP, wickDownColor: DOWN,
      borderVisible: true, wickVisible: true,
      priceLineVisible: true, priceLineStyle: 1, priceLineWidth: 1,
      lastValueVisible: true,
    });
    candlesSeries.applyOptions({ visible: chartType === "candle" });

    const closeLine = chart.addSeries(LineSeries, { color: "#1a82d6", lineWidth: 2, lastValueVisible: true, priceLineVisible: true, priceLineStyle: 1 });
    closeLine.applyOptions({ visible: chartType === "line" });

    const volumeSeries = indicators.volume
      ? chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }, volPane)
      : null;

    const mk = (on, color, w = 1) => on ? chart.addSeries(LineSeries, { color, lineWidth: w, priceLineVisible: false, lastValueVisible: false }) : null;
    const maSeries = mk(indicators.ma, "#f57c00");
    const emaSeries = mk(indicators.ema, "#1a82d6");
    const bbUpper = mk(indicators.bb, "rgba(124,92,230,.85)");
    const bbMid = mk(indicators.bb, "rgba(124,92,230,.55)");
    const bbLower = mk(indicators.bb, "rgba(124,92,230,.85)");

    const rsiSeries = indicators.rsi
      ? chart.addSeries(LineSeries, { color: "#9c27b0", lineWidth: 2, priceLineVisible: false, lastValueVisible: true }, rsiPane) : null;
    const macdSeries = indicators.macd
      ? chart.addSeries(LineSeries, { color: "#1a82d6", lineWidth: 2, priceLineVisible: false, lastValueVisible: false }, macdPane) : null;
    const signalSeries = indicators.macd
      ? chart.addSeries(LineSeries, { color: "#f57c00", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, macdPane) : null;
    const macdHist = indicators.macd
      ? chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, macdPane) : null;

    /* main pane big, sub panes small */
    const sizePanes = () => {
      try {
        const panes = chart.panes();
        if (panes.length < 2) return;
        panes.forEach((pn, i) => {
          if (typeof pn.setStretchFactor === "function") pn.setStretchFactor(i === 0 ? 3.2 : 1);
        });
      } catch (_) {}
    };
    sizePanes();

    const showLegend = (c) => {
      if (!alive || !c) return;
      const i = idxMap.get(c.time);
      const prev = i > 0 ? candles[i - 1].close : c.open;
      const ch = c.close - prev;
      setLegend({ o: c.open, h: c.high, l: c.low, c: c.close, ch, pct: prev ? (ch / prev) * 100 : 0, ma: maMap.get(c.time) });
    };

    chart.subscribeCrosshairMove((param) => {
      if (!alive) return;
      if (!param || !param.time) {
        hover = false;
        showLegend(candles[candles.length - 1]);
        return;
      }
      hover = true;
      const i = idxMap.get(param.time);
      if (i != null) showLegend(candles[i]);
    });

    let precisionSet = false;
    const applyData = (data, fit = false) => {
      if (!alive || !data.length) return;
      candles = data;
      idxMap = new Map(data.map((x, i) => [x.time, i]));
      if (!precisionSet) {
        const c = data[data.length - 1].close;
        const precision = c >= 100 ? 2 : c >= 1 ? 4 : 8;
        const pf = { type: "price", precision, minMove: 1 / Math.pow(10, precision) };
        candlesSeries.applyOptions({ priceFormat: pf });
        closeLine.applyOptions({ priceFormat: pf });
        precisionSet = true;
      }
      candlesSeries.setData(data);
      closeLine.setData(data.map((x) => ({ time: x.time, value: x.close })));
      if (volumeSeries) volumeSeries.setData(data.map((x) => ({ time: x.time, value: x.volume || 0, color: x.close >= x.open ? "rgba(31,166,122,.28)" : "rgba(229,16,29,.28)" })));
      const ma9 = calcSMA(data, 9);
      maMap = new Map(ma9.map((x) => [x.time, x.value]));
      if (maSeries) maSeries.setData(ma9);
      if (emaSeries) emaSeries.setData(calcEMA(data, 20));
      if (bbUpper) {
        const bb = calcBollinger(data);
        bbUpper.setData(bb.upper); bbMid.setData(bb.mid); bbLower.setData(bb.lower);
      }
      if (rsiSeries) rsiSeries.setData(calcRSI(data));
      if (macdSeries) {
        const macd = calcMACD(data);
        macdSeries.setData(macd.line); signalSeries.setData(macd.signal); macdHist.setData(macd.hist);
      }
      if (!hover) showLegend(data[data.length - 1]);
      if (fit) {
        const visibleBars = isMobile ? 38 : 70;
        const from = Math.max(0, data.length - visibleBars);
        chart.timeScale().setVisibleLogicalRange({ from, to: data.length + (isMobile ? 4 : 6) });
        sizePanes();
      }
    };

    const connectSocket = () => {
      if (!alive) return;
      try {
        socket = new WebSocket(`wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@kline_${interval}`);
        socket.onmessage = (event) => {
          if (!alive) return;
          try {
            const msg = JSON.parse(event.data);
            const k = msg.k;
            if (!k) return;
            const item = { time: Math.floor(k.t / 1000), open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v };
            const last = candles[candles.length - 1];
            if (last && last.time === item.time) candles[candles.length - 1] = item;
            else candles.push(item);
            if (candles.length > CHART_LIMIT) candles = candles.slice(-CHART_LIMIT);
            applyData(candles, false);
            setStatus(ST_LIVE);
          } catch (_) {}
        };
        socket.onerror = () => { if (alive) setStatus(ST_RECONN); };
        socket.onclose = () => { if (alive) retryTimer = setTimeout(connectSocket, 2500); };
      } catch (_) { setStatus("Live feed unavailable"); }
    };

    const load = async () => {
      if (!supported) { setStatus("Unsupported market symbol"); return; }
      setStatus(ST_LOADING);
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${interval}&limit=${CHART_LIMIT}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Market data error (${response.status})`);
        const rows = await response.json();
        if (!Array.isArray(rows)) throw new Error("Invalid market data");
        const parsed = rows.map((x) => ({ time: Math.floor(x[0] / 1000), open: +x[1], high: +x[2], low: +x[3], close: +x[4], volume: +x[5] }));
        if (!alive) return;
        applyData(parsed, true);
        setStatus(ST_LIVE);
        connectSocket();
      } catch (error) {
        if (alive) setStatus(error.message || "Could not load market data");
      }
    };
    load();

    return () => {
      alive = false;
      clearTimeout(retryTimer);
      if (socket) { socket.onclose = null; socket.close(); }
      chart.remove();
    };
    // eslint-disable-next-line
  }, [sym, timeframe, chartType, indicators, dark]);

  const toggleFullscreen = async () => {
    const el = hostRef.current && hostRef.current.parentElement && hostRef.current.parentElement.parentElement;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {}
  };

  const dirCls = legend && legend.ch < 0 ? "dn" : "up";
  const pairLabel = String(sym || "BTC").toLowerCase() + "usdt";

  return (
    <div className="cx-chart-wrap">
      {/* ---- toolbar: [D ⌄] [candle] [Indicators] ---- */}
      <div className="cx-chart-toolbar">
        <button type="button" className="cx-tb-cell" onClick={() => setMenu(menu === "tf" ? "" : "tf")}>{tfLabel(timeframe)}</button>
        <button type="button" className="cx-tb-cell" onClick={() => setMenu(menu === "type" ? "" : "type")} aria-label="chart type">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M7 3v4M7 17v4M17 3v2M17 15v6" />
            <rect x="4.5" y="7" width="5" height="10" rx="0.5" />
            <rect x="14.5" y="5" width="5" height="10" rx="0.5" />
          </svg>
        </button>
        <button type="button" className="cx-tb-cell wide" onClick={() => setMenu("ind")}>
          <svg width="26" height="22" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M2 14l5-6 5 5 6-8" />
            <path d="M20 17v6M17 20h6" />
          </svg>
          {tt("ind", "Indicators")}
        </button>
        <span className="cx-chart-status">{statusText}</span>
        <button type="button" className="cx-tb-cell icon" onClick={toggleFullscreen} title="Fullscreen">⛶</button>

        {menu === "tf" && (
          <div className="cx-pop">
            {TF.map((tf) => (
              <button key={tf} type="button" className={timeframe === tf ? "on" : ""} onClick={() => { setTimeframe(tf); setMenu(""); }}>{tfLabel(tf)}</button>
            ))}
          </div>
        )}
        {menu === "type" && (
          <div className="cx-pop type">
            <button type="button" className={chartType === "candle" ? "on" : ""} onClick={() => { setChartType("candle"); setMenu(""); }}>{tt("candles", "Candles")}</button>
            <button type="button" className={chartType === "line" ? "on" : ""} onClick={() => { setChartType("line"); setMenu(""); }}>{tt("line", "Line")}</button>
          </div>
        )}
      </div>

      {/* ---- chart ---- */}
      <div className="cx-chart-area" onClick={() => menu !== "ind" && setMenu("")}>
        <div className="cx-chart-canvas" ref={hostRef} />
        <div className="cx-chart-legend">
          <div className="l1"><i className="box" />{pairLabel}, {tfLabel(timeframe)} ⌄</div>
          {legend && (
            <>
              <div className={"l2 " + dirCls}>
                <span>O</span><b>{fmtP(legend.o)}</b>
                <span>H</span><b>{fmtP(legend.h)}</b>
                <span>L</span><b>{fmtP(legend.l)}</b>
                <span>C</span><b>{fmtP(legend.c)}</b>
              </div>
              <div className={"l3 " + dirCls}>{legend.ch > 0 ? "+" : ""}{legend.ch.toFixed(2)} ({legend.pct > 0 ? "+" : ""}{legend.pct.toFixed(2)}%)</div>
              {indicators.ma && legend.ma != null && (
                <div className="l4">MA (9, close, 0) ⌄ <b>{fmtP(legend.ma)}</b></div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---- indicators sheet ---- */}
      <Sheet open={menu === "ind"} onClose={() => setMenu("")} title={tt("ind", "Indicators")}>
        <div className="cx-op-grid">
          {IND_LIST.map(([key, label]) => (
            <button key={key} type="button" className={"cx-op-opt" + (indicators[key] ? " on" : "")} onClick={() => toggle(key)}>{label}</button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/* ---------------- Bottom sheet ---------------- */
function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="cx-op-ov" onClick={onClose}>
      <div className="cx-op-sh" onClick={(e) => e.stopPropagation()}>
        <i className="cx-op-grab" />
        {title ? (
          <div className="cx-op-sh-h">
            <b>{title}</b>
            <button type="button" onClick={onClose} aria-label="close">✕</button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

const CSS = `
.cx-op{--cx-nav-h:76px;--cx-bar-h:76px;--bd:#e4e7ec;--gray:#8a94a6;--blue:#1a82d6;--blue2:#4aa8ff;--grn:#00c087;--red:#d84d5a;
  --f-bg:#f6f8fc;--f-ln:#dfe5ee;--f-bd:#9aa6b8;--f-card:#ffffff;--f-tx:#141b29}

.cx-op{background:#fff;color:#1a1a1a;display:flex;flex-direction:column;height:100vh;box-sizing:border-box;padding-bottom:calc(var(--cx-bar-h) + var(--cx-nav-h) + env(safe-area-inset-bottom,0px))}
.cx-op,.cx-op *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
.cx-op button{color:inherit;font-family:inherit}
.cx-op-top{display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 16px;background:#fff;border-bottom:1px solid #eef0f3;flex:none}
.cx-op-top button{display:flex;align-items:center;gap:8px;font-size:15px;background:none;border:0;cursor:pointer}
.cx-op-pair{font-size:19px!important;font-weight:700}
.cx-op-info{display:grid;grid-template-columns:1.15fr 1fr;gap:6px;padding:16px 16px 14px;background:#fff;flex:none;align-items:center}
.cx-op-pr b{display:block;font-size:23px;font-weight:600;line-height:1.25;letter-spacing:.2px}
.cx-op-pr span{font-size:14px}
.cx-op-st{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:14px;align-content:center;line-height:1.45}
.cx-op-st i{font-style:normal;color:var(--gray)}
.cx-op-st b{text-align:right;font-weight:400;overflow-wrap:anywhere}
.cx-op-off{padding:8px 12px;text-align:center;font-size:13px;background:#fdecee;color:#c8323f;flex:none}
.cx-op-body{flex:1;min-height:0;display:flex;flex-direction:column;border-top:1px solid #c9ced6}
.cx-op-chart{flex:1;min-height:360px;position:relative;overflow:hidden}
.cx-chart-wrap{position:absolute;inset:0;display:flex;flex-direction:column;min-height:0;background:#fff;overflow:hidden}

/* toolbar */
.cx-chart-toolbar{position:relative;display:flex;align-items:stretch;min-height:44px;background:#f4f5f7;border-bottom:1px solid #d6dae0;flex:none}
.cx-tb-cell{display:flex;align-items:center;justify-content:center;gap:6px;min-width:52px;padding:0 14px;background:transparent;border:0;border-right:1px solid #d6dae0;font-size:16px;cursor:pointer;color:#222}
.cx-tb-cell.wide{padding:0 14px;font-size:17px}
.cx-tb-cell.icon{border-right:0;border-left:1px solid #d6dae0;min-width:44px;padding:0 10px;font-size:18px}
.cx-chart-status{margin-left:auto;align-self:center;padding:0 8px;color:var(--gray);font-size:10px;white-space:nowrap}
.cx-pop{position:absolute;top:100%;left:0;z-index:12;display:flex;flex-wrap:wrap;gap:4px;width:max-content;max-width:100%;padding:8px;background:#fff;border:1px solid #d6dae0;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.14)}
.cx-pop.type{left:52px}
.cx-pop button{display:flex;align-items:center;justify-content:center;text-align:center;min-width:46px;height:34px;padding:0 12px;border:1px solid #e1e4e9;border-radius:6px;background:#fff;font-size:14px;cursor:pointer}
.cx-pop button.on{border-color:var(--blue);background:#eaf4fd;color:var(--blue)}

/* chart area */
.cx-chart-area{position:relative;flex:1;min-height:0;width:100%}
.cx-chart-canvas{position:absolute;inset:0;width:100%;height:100%}
.cx-chart-legend{position:absolute;left:8px;top:6px;z-index:4;pointer-events:none;font-size:15px;line-height:1.4;max-width:calc(100% - 90px)}
.cx-chart-legend .l1{display:flex;align-items:center;gap:8px;font-size:18px;color:#222}
.cx-chart-legend .box{display:inline-block;width:20px;height:20px;border:1.5px solid #666;border-radius:3px;position:relative}
.cx-chart-legend .box::after{content:"";position:absolute;left:3px;right:3px;top:8px;height:1.5px;background:#666}
.cx-chart-legend .l2{font-size:14px;color:#222;display:flex;flex-wrap:wrap;gap:0 6px}
.cx-chart-legend .l2 b{font-weight:400;margin-right:4px}
.cx-chart-legend .up b,.cx-chart-legend .up.l3{color:${UP}}
.cx-chart-legend .dn b,.cx-chart-legend .dn.l3{color:${DOWN}}
.cx-chart-legend .l3{font-size:14px}
.cx-chart-legend .l4{font-size:14px;color:#444}
.cx-chart-legend .l4 b{font-weight:400;color:#f57c00}

/* ===== Trade bar (নেভিগেশনের ঠিক উপরে) ===== */
.cx-op-bar{position:fixed;left:0;right:0;bottom:calc(var(--cx-nav-h) + env(safe-area-inset-bottom,0px));z-index:60;display:grid;grid-template-columns:1fr 1fr 1.15fr 1.15fr;gap:8px;align-items:center;padding:8px 12px;height:var(--cx-bar-h);background:#fff;border-top:1px solid #e4e7ec;box-shadow:0 -10px 24px -20px rgba(20,40,80,.45)}
.cx-op-pick{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;height:52px;padding:0 12px;border-radius:12px;background:var(--f-card);border:1.5px solid var(--f-bd);cursor:pointer;text-align:start;line-height:1.2;transition:border-color .15s ease,background .15s ease}
.cx-op-pick:active{border-color:var(--blue)}
.cx-op-pick span:first-child{font-size:11px;font-weight:500;color:var(--gray);letter-spacing:.2px}
.cx-op-pick span:last-child{font-size:14.5px;font-weight:700;color:var(--f-tx);font-variant-numeric:tabular-nums;white-space:nowrap}
.cx-op-go{display:flex;align-items:center;justify-content:center;text-align:center;height:52px;border-radius:12px;border:0;font-size:14.5px;font-weight:700;letter-spacing:.2px;line-height:1.15;cursor:pointer;color:#fff!important;padding:0 6px;box-shadow:0 10px 20px -12px rgba(0,0,0,.6);transition:transform .12s ease,filter .15s ease}
.cx-op-go:active{transform:scale(.97);filter:brightness(.94)}
.cx-op-go.up{background:linear-gradient(135deg,#19d6a0,#00b07c)}
.cx-op-go.dn{background:linear-gradient(135deg,#f0707b,#d23a48)}
.cx-op-go:disabled{opacity:.55}

/* toast: স্ক্রিনের ঠিক মাঝখানে */
.cx-op-toast{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:600;width:max-content;max-width:calc(100% - 48px);
  padding:13px 22px;border-radius:14px;font-size:14.5px;font-weight:500;line-height:1.4;text-align:center;pointer-events:none;
  background:#e8f2fc;color:#1a6fb8;box-shadow:0 14px 40px -12px rgba(0,0,0,.45);animation:cxtoast .2s cubic-bezier(.2,.8,.2,1)}
.cx-op-toast.bad{background:#fdecee;color:#c8323f}
.cx-op-toast.ok{background:#e3f7ee;color:#0a8a5f}
@keyframes cxtoast{from{transform:translate(-50%,-46%) scale(.94);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}

/* ===== sheets ===== */
.cx-op-ov{position:fixed;inset:0;z-index:200;background:rgba(8,14,26,.55);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);display:flex;align-items:flex-end;justify-content:center}
.cx-op-sh{width:100%;max-width:520px;max-height:90vh;overflow:auto;background:#fff;border-radius:22px 22px 0 0;padding:10px 18px calc(22px + env(safe-area-inset-bottom,0px));animation:cxup .2s ease-out}
@keyframes cxup{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
.cx-op-grab{display:block;width:40px;height:4px;margin:0 auto 12px;border-radius:4px;background:#d5dae3}
.cx-op-sh-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;font-size:17px;font-weight:700;letter-spacing:-.1px}
.cx-op-sh-h button{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--f-bg);border:0;font-size:14px;cursor:pointer;color:var(--gray)}

/* section title */
.cx-op-sec{display:flex;align-items:center;gap:8px;margin:14px 0 10px;font-size:13px;font-weight:600;color:#4b566b;letter-spacing:.2px}
.cx-op-sec::before{content:"";width:3px;height:13px;border-radius:2px;background:linear-gradient(180deg,var(--blue2),var(--blue))}
.cx-op-sec.t2{margin-top:20px}

/* option chips */
.cx-op-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cx-op-row{display:flex;gap:10px}
.cx-op-row>button{flex:1}
.cx-op-row.one>button{flex:0 0 31%}
.cx-op-row.four{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.cx-op-row.six{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.cx-op-opt{position:relative;display:flex;align-items:center;justify-content:center;text-align:center;height:46px;border-radius:12px;border:1.5px solid var(--f-bd);background:var(--f-card);color:var(--f-tx);font-size:14.5px;font-weight:600;cursor:pointer;overflow:hidden;padding:0 4px;white-space:nowrap;font-variant-numeric:tabular-nums;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease}
.cx-op-opt:active{transform:scale(.98)}
.cx-op-opt.on{border-color:var(--blue);background:#eaf4fd;color:var(--blue);box-shadow:0 0 0 3px rgba(26,130,214,.12)}
.cx-op-opt.on::after{content:"✓";position:absolute;right:0;bottom:0;width:26px;height:20px;background:linear-gradient(135deg,transparent 50%,var(--blue) 50%);color:#fff;font-size:10px;line-height:26px;text-align:right;padding-right:3px}

/* amount field (বক্স + বর্ডার) */
.cx-op-field{display:flex;align-items:center;gap:8px;height:52px;margin-top:12px;padding:0 8px 0 14px;border-radius:12px;background:var(--f-card);border:1.5px solid var(--f-bd);transition:border-color .15s ease,box-shadow .15s ease}
.cx-op-field:focus-within{border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,130,214,.14)}
.cx-op-field input{flex:1;min-width:0;height:100%;border:0;outline:0;background:none;font-size:17px;font-weight:700;color:var(--f-tx);font-variant-numeric:tabular-nums}
.cx-op-field input::placeholder{font-size:14px;font-weight:400;color:var(--gray)}
.cx-op-field em{font-style:normal;font-size:12.5px;font-weight:700;color:var(--gray);letter-spacing:.3px}
.cx-op-field button{height:34px;padding:0 14px;border:0;border-radius:9px;background:rgba(26,130,214,.12);color:var(--blue)!important;font-size:13px;font-weight:700;cursor:pointer}
.cx-op-field button:active{background:var(--blue);color:#fff!important}

/* info panel */
.cx-op-box{margin-top:18px;border-radius:14px;background:var(--f-bg);border:1.5px solid var(--f-bd);overflow:hidden}
.cx-op-box div{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;font-size:13px;border-bottom:1px dashed var(--f-ln)}
.cx-op-box div:last-child{border-bottom:0}
.cx-op-box span{color:var(--gray)}
.cx-op-box b{font-weight:600;color:var(--f-tx);font-variant-numeric:tabular-nums;text-align:end;word-break:break-all}
.cx-op-box b.g{color:var(--grn)}

.cx-op-sbtn{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}
.cx-op-sbtn .cx-op-go{height:52px;font-size:15.5px;border-radius:13px}
.cx-op-hint{margin-top:8px;font-size:12px;color:var(--gray)}

/* confirm dialog (Buy Long / Sell Short) */
.cx-op-cfo{position:fixed;inset:0;z-index:400;background:rgba(8,14,26,.6);display:flex;align-items:center;justify-content:center;padding:0 20px}
.cx-op-cf{width:100%;max-width:340px;background:#fff;color:#1a1a1a;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px -20px rgba(0,0,0,.6);animation:cxpop .15s ease-out}
@keyframes cxpop{from{transform:scale(.92);opacity:.4}to{transform:none;opacity:1}}
.cx-op-cf-t{padding:17px 16px 14px;text-align:center;font-size:16px;font-weight:700;letter-spacing:.2px;border-bottom:1px solid #e4e8ee}
.cx-op-cf-b{padding:16px 22px 20px;font-size:14px;line-height:1.5;border-bottom:1px solid #e4e8ee}
.cx-op-cf-b p{margin:0 0 10px;display:flex;justify-content:space-between;gap:12px}
.cx-op-cf-b p span{color:var(--gray)}
.cx-op-cf-b p b{font-weight:700;font-variant-numeric:tabular-nums}
.cx-op-cf-b p:last-child{margin-bottom:0}
.cx-op-cf-a{display:grid;grid-template-columns:1fr 1fr}
.cx-op-cf-a button{display:flex;align-items:center;justify-content:center;text-align:center;height:50px;padding:0;background:none;border:0;font-size:14px;font-weight:400;letter-spacing:.2px;color:#6b7385!important;cursor:pointer;transition:background .15s ease}
.cx-op-cf-a button:active{background:rgba(0,0,0,.04)}
.cx-op-cf-a button+button{border-left:1px solid #e4e8ee}
.cx-op-cf-a button.ok{font-weight:600;color:var(--blue)!important}
.cx-op-cf-a button:disabled{opacity:.5}

/* left coin drawer */
.cx-op-dov{position:fixed;inset:0;z-index:200;background:rgba(8,14,26,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:cxdf .18s ease}
.cx-op-dr{position:absolute;left:0;top:0;bottom:0;width:min(76%,290px);background:#fff;color:#1b2433;display:flex;flex-direction:column;
  border-radius:0 18px 18px 0;box-shadow:12px 0 40px -18px rgba(0,0,0,.55);animation:cxdr .26s cubic-bezier(.2,.8,.2,1);padding-top:env(safe-area-inset-top,0px)}
@keyframes cxdr{from{transform:translateX(-30px);opacity:.6}to{transform:none;opacity:1}}
@keyframes cxdf{from{opacity:0}to{opacity:1}}
.cx-op-drh{padding:22px 18px 12px;flex:none}
.cx-op-drh h2{margin:0;font-size:18px;font-weight:700;letter-spacing:-.2px;line-height:1.2}
.cx-op-drh span{display:inline-flex;align-items:center;margin-top:10px;padding:4px 12px;border-radius:999px;background:rgba(26,130,214,.1);color:#1a82d6;font-size:12.5px;font-weight:600;letter-spacing:.3px}
.cx-op-coin-wrap{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:2px 12px max(16px,env(safe-area-inset-bottom,0px))}
.cx-op-coin{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:50px;padding:0 6px;border:0;border-bottom:1px solid #edf0f4;background:none;cursor:pointer;text-align:start;transition:background .15s ease}
.cx-op-coin:last-child{border-bottom:0}
.cx-op-coin:active{background:#f3f6fa;border-radius:10px}
.cx-op-cn{display:flex;align-items:center;gap:9px;min-width:0}
.cx-op-cn b{font-size:13.5px;font-weight:600;white-space:nowrap}
.cx-op-cn b small{font-size:10.5px;font-weight:500;color:var(--gray);margin-left:1px}
.cx-op-cp{font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.cx-op-coin.on .cx-op-cn b{color:var(--blue)}

/* positions panel */
.cx-op-pn{position:fixed;inset:0;z-index:150;background:#fff;display:flex;flex-direction:column}
.cx-op-tabs{display:flex;border-bottom:1px solid var(--bd);background:#fff;flex:none}
.cx-op-tabs button{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;height:46px;background:none;border:0;border-bottom:2px solid transparent;font-size:14px;cursor:pointer;color:var(--gray)!important}
.cx-op-tabs button.on{color:#111!important;border-bottom-color:var(--blue)}
.cx-op-list{flex:1;overflow:auto;padding:12px 14px;background:#f4f5f7}
.cx-op-card{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:12px 14px;margin-bottom:10px;font-size:13px}
.cx-op-card .h{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;font-size:15px}
.cx-op-card .r{display:flex;justify-content:space-between;padding:3px 0}
.cx-op-card .r i{font-style:normal;color:var(--gray)}
.cx-op-tag{padding:2px 8px;border-radius:6px;font-size:12px;color:#fff}
.cx-op-none{text-align:center;color:var(--gray);padding:40px 0;font-size:14px}

/* Mobile */
@media(max-width:600px){
  .cx-op{height:100dvh;min-height:620px;overflow:hidden}
  .cx-op-body{flex:1;min-height:0;overflow:hidden}
  .cx-op-chart{flex:1;min-height:0}
  .cx-chart-canvas{touch-action:pan-y}
  .cx-chart-legend .l1{font-size:17px}
  .cx-chart-legend .l2,.cx-chart-legend .l3,.cx-chart-legend .l4{font-size:13px}
}
@media(max-width:380px){
  .cx-tb-cell{padding:0 10px}
  .cx-chart-status{display:none}
  .cx-op-bar{gap:6px;padding:8px}
  .cx-op-pick{padding:0 8px}
  .cx-op-go{font-size:13px}
  .cx-op-opt{font-size:13.5px}
  .cx-op-row.four,.cx-op-row.six{gap:8px}
}

/* PC */
@media(min-width:900px){
  .cx-op{height:100vh;min-height:680px;padding-bottom:var(--cx-bar-h);overflow:hidden}
  .cx-op-info{grid-template-columns:minmax(260px,38%) minmax(0,1fr)}
  .cx-op-body{overflow:hidden}
  .cx-op-chart{flex:1;min-height:0;width:100%}
  .cx-op-bar{position:fixed;left:0;right:0;bottom:0;width:100%;grid-template-columns:1fr 1fr 2fr 2fr;gap:12px}
  .cx-op-ov{align-items:center}
  .cx-op-sh{border-radius:16px}
  .cx-op-pn{left:auto;width:420px;border-left:1px solid var(--bd)}
}
@media(prefers-reduced-motion:reduce){.cx-op-toast,.cx-op-dr,.cx-op-dov,.cx-op-sh,.cx-op-cf{animation:none!important}}

/* ================= NIGHT MODE (.cx-op.dk) ================= */
.cx-op.dk{--bd:#243148;--gray:#8d98ad;--f-bg:#101c30;--f-ln:#2a3a56;--f-bd:#5a6f94;--f-card:#0d1829;--f-tx:#e8ecf3;background:#0d1626;color:#e8ecf3}
.cx-op.dk .cx-op-top{background:#0d1626;border-bottom-color:#243148}
.cx-op.dk .cx-op-info{background:#0d1626}
.cx-op.dk .cx-op-off{background:#3b1a20;color:#ff8a95}
.cx-op.dk .cx-op-body{border-top-color:#243148}
.cx-op.dk .cx-chart-wrap{background:#131a2a}
.cx-op.dk .cx-chart-toolbar{background:#0d1626;border-bottom-color:#2a3548}
.cx-op.dk .cx-tb-cell{color:#c1c7d4;border-color:#2a3548}
.cx-op.dk .cx-pop{background:#1c2639;border-color:#2a3548;box-shadow:0 6px 18px rgba(0,0,0,.5)}
.cx-op.dk .cx-pop button{background:#131a2a;border-color:#2a3548;color:#e8ecf3}
.cx-op.dk .cx-pop button.on{background:#17304f;border-color:var(--blue);color:#6cb6f5}
.cx-op.dk .cx-chart-legend .l1,.cx-op.dk .cx-chart-legend .l2{color:#e8ecf3}
.cx-op.dk .cx-chart-legend .l4{color:#aab3c5}
.cx-op.dk .cx-chart-legend .box{border-color:#9aa6bb}
.cx-op.dk .cx-chart-legend .box::after{background:#9aa6bb}
.cx-op.dk .cx-op-bar{background:#0d1626;border-top-color:#243148;box-shadow:0 -10px 24px -18px rgba(0,0,0,.8)}
.cx-op.dk .cx-op-toast{background:#17304f;color:#8fc4ff;box-shadow:0 14px 40px -12px rgba(0,0,0,.8)}
.cx-op.dk .cx-op-toast.bad{background:#3b1a20;color:#ff8a95}
.cx-op.dk .cx-op-toast.ok{background:#0f3a2c;color:#4be0a8}
.cx-op.dk .cx-op-sh{background:#17263d;color:#e8ecf3}
.cx-op.dk .cx-op-grab{background:#2c3c58}
.cx-op.dk .cx-op-sec{color:#b4bfd3}
.cx-op.dk .cx-op-opt.on{background:#142a47;color:#6cb6f5;box-shadow:0 0 0 3px rgba(74,163,240,.16)}
.cx-op.dk .cx-op-field button{background:rgba(74,163,240,.16);color:#6cb6f5!important}
.cx-op.dk .cx-op-dr{background:#101e34;color:#e9eef6;box-shadow:12px 0 40px -18px rgba(0,0,0,.9)}
.cx-op.dk .cx-op-coin{border-bottom-color:#1f2f4a}
.cx-op.dk .cx-op-coin:active{background:#0b1626}
.cx-op.dk .cx-op-cn b small{color:#8a97ad}
.cx-op.dk .cx-op-coin.on .cx-op-cn b{color:#6cb6f5}
.cx-op.dk .cx-op-drh span{background:rgba(74,163,240,.14);color:#6cb6f5}
.cx-op.dk .cx-op-cf{background:#12203a;color:#e8ecf3}
.cx-op.dk .cx-op-cf-t,.cx-op.dk .cx-op-cf-b{border-bottom-color:#2c3c58}
.cx-op.dk .cx-op-cf-a button{color:#9aa6bb!important}
.cx-op.dk .cx-op-cf-a button.ok{color:#4aa3f0!important}
.cx-op.dk .cx-op-cf-a button:active{background:rgba(255,255,255,.05)}
.cx-op.dk .cx-op-cf-a button+button{border-left-color:#2c3c58}
.cx-op.dk .cx-op-pn{background:#0d1626}
.cx-op.dk .cx-op-tabs{background:#0d1626}
.cx-op.dk .cx-op-tabs button.on{color:#fff!important}
.cx-op.dk .cx-op-list{background:#0a111f}
.cx-op.dk .cx-op-card{background:#17263d;border-color:#243148}

/* ===== বর্ডার ফিক্স: অ্যাপের গ্লোবাল button স্টাইল ওভাররাইড করতে বেশি specificity + !important ===== */
.cx-op button.cx-op-opt{border:1.5px solid var(--f-bd)!important;background:var(--f-card)!important;color:var(--f-tx)!important;border-radius:12px!important;box-shadow:none}
.cx-op button.cx-op-opt.on{border:1.5px solid var(--blue)!important;background:#e3f1fd!important;color:var(--blue)!important;box-shadow:0 0 0 3px rgba(26,130,214,.14)}
.cx-op button.cx-op-pick{border:1.5px solid var(--f-bd)!important;background:var(--f-card)!important;border-radius:12px!important}
.cx-op button.cx-op-pick:active{border-color:var(--blue)!important}
.cx-op.dk button.cx-op-opt.on{background:#16335a!important;color:#7cc0ff!important;border-color:#4aa3f0!important;box-shadow:0 0 0 3px rgba(74,163,240,.18)}

`;

export default function Options({ P, W, sym, setSym, pos = [], orders = [], dark }) {
  const t = useT();
  /* translate with fallback when the key does not exist */
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  /* নাইট মোড: App-এর .cx.dark ক্লাস অনুসরণ করে */
  const rootRef = useRef(null);
  const [domDark, setDomDark] = useState(false);
  useEffect(() => {
    const el = rootRef.current && rootRef.current.closest(".cx");
    if (!el) return undefined;
    const sync = () => setDomDark(el.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  const isDark = domDark || dark === true;

  const [qty, setQty] = useState(QTY[0]);
  const [secs, setSecs] = useState(DEFAULT_SECS[0]);
  const [sh, setSh] = useState(""); /* "", "trade", "coin" */
  const [cf, setCf] = useState(null); /* confirm dialog: { dir, fromSheet } */
  const [panel, setPanel] = useState(false);
  const [tab, setTab] = useState("pos");
  const [qIn, setQIn] = useState(String(QTY[0]));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", s: "bad" });
  const [now, setNow] = useState(Date.now());
  const [st, setSt] = useState(null); /* অ্যাডমিন সেটিংস */
  const tm = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => clearTimeout(tm.current), []);

  /* অ্যাডমিন সেটিংস: প্রথমে একবার, তারপর প্রতি ১৫ সেকেন্ডে */
  useEffect(() => {
    if (W && W.guest) { setSt(null); return undefined; }
    let on = true;
    const load = async () => {
      try {
        const r = await api(STATUS_PATH);
        if (on) setSt(r);
      } catch (_) {}
    };
    load();
    const id = setInterval(load, 15000);
    return () => { on = false; clearInterval(id); };
    // eslint-disable-next-line
  }, [W && W.guest]);

  const flash = (k, s = "bad") => {
    setMsg({ k, s });
    clearTimeout(tm.current);
    tm.current = setTimeout(() => setMsg({ k: "", s: "bad" }), 2600);
  };

  /* সময়ের তালিকা: server থেকে, না এলে ডিফল্ট */
  const secList = st && Array.isArray(st.secs) && st.secs.length ? st.secs : DEFAULT_SECS;
  useEffect(() => {
    if (!secList.includes(secs)) setSecs(secList[0]);
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

  const p = (P && P[sym]) || { price: 0, chg: 0, hi: 0, lo: 0, vol: 0 };
  const up = p.chg >= 0;
  const col = up ? CUP : CDN;
  const bal = W && W.w && W.w.USDT ? W.w.USDT : 0;

  /* পজ অবস্থা: সব ট্রেড বন্ধ / এই কয়েন বন্ধ / ইউজার ব্লক */
  const pausedMsg = !st ? ""
    : !st.enabled ? tt("optionsOff", "Options trading is paused")
    : st.blocked ? tt("userBlocked", "Trading is disabled for your account")
    : (st.disabled_syms || []).includes(sym) ? tt("symOff", "This coin is paused")
    : "";
  const paused = !!pausedMsg;
  const minQ = st && st.qty_min > 0 ? st.qty_min : MIN_Q;
  const maxQ = st && st.qty_max > 0 ? st.qty_max : MAX_Q;
  const yld = st && st.yield > 0 ? st.yield : YIELD;

  /* withBal=false: কনফার্ম কার্ড খোলার আগে ব্যালেন্স চেক হয় না; Confirm চাপলে তখন চেক হয় */
  const check = (withBal = true) => {
    if (W.guest) { W.needLogin(); return false; }
    if (paused) { flash(pausedMsg); return false; }
    if (!(qty >= minQ && qty <= maxQ)) { flash(t("badQ")); return false; }
    if (withBal && bal < qty) { flash(t("iB")); return false; }
    return true;
  };

  const open = async (dir) => {
    if (busy) return false;
    if (!check()) return false;
    setBusy(true);
    try {
      await api(OPEN_PATH, { method: "POST", body: { sym, direction: dir, qty, seconds: secs } });
      flash(t("openMsg"), "ok");
      await W.reload();
      return true;
    } catch (e) {
      flash(t(e && e.message ? e.message : "err"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  /* Buy Long / Sell Short চাপলে আগে কনফার্ম কার্ড; Confirm চাপলে তবেই ট্রেড */
  const ask = (dir, fromSheet = false) => {
    if (busy) return;
    if (!check(false)) return;
    setCf({ dir, fromSheet });
  };

  const doConfirm = async () => {
    const c = cf;
    if (!c) return;
    setCf(null);
    const ok = await open(c.dir);
    if (ok && c.fromSheet) setSh("");
  };

  const pickQty = (q) => { setQty(q); setQIn(String(q)); };
  const typeQty = (v) => {
    setQIn(v);
    const n = parseFloat(v);
    setQty(isNaN(n) ? 0 : n);
  };
  const allQty = () => {
    const v = Math.min(bal, maxQ);
    setQty(v);
    setQIn(String(v));
  };

  /* বাকি সময়: 30s / 5m 03s / 1h 02m 03s / 1d 2h 3m */
  const left = (end) => {
    let s = Math.max(0, Math.ceil((end - now) / 1000));
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    if (d) return `${d}d ${h}h ${m}m`;
    if (h) return `${h}h ${m}m ${s}s`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const myPos = pos;
  const myOrd = orders;
  const yieldPct = Math.round(yld * 100) + "%";

  return (
    <div className={"cx-op" + (isDark ? " dk" : "")} ref={rootRef}>
      <style>{CSS}</style>

      {/* ---- Header ---- */}
      <div className="cx-op-top">
        <button type="button" className="cx-op-pair" onClick={() => setSh("coin")}>
          <Ic d={ICON.menu} s={24} />{sym}/USDT
        </button>
        <button type="button" onClick={() => setPanel(true)}>
          {t("pos")} <Ic d={ICON.doc} s={24} />
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

      {/* ---- Paused banner ---- */}
      {paused && <div className="cx-op-off">{pausedMsg}</div>}

      {/* ---- Chart + trade bar ---- */}
      <div className="cx-op-body">
        <div className="cx-op-chart">
          <Chart sym={sym} tt={tt} dark={isDark} />
        </div>

        <div className="cx-op-bar">
          <button type="button" className="cx-op-pick" onClick={() => { setQIn(qty ? String(qty) : ""); setSh("trade"); }}>
            <span>{t("qty")} ⌄</span><span>{fq(qty)}</span>
          </button>
          <button type="button" className="cx-op-pick" onClick={() => setSh("trade")}>
            <span>{t("time")} ⌄</span><span>{fmtDur(secs)}</span>
          </button>
          <button type="button" className="cx-op-go up" disabled={busy || paused} onClick={() => ask(DIR.long)}>{t("bl")}</button>
          <button type="button" className="cx-op-go dn" disabled={busy || paused} onClick={() => ask(DIR.short)}>{t("ss")}</button>
        </div>
      </div>

      {/* ---- Toast (স্ক্রিনের মাঝখানে) ---- */}
      {msg.k && <div className={"cx-op-toast " + msg.s}>{msg.k}</div>}

      {/* ---- Trade sheet ---- */}
      <Sheet open={sh === "trade"} onClose={() => setSh("")} title={sym + "/USDT"}>
        <div className="cx-op-sec">{tt("tmode", "Transaction mode")}</div>
        <div className="cx-op-row one">
          <button type="button" className="cx-op-opt on">USDT</button>
        </div>

        <div className="cx-op-sec t2">{t("oq")}</div>
        <div className="cx-op-row four">
          {QTY.map((q) => (
            <button key={q} type="button" className={"cx-op-opt" + (q === qty ? " on" : "")} onClick={() => pickQty(q)}>{fq(q)}</button>
          ))}
        </div>
        <div className="cx-op-field">
          <input type="number" inputMode="decimal" value={qIn} onChange={(e) => typeQty(e.target.value)} placeholder={minQ + " - " + maxQ} />
          <em>USDT</em>
          <button type="button" onClick={allQty}>{tt("all", "All")}</button>
        </div>

        <div className="cx-op-sec t2">{tt("otime", "Opening time")}</div>
        <div className="cx-op-row six">
          {secList.map((s) => (
            <button key={s} type="button" className={"cx-op-opt" + (s === secs ? " on" : "")} onClick={() => setSecs(s)}>{fmtDur(s)}</button>
          ))}
        </div>

        <div className="cx-op-box">
          <div><span>{t("bal")}</span><b>{bal.toFixed(8)} USDT</b></div>
          <div><span>{t("yld")}</span><b className="g">{yieldPct}</b></div>
          <div><span>{t("oq")}</span><b>{fq(minQ)} - {fq(maxQ)}</b></div>
        </div>

        {paused && <div className="cx-op-off" style={{ marginTop: 14, borderRadius: 10 }}>{pausedMsg}</div>}

        <div className="cx-op-sbtn">
          <button type="button" className="cx-op-go up" disabled={busy || paused} onClick={() => ask(DIR.long, true)}>{t("bl")}</button>
          <button type="button" className="cx-op-go dn" disabled={busy || paused} onClick={() => ask(DIR.short, true)}>{t("ss")}</button>
        </div>
      </Sheet>

      {/* ---- Confirm dialog: Cancel / Confirm ---- */}
      {cf && (
        <div className="cx-op-cfo" onClick={() => setCf(null)}>
          <div className="cx-op-cf" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="cx-op-cf-t">{cf.dir === DIR.long ? t("bl") : t("ss")}</div>
            <div className="cx-op-cf-b">
              <p><span>{t("oq")}</span><b>{fq(qty)} USDT</b></p>
              <p><span>{tt("otime", "Opening time")}</span><b>{fmtDur(secs)}</b></p>
            </div>
            <div className="cx-op-cf-a">
              <button type="button" onClick={() => setCf(null)}>{tt("cancel", "Cancel")}</button>
              <button type="button" className="ok" disabled={busy} onClick={doConfirm}>{tt("confirm", "Confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Left coin drawer ---- */}
      {sh === "coin" && (
        <div className="cx-op-dov" onClick={() => setSh("")}>
          <div className="cx-op-dr" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="cx-op-drh">
              <h2>{tt("spot", "Spot trading")}</h2>
              <span>USDT</span>
            </div>
            <div className="cx-op-coin-wrap">
              {COINS.map((c) => {
                const pc = P && P[c] ? P[c] : null;
                return (
                  <button key={c} type="button" className={"cx-op-coin" + (c === sym ? " on" : "")} onClick={() => { setSym(c); setSh(""); }}>
                    <span className="cx-op-cn"><Coin s={c} size={24} /><b>{c}<small>/USDT</small></b></span>
                    {pc && <span className="cx-op-cp" style={{ color: pc.chg >= 0 ? CUP : CDN }}>{fmt(pc.price)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
