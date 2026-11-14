import React, { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";
import { useT, api, fmt, fmtV, Ic, ICON, COINS, Coin, QTY, SECS, YIELD, CUP, CDN } from "./Home";

/* =====================================================================
   src/pages/options.jsx — Options (second contract) trading page
   Props: P (prices), W (wallet), sym, setSym, pos, orders
   Mobile: Quantity / Time / Buy Long / Sell Short bar sits ABOVE the
           bottom navigation bar
   PC (>=900px): chart on the left, trade panel on the right
   ===================================================================== */

/* ====== Change these if they don't match your backend ====== */
const OPEN_PATH = "/options/open"; /* POST {sym, direction, qty, seconds} */
const DIR = { long: "long", short: "short" }; /* direction values */
const MIN_Q = 10, MAX_Q = 1000000;

const isLong = (d) => /long|up|buy|call|rise/i.test(String(d));

/* ---------------- Independent market chart ----------------
   Uses Lightweight Charts + Binance public market data for crypto pairs.
   No TradingView hosted widget or iframe is loaded.
   Lightweight Charts license attribution is included in the chart footer.
----------------------------------------------------------------------- */
const TF = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];
const BINANCE_INTERVALS = { "1m":"1m", "5m":"5m", "15m":"15m", "30m":"30m", "1h":"1h", "4h":"4h", "1d":"1d", "1w":"1w" };
const CHART_LIMIT = 500;

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
    const values = data.slice(i - period + 1, i + 1).map(x => x.close);
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
  const slowMap = new Map(slow.map(x => [x.time, x.value]));
  const line = fast.filter(x => slowMap.has(x.time)).map(x => ({ time: x.time, value: x.value - slowMap.get(x.time) }));
  if (!line.length) return { line: [], signal: [], hist: [] };
  const k = 2 / 10;
  let signalValue = line.slice(0, 9).reduce((a, x) => a + x.value, 0) / Math.min(9, line.length);
  const signal = [{ time: line[Math.min(8, line.length - 1)].time, value: signalValue }];
  for (let i = 9; i < line.length; i++) {
    signalValue = line[i].value * k + signalValue * (1 - k);
    signal.push({ time: line[i].time, value: signalValue });
  }
  const signalMap = new Map(signal.map(x => [x.time, x.value]));
  const hist = line.filter(x => signalMap.has(x.time)).map(x => ({ time: x.time, value: x.value - signalMap.get(x.time), color: x.value >= signalMap.get(x.time) ? "#00c087" : "#e05260" }));
  return { line, signal, hist };
}

function Chart({ sym, price }) {
  const hostRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const [timeframe, setTimeframe] = useState("1m");
  const [chartType, setChartType] = useState("candle");
  const [indicators, setIndicators] = useState({ volume: true, ma: false, ema: false, bb: false, rsi: false, macd: false });
  const [status, setStatus] = useState("Loading market data...");
  const [lastPrice, setLastPrice] = useState(null);
  const [full, setFull] = useState(false);
  const seriesRefs = useRef({});

  const toggle = (key) => setIndicators(old => ({ ...old, [key]: !old[key] }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let alive = true;
    let socket = null;
    let retryTimer = null;
    let candles = [];
    const cleanSymbol = String(sym || "BTC").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const pair = cleanSymbol.endsWith("USDT") ? cleanSymbol : cleanSymbol + "USDT";
    const interval = BINANCE_INTERVALS[timeframe] || "1m";
    const supported = /^[A-Z0-9]{5,20}$/.test(pair);
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches;

    const chart = createChart(host, {
      autoSize: true,
      layout: { background: { type: "solid", color: "#0b1520" }, textColor: "#9fb0c3", fontFamily: "Inter, Arial, sans-serif", attributionLogo: false },
      grid: { vertLines: { color: "rgba(75,95,120,.13)" }, horzLines: { color: "rgba(75,95,120,.18)" } },
      crosshair: { mode: 1, vertLine: { color: "#8294a8", width: 1, style: 2 }, horzLine: { color: "#8294a8", width: 1, style: 2 } },
      rightPriceScale: {
        borderColor: "#26384b",
        scaleMargins: { top: isMobile ? 0.16 : 0.10, bottom: isMobile ? 0.24 : 0.20 },
        minimumWidth: isMobile ? 58 : 72,
      },
      timeScale: {
        borderColor: "#26384b",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: isMobile ? 10 : 8,
        barSpacing: isMobile ? 9 : 7,
        minBarSpacing: 3,
        lockVisibleTimeRangeOnResize: true,
      },
      localization: { locale: "en-US" },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });
    chartRef.current = chart;
    const candlesSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#16c784",
      downColor: "#ea3943",
      borderUpColor: "#16c784",
      borderDownColor: "#ea3943",
      borderVisible: true,
      wickUpColor: "#16c784",
      wickDownColor: "#ea3943",
      wickVisible: true,
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineColor: "#8b9bad",
      priceLineStyle: 2,
    });
    candleRef.current = candlesSeries;
    const closeLine = chart.addSeries(LineSeries, { color: "#26a7ff", lineWidth: 2, lastValueVisible: true, priceLineVisible: false });
    closeLine.applyOptions({ visible: chartType === "line" });
    candlesSeries.applyOptions({ visible: chartType === "candle" });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" }, priceScaleId: "volume",
      priceLineVisible: false, lastValueVisible: false,
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 }, visible: false });

    const maSeries = chart.addSeries(LineSeries, { color: "#f6c453", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const emaSeries = chart.addSeries(LineSeries, { color: "#42a5f5", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const bbUpper = chart.addSeries(LineSeries, { color: "rgba(167,139,250,.8)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const bbMid = chart.addSeries(LineSeries, { color: "rgba(167,139,250,.55)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const bbLower = chart.addSeries(LineSeries, { color: "rgba(167,139,250,.8)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const rsiSeries = chart.addSeries(LineSeries, { color: "#c084fc", lineWidth: 2, priceLineVisible: false, lastValueVisible: true }, 1);
    const macdSeries = chart.addSeries(LineSeries, { color: "#42a5f5", lineWidth: 2, priceLineVisible: false, lastValueVisible: false }, 2);
    const signalSeries = chart.addSeries(LineSeries, { color: "#f6c453", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, 2);
    const macdHist = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, 2);
    seriesRefs.current = { closeLine, volumeSeries, maSeries, emaSeries, bbUpper, bbMid, bbLower, rsiSeries, macdSeries, signalSeries, macdHist };

    const setSeriesVisibility = () => {
      const r = seriesRefs.current;
      if (!r.closeLine) return;
      r.closeLine.applyOptions({ visible: chartType === "line" });
      candlesSeries.applyOptions({ visible: chartType === "candle" });
      r.volumeSeries.applyOptions({ visible: indicators.volume });
      r.maSeries.applyOptions({ visible: indicators.ma });
      r.emaSeries.applyOptions({ visible: indicators.ema });
      [r.bbUpper, r.bbMid, r.bbLower].forEach(x => x.applyOptions({ visible: indicators.bb }));
      r.rsiSeries.applyOptions({ visible: indicators.rsi });
      r.macdSeries.applyOptions({ visible: indicators.macd });
      r.signalSeries.applyOptions({ visible: indicators.macd });
      r.macdHist.applyOptions({ visible: indicators.macd });
    };
    setSeriesVisibility();

    const applyData = (data, fit = false) => {
      if (!alive || !data.length) return;
      candles = data;
      candlesSeries.setData(data);
      closeLine.setData(data.map(x => ({ time: x.time, value: x.close })));
      volumeSeries.setData(data.map(x => ({ time: x.time, value: x.volume || 0, color: x.close >= x.open ? "rgba(0,192,135,.35)" : "rgba(224,82,96,.35)" })));
      maSeries.setData(calcSMA(data, 20));
      emaSeries.setData(calcEMA(data, 20));
      const bb = calcBollinger(data);
      bbUpper.setData(bb.upper); bbMid.setData(bb.mid); bbLower.setData(bb.lower);
      rsiSeries.setData(calcRSI(data));
      const macd = calcMACD(data);
      macdSeries.setData(macd.line); signalSeries.setData(macd.signal); macdHist.setData(macd.hist);
      setLastPrice(data[data.length - 1].close);
      if (fit) {
        // Start with a readable number of recent candles instead of squeezing
        // all 500 candles into a narrow mobile screen.
        const visibleBars = isMobile ? 48 : 90;
        const from = Math.max(0, data.length - visibleBars);
        chart.timeScale().setVisibleLogicalRange({
          from,
          to: data.length + (isMobile ? 4 : 6),
        });
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
            setStatus("Live · Binance market data");
          } catch (_) {}
        };
        socket.onerror = () => { if (alive) setStatus("Live feed reconnecting..."); };
        socket.onclose = () => {
          if (alive) retryTimer = setTimeout(connectSocket, 2500);
        };
      } catch (_) { setStatus("Live feed unavailable"); }
    };

    const load = async () => {
      if (!supported) { setStatus("Unsupported market symbol"); return; }
      setStatus("Loading historical candles...");
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${interval}&limit=${CHART_LIMIT}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Market data error (${response.status})`);
        const rows = await response.json();
        if (!Array.isArray(rows)) throw new Error("Invalid market data");
        const parsed = rows.map(x => ({ time: Math.floor(x[0] / 1000), open: +x[1], high: +x[2], low: +x[3], close: +x[4], volume: +x[5] }));
        if (!alive) return;
        applyData(parsed, true);
        setStatus("Live · Binance market data");
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
      chartRef.current = null;
      candleRef.current = null;
      seriesRefs.current = {};
    };
  }, [sym, timeframe, chartType, indicators]);

  useEffect(() => {
    if (Number.isFinite(Number(price)) && Number(price) > 0) setLastPrice(Number(price));
  }, [price]);

  const toggleFullscreen = async () => {
    const el = hostRef.current?.parentElement;
    if (!el) return;
    try {
      if (!document.fullscreenElement) { await el.requestFullscreen(); setFull(true); }
      else { await document.exitFullscreen(); setFull(false); }
    } catch (_) {}
  };

  return (
    <div className="cx-chart-wrap">
      <div className="cx-chart-toolbar">
        <div className="cx-chart-tfs">
          {TF.map(tf => <button key={tf} type="button" className={timeframe === tf ? "active" : ""} onClick={() => setTimeframe(tf)}>{tf}</button>)}
        </div>
        <div className="cx-chart-tools">
          <button type="button" className={chartType === "candle" ? "active" : ""} onClick={() => setChartType("candle")} title="Candlestick">Candles</button>
          <button type="button" className={chartType === "line" ? "active" : ""} onClick={() => setChartType("line")} title="Line chart">Line</button>
          <button type="button" onClick={toggleFullscreen} title="Fullscreen">⛶</button>
        </div>
      </div>
      <div className="cx-chart-indicators">
        {[ ["volume","VOL"], ["ma","MA 20"], ["ema","EMA 20"], ["bb","BB"], ["rsi","RSI"], ["macd","MACD"] ].map(([key,label]) =>
          <button key={key} type="button" className={indicators[key] ? "selected" : ""} onClick={() => toggle(key)}>{label}</button>
        )}
        <span className="cx-chart-status">{status}</span>
      </div>
      <div className="cx-chart-price">{lastPrice != null ? Number(lastPrice).toLocaleString("en-US", { maximumFractionDigits: 8 }) : "--"} <small>{sym}/USDT</small></div>
      <div className="cx-chart-canvas" ref={hostRef} />
      <div className="cx-chart-attribution">TradingView Lightweight Charts™ — Copyright (с) 2025 TradingView, Inc. <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView</a></div>
    </div>
  );
}


/* ---------------- Bottom sheet ---------------- */
function Sheet({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="cx-op-ov" onClick={onClose}>
      <div className="cx-op-sh" onClick={(e) => e.stopPropagation()}>
        <div className="cx-op-sh-h">
          <b>{title}</b>
          <button type="button" onClick={onClose} aria-label="close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const CSS = `
/* Desktop matches the supplied full-width trading-terminal reference. */
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
.cx-op-chart{flex:1;min-height:360px;position:relative;overflow:hidden}
.cx-chart-wrap{position:absolute;inset:0;display:flex;flex-direction:column;min-height:0;background:#0b1520;overflow:hidden}
.cx-chart-toolbar{display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:40px;padding:4px 8px;border-bottom:1px solid #1d2d40;background:#0d1927;flex:none}
.cx-chart-tfs,.cx-chart-tools{display:flex;align-items:center;gap:3px;min-width:0}
.cx-chart-toolbar button,.cx-chart-indicators button{border:0;background:transparent;color:#9fb0c3;border-radius:4px;padding:5px 7px;font-size:11px;cursor:pointer;white-space:nowrap}
.cx-chart-toolbar button.active,.cx-chart-indicators button.selected{background:#17304a;color:#60b7ff}
.cx-chart-indicators{display:flex;align-items:center;gap:3px;min-height:30px;padding:2px 8px;flex:none;overflow-x:auto;border-bottom:1px solid #17283a}
.cx-chart-indicators button{font-size:10px;padding:4px 6px}
.cx-chart-status{margin-left:auto;color:#71869b;font-size:10px;white-space:nowrap}
.cx-chart-price{position:absolute;z-index:2;top:78px;left:12px;color:#e6edf5;font-size:15px;font-weight:700;pointer-events:none;text-shadow:0 1px 3px #000;background:rgba(11,21,32,.72);padding:4px 7px;border-radius:5px}
.cx-chart-price small{font-size:10px;color:#8294a8;font-weight:400}
.cx-chart-canvas{flex:1;min-height:0;width:100%}
.cx-chart-attribution{flex:none;text-align:right;padding:3px 8px;color:#62758a;font-size:9px;background:#0b1520}
.cx-chart-attribution a{color:#8294a8;text-decoration:none}
.cx-chart-attribution a:hover{color:#60b7ff}

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

/* Mobile chart: larger candle area, horizontal timeframe scrolling,
   separate compact tool row, and enough spacing for readable candle bodies. */
@media(max-width:600px){
  .cx-op{height:100dvh;min-height:620px;overflow:hidden}
  .cx-op-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}
  .cx-op-chart{flex:1 0 430px;min-height:430px}
  .cx-chart-wrap{min-height:430px}
  .cx-chart-toolbar{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:2px;min-height:68px;padding:4px 7px}
  .cx-chart-tfs{width:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .cx-chart-tfs::-webkit-scrollbar,.cx-chart-indicators::-webkit-scrollbar{display:none}
  .cx-chart-tools{width:100%;justify-content:flex-end}
  .cx-chart-toolbar button{font-size:11px;padding:5px 8px;min-height:27px}
  .cx-chart-indicators{min-height:32px;gap:5px;padding:3px 7px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .cx-chart-indicators button{font-size:10px;padding:5px 8px;min-height:25px}
  .cx-chart-status{font-size:9px}
  .cx-chart-price{top:108px;left:9px;font-size:13px;padding:3px 6px}
  .cx-chart-canvas{min-height:300px;touch-action:pan-y}
  .cx-chart-attribution{font-size:8px;padding:4px 7px}
  .cx-op-info{padding:9px 12px}
  .cx-op-pr b{font-size:21px}
}
@media(max-width:380px){
  .cx-op-chart{flex-basis:410px;min-height:410px}
  .cx-chart-wrap{min-height:410px}
  .cx-chart-toolbar button{padding:4px 6px;font-size:10px}
  .cx-chart-indicators button{padding:4px 6px}
  .cx-chart-status{display:none}
}

@media(min-width:900px){
  /* Full-width terminal: header, market stats, large chart, bottom trade strip */
  .cx-op{
    height:100vh;
    min-height:680px;
    padding-bottom:var(--cx-bar-h);
    overflow:hidden;
  }
  .cx-op-top{height:46px;min-height:46px}
  .cx-op-info{
    grid-template-columns:minmax(260px,38%) minmax(0,1fr);
    min-height:84px;
    padding:12px 14px;
  }
  .cx-op-pr b{font-size:20px}
  .cx-op-st{
    grid-template-columns:auto minmax(0,1fr);
    grid-auto-flow:row;
    align-content:center;
    gap:2px 12px;
    line-height:1.25;
  }
  .cx-op-st i{display:block;font-size:13px}
  .cx-op-st b{font-size:13px}
  .cx-op-body{
    display:flex;
    flex:1;
    min-height:0;
    height:auto;
    flex-direction:column;
    overflow:hidden;
  }
  .cx-op-chart{flex:1;min-height:0;width:100%}
  .cx-chart-wrap{min-height:0}
  .cx-chart-toolbar{min-height:36px}
  .cx-chart-indicators{min-height:28px}
  .cx-op-bar{
    position:fixed;
    left:0;
    right:0;
    bottom:0;
    z-index:60;
    display:grid;
    grid-template-columns:1fr 1fr 2fr 2fr;
    gap:12px;
    align-items:center;
    width:100%;
    height:var(--cx-bar-h);
    padding:5px 12px;
    border-top:1px solid #3a4b5e;
    border-left:0;
    background:#0f2030;
  }
  .cx-op-pick{
    flex-direction:column;
    justify-content:center;
    height:100%;
    padding:0 8px;
    border:0;
    border-radius:0;
    background:transparent;
    line-height:1.2;
  }
  .cx-op-pick span{font-size:13px}
  .cx-op-go{height:44px}
  .cx-op-yl{display:none}
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

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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
        <div className="cx-op-chart">
          <Chart sym={sym} price={p.price} />
        </div>

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