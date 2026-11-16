import React, { useEffect, useRef, useState } from "react";
import {
  createChart, CandlestickSeries, BarSeries, LineSeries, AreaSeries, BaselineSeries, HistogramSeries,
} from "lightweight-charts";
import { useT, api, fmt, fmtV, Ic, ICON, COINS, Coin, YIELD, CUP, CDN } from "./Home";

const OPEN_PATH = "/options/open";
const STATUS_PATH = "/options/status";
const DIR = { long: "long", short: "short" };
const MIN_Q = 10, MAX_Q = 100000;
const QTY = [10, 1000, 10000, 100000];
const SECS = [10, 30, 70, 90, 180];

const isLong = (d) => /long|up|buy|call|rise/i.test(String(d));
const fq = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

const TF_LIST = [
  ["1m", "1 minute"], ["5m", "5 minutes"], ["15m", "15 minutes"], ["30m", "30 minutes"], null,
  ["1h", "1 hour"], ["4h", "4 hours"], null,
  ["1d", "1 day"], ["1w", "1 week"], ["1M", "1 month"],
];
const TF_LABEL = { "1d": "D", "1w": "W", "1M": "M" };
const tfLabel = (tf) => TF_LABEL[tf] || tf;
const CHART_LIMIT = 500;

const TYPES = [
  ["bars", "Bars"], ["candle", "Candles"], ["hollow", "Hollow Candles"], ["heikin", "Heikin Ashi"],
  ["line", "Line"], ["area", "Area"], ["baseline", "Baseline"],
];

const UP = "#1fa67a";
const DOWN = "#e5101d";
const CLEAR = "rgba(0,0,0,0)";

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

const ST_LIVE = "@live";
const ST_LOADING = "@loading";
const ST_RECONN = "@reconn";

const fmtP = (v) => {
  const n = Number(v);
  if (!isFinite(n)) return "--";
  return n >= 100 ? n.toFixed(2) : n >= 1 ? n.toFixed(4) : n.toFixed(8);
};

const cl = (d) => d.map((x) => x.close);
const ts = (d, vals) => d.map((x, i) => ({ time: x.time, value: vals[i] })).filter((x) => x.value != null && isFinite(x.value));

const smaV = (a, n) => a.map((_, i) => {
  if (i < n - 1) return null;
  let s = 0;
  for (let j = i - n + 1; j <= i; j++) {
    if (a[j] == null) return null;
    s += a[j];
  }
  return s / n;
});

const emaV = (a, n) => {
  const out = a.map(() => null);
  const f = a.findIndex((x) => x != null);
  if (f < 0 || a.length - f < n) return out;
  const k = 2 / (n + 1);
  let v = 0;
  for (let j = f; j < f + n; j++) v += a[j];
  v /= n;
  out[f + n - 1] = v;
  for (let i = f + n; i < a.length; i++) {
    v = a[i] * k + v * (1 - k);
    out[i] = v;
  }
  return out;
};

const rmaV = (a, n) => {
  const out = a.map(() => null);
  const f = a.findIndex((x) => x != null);
  if (f < 0 || a.length - f < n) return out;
  let v = 0;
  for (let j = f; j < f + n; j++) v += a[j];
  v /= n;
  out[f + n - 1] = v;
  for (let i = f + n; i < a.length; i++) {
    v = (v * (n - 1) + a[i]) / n;
    out[i] = v;
  }
  return out;
};

const wmaV = (a, n) => a.map((_, i) => {
  if (i < n - 1) return null;
  let s = 0;
  for (let j = 0; j < n; j++) s += a[i - n + 1 + j] * (j + 1);
  return s / ((n * (n + 1)) / 2);
});

const rollMax = (a, n) => a.map((_, i) => (i < n - 1 ? null : Math.max(...a.slice(i - n + 1, i + 1))));
const rollMin = (a, n) => a.map((_, i) => (i < n - 1 ? null : Math.min(...a.slice(i - n + 1, i + 1))));

const rsiV = (c, n = 14) => {
  const g = c.map((x, i) => (i ? Math.max(x - c[i - 1], 0) : null));
  const l = c.map((x, i) => (i ? Math.max(c[i - 1] - x, 0) : null));
  const ag = rmaV(g, n), al = rmaV(l, n);
  return ag.map((x, i) => (x == null ? null : al[i] === 0 ? 100 : 100 - 100 / (1 + x / al[i])));
};

const trV = (d) => d.map((x, i) => (i ? Math.max(x.high - x.low, Math.abs(x.high - d[i - 1].close), Math.abs(x.low - d[i - 1].close)) : x.high - x.low));

const haCalc = (d) => {
  const out = [];
  d.forEach((x, i) => {
    const c = (x.open + x.high + x.low + x.close) / 4;
    const o = i ? (out[i - 1].open + out[i - 1].close) / 2 : (x.open + x.close) / 2;
    out.push({ time: x.time, open: o, high: Math.max(x.high, o, c), low: Math.min(x.low, o, c), close: c });
  });
  return out;
};

const IND = {
  volume: {
    label: "Volume", sub: true, defs: [{ t: "h", vol: true }],
    calc: (d) => [d.map((x) => ({ time: x.time, value: x.volume || 0, color: x.close >= x.open ? "rgba(31,166,122,.45)" : "rgba(229,16,29,.45)" }))],
  },
  ma: { label: "Moving Average (9)", defs: [{ c: "#f57c00" }], calc: (d) => [ts(d, smaV(cl(d), 9))] },
  ema: { label: "Exponential Moving Average (20)", defs: [{ c: "#1a82d6" }], calc: (d) => [ts(d, emaV(cl(d), 20))] },
  wma: { label: "Weighted Moving Average (20)", defs: [{ c: "#00a3a3" }], calc: (d) => [ts(d, wmaV(cl(d), 20))] },
  bb: {
    label: "Bollinger Bands", defs: [{ c: "rgba(124,92,230,.85)" }, { c: "rgba(124,92,230,.55)" }, { c: "rgba(124,92,230,.85)" }],
    calc: (d) => {
      const c = cl(d), m = smaV(c, 20);
      const sd = c.map((_, i) => {
        if (m[i] == null) return null;
        const w = c.slice(i - 19, i + 1);
        return Math.sqrt(w.reduce((a, x) => a + Math.pow(x - m[i], 2), 0) / 20);
      });
      return [ts(d, m.map((x, i) => (x == null ? null : x + 2 * sd[i]))), ts(d, m), ts(d, m.map((x, i) => (x == null ? null : x - 2 * sd[i])))];
    },
  },
  donchian: {
    label: "Donchian Channels", defs: [{ c: "#2e7d32" }, { c: "#8d6e63" }, { c: "#c62828" }],
    calc: (d) => {
      const hh = rollMax(d.map((x) => x.high), 20), ll = rollMin(d.map((x) => x.low), 20);
      return [ts(d, hh), ts(d, hh.map((x, i) => (x == null ? null : (x + ll[i]) / 2))), ts(d, ll)];
    },
  },
  vwap: {
    label: "VWAP", defs: [{ c: "#ad1457", w: 2 }],
    calc: (d) => {
      let pv = 0, v = 0;
      return [ts(d, d.map((x) => {
        const tp = (x.high + x.low + x.close) / 3;
        pv += tp * (x.volume || 0);
        v += x.volume || 0;
        return v ? pv / v : null;
      }))];
    },
  },
  avgprice: { label: "Average Price", defs: [{ c: "#6d4c41" }], calc: (d) => [ts(d, d.map((x) => (x.open + x.high + x.low + x.close) / 4))] },
  rsi: { label: "Relative Strength Index", sub: true, defs: [{ c: "#9c27b0", w: 2 }], calc: (d) => [ts(d, rsiV(cl(d)))] },
  macd: {
    label: "MACD", sub: true, defs: [{ t: "h" }, { c: "#1a82d6", w: 2 }, { c: "#f57c00" }],
    calc: (d) => {
      const c = cl(d), f = emaV(c, 12), s = emaV(c, 26);
      const line = f.map((x, i) => (x == null || s[i] == null ? null : x - s[i]));
      const sig = emaV(line, 9);
      const hist = d.map((x, i) => (line[i] == null || sig[i] == null ? null : { time: x.time, value: line[i] - sig[i], color: line[i] >= sig[i] ? UP : DOWN })).filter(Boolean);
      return [hist, ts(d, line), ts(d, sig)];
    },
  },
  stoch: {
    label: "Stochastic", sub: true, defs: [{ c: "#1a82d6", w: 2 }, { c: "#f57c00" }],
    calc: (d) => {
      const c = cl(d), hh = rollMax(d.map((x) => x.high), 14), ll = rollMin(d.map((x) => x.low), 14);
      const k = c.map((x, i) => (hh[i] == null ? null : hh[i] === ll[i] ? 50 : ((x - ll[i]) / (hh[i] - ll[i])) * 100));
      return [ts(d, k), ts(d, smaV(k, 3))];
    },
  },
  atr: { label: "Average True Range", sub: true, defs: [{ c: "#e65100", w: 2 }], calc: (d) => [ts(d, rmaV(trV(d), 14))] },
  cci: {
    label: "Commodity Channel Index", sub: true, defs: [{ c: "#00796b", w: 2 }],
    calc: (d) => {
      const tp = d.map((x) => (x.high + x.low + x.close) / 3), s = smaV(tp, 20);
      const v = tp.map((x, i) => {
        if (s[i] == null) return null;
        const md = tp.slice(i - 19, i + 1).reduce((a, y) => a + Math.abs(y - s[i]), 0) / 20;
        return md ? (x - s[i]) / (0.015 * md) : 0;
      });
      return [ts(d, v)];
    },
  },
  willr: {
    label: "Williams %R", sub: true, defs: [{ c: "#5e35b1", w: 2 }],
    calc: (d) => {
      const c = cl(d), hh = rollMax(d.map((x) => x.high), 14), ll = rollMin(d.map((x) => x.low), 14);
      return [ts(d, c.map((x, i) => (hh[i] == null ? null : hh[i] === ll[i] ? -50 : ((hh[i] - x) / (hh[i] - ll[i])) * -100)))];
    },
  },
  obv: {
    label: "On Balance Volume", sub: true, defs: [{ c: "#0277bd", w: 2 }],
    calc: (d) => {
      let o = 0;
      return [ts(d, d.map((x, i) => {
        if (i) o += x.close > d[i - 1].close ? x.volume || 0 : x.close < d[i - 1].close ? -(x.volume || 0) : 0;
        return o;
      }))];
    },
  },
  mom: { label: "Momentum", sub: true, defs: [{ c: "#3949ab", w: 2 }], calc: (d) => [ts(d, cl(d).map((x, i) => (i < 10 ? null : x - d[i - 10].close)))] },
  roc: { label: "Rate Of Change", sub: true, defs: [{ c: "#8e24aa", w: 2 }], calc: (d) => [ts(d, cl(d).map((x, i) => (i < 12 || !d[i - 12].close ? null : (x / d[i - 12].close - 1) * 100)))] },
  ao: {
    label: "Awesome Oscillator", sub: true, defs: [{ t: "h" }],
    calc: (d) => {
      const m = d.map((x) => (x.high + x.low) / 2), a = smaV(m, 5), b = smaV(m, 34);
      const v = a.map((x, i) => (x == null || b[i] == null ? null : x - b[i]));
      return [d.map((x, i) => (v[i] == null ? null : { time: x.time, value: v[i], color: i && v[i - 1] != null && v[i] < v[i - 1] ? DOWN : UP })).filter(Boolean)];
    },
  },
  cmf: {
    label: "Chaikin Money Flow", sub: true, defs: [{ c: "#00897b", w: 2 }],
    calc: (d) => {
      const mfv = d.map((x) => (x.high === x.low ? 0 : (((x.close - x.low) - (x.high - x.close)) / (x.high - x.low)) * (x.volume || 0)));
      const vol = d.map((x) => x.volume || 0);
      const a = smaV(mfv, 20), b = smaV(vol, 20);
      return [ts(d, a.map((x, i) => (x == null || !b[i] ? null : x / b[i])))];
    },
  },
  bop: { label: "Balance of Power", sub: true, defs: [{ c: "#d84315", w: 2 }], calc: (d) => [ts(d, d.map((x) => (x.high === x.low ? 0 : (x.close - x.open) / (x.high - x.low))))] },
  aroon: {
    label: "Aroon", sub: true, defs: [{ c: UP, w: 2 }, { c: DOWN, w: 2 }],
    calc: (d) => {
      const up = d.map((_, i) => {
        if (i < 25) return null;
        const w = d.slice(i - 25, i + 1).map((x) => x.high);
        return (w.lastIndexOf(Math.max(...w)) / 25) * 100;
      });
      const dn = d.map((_, i) => {
        if (i < 25) return null;
        const w = d.slice(i - 25, i + 1).map((x) => x.low);
        return (w.lastIndexOf(Math.min(...w)) / 25) * 100;
      });
      return [ts(d, up), ts(d, dn)];
    },
  },
};
const IND_KEYS = Object.keys(IND).sort((a, b) => IND[a].label.localeCompare(IND[b].label));

function Chart({ sym, tt, dark }) {
  const hostRef = useRef(null);
  const [timeframe, setTimeframe] = useState("1d");
  const [chartType, setChartType] = useState("candle");
  const [active, setActive] = useState(["volume", "ma"]);
  const [status, setStatus] = useState("");
  const [menu, setMenu] = useState("");
  const [legend, setLegend] = useState(null);
  const [iq, setIq] = useState("");

  const toggle = (key) => setActive((old) => (old.includes(key) ? old.filter((k) => k !== key) : [...old, key]));
  const indKey = active.join(",");

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

    const lineLike = chartType === "line" || chartType === "area" || chartType === "baseline";
    let main;
    if (chartType === "line") {
      main = chart.addSeries(LineSeries, { color: "#1a82d6", lineWidth: 2, lastValueVisible: true, priceLineVisible: true, priceLineStyle: 1 });
    } else if (chartType === "area") {
      main = chart.addSeries(AreaSeries, { lineColor: "#1a82d6", topColor: "rgba(26,130,214,.35)", bottomColor: "rgba(26,130,214,.02)", lineWidth: 2, lastValueVisible: true, priceLineVisible: true, priceLineStyle: 1 });
    } else if (chartType === "baseline") {
      main = chart.addSeries(BaselineSeries, {
        topLineColor: UP, bottomLineColor: DOWN, lineWidth: 2,
        topFillColor1: "rgba(31,166,122,.28)", topFillColor2: "rgba(31,166,122,.05)",
        bottomFillColor1: "rgba(229,16,29,.05)", bottomFillColor2: "rgba(229,16,29,.28)",
        lastValueVisible: true, priceLineVisible: true, priceLineStyle: 1,
      });
    } else if (chartType === "bars") {
      main = chart.addSeries(BarSeries, { upColor: UP, downColor: DOWN, lastValueVisible: true, priceLineVisible: true, priceLineStyle: 1 });
    } else {
      main = chart.addSeries(CandlestickSeries, {
        upColor: chartType === "hollow" ? CLEAR : UP, downColor: DOWN,
        borderUpColor: UP, borderDownColor: DOWN,
        wickUpColor: UP, wickDownColor: DOWN,
        borderVisible: true, wickVisible: true,
        priceLineVisible: true, priceLineStyle: 1, priceLineWidth: 1,
        lastValueVisible: true,
      });
    }

    const actKeys = indKey ? indKey.split(",").filter((k) => IND[k]) : [];
    const paneOf = {};
    let nextPane = 1;
    actKeys.forEach((k) => { if (IND[k].sub) paneOf[k] = nextPane++; });
    const built = actKeys.map((k) => {
      const spec = IND[k];
      const pane = spec.sub ? paneOf[k] : 0;
      const ser = spec.defs.map((df) => (df.t === "h"
        ? chart.addSeries(HistogramSeries, df.vol ? { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false } : { priceLineVisible: false, lastValueVisible: false }, pane)
        : chart.addSeries(LineSeries, { color: df.c, lineWidth: df.w || 1, priceLineVisible: false, lastValueVisible: false }, pane)));
      return { spec, ser };
    });

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
        main.applyOptions({ priceFormat: { type: "price", precision, minMove: 1 / Math.pow(10, precision) } });
        if (chartType === "baseline") {
          main.applyOptions({ baseValue: { type: "price", price: data[Math.max(0, data.length - 70)].close } });
        }
        precisionSet = true;
      }
      if (lineLike) main.setData(data.map((x) => ({ time: x.time, value: x.close })));
      else if (chartType === "heikin") main.setData(haCalc(data));
      else main.setData(data);

      if (actKeys.includes("ma")) maMap = new Map(ts(data, smaV(cl(data), 9)).map((x) => [x.time, x.value]));
      built.forEach(({ spec, ser }) => {
        const res = spec.calc(data);
        ser.forEach((s, i) => s.setData(res[i] || []));
      });
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
  }, [sym, timeframe, chartType, indKey, dark]);

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
  const iqn = iq.trim().toLowerCase();
  const indShown = IND_KEYS.filter((k) => !iqn || IND[k].label.toLowerCase().includes(iqn));

  return (
    <div className="cx-chart-wrap">
      <div className="cx-chart-toolbar">
        <button type="button" className="cx-tb-cell" onClick={() => setMenu(menu === "tf" ? "" : "tf")}>{tfLabel(timeframe)}</button>
        <button type="button" className="cx-tb-cell" onClick={() => setMenu(menu === "type" ? "" : "type")} aria-label="chart type">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M7 3v4M7 17v4M17 3v2M17 15v6" />
            <rect x="4.5" y="7" width="5" height="10" rx="0.5" />
            <rect x="14.5" y="5" width="5" height="10" rx="0.5" />
          </svg>
        </button>
        <button type="button" className="cx-tb-cell wide" onClick={() => { setIq(""); setMenu("ind"); }}>
          <svg width="26" height="22" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M2 14l5-6 5 5 6-8" />
            <path d="M20 17v6M17 20h6" />
          </svg>
          {tt("ind", "Indicators")}
        </button>
        <span className="cx-chart-status">{statusText}</span>
        <button type="button" className="cx-tb-cell icon" onClick={toggleFullscreen} title="Fullscreen">⛶</button>

        {menu === "tf" && (
          <div className="cx-pop col">
            {TF_LIST.map((it, i) => (it
              ? <button key={it[0]} type="button" className={timeframe === it[0] ? "on" : ""} onClick={() => { setTimeframe(it[0]); setMenu(""); }}>{it[1]}</button>
              : <hr key={"s" + i} />))}
          </div>
        )}
        {menu === "type" && (
          <div className="cx-pop col type">
            {TYPES.map(([k, label]) => (
              <button key={k} type="button" className={chartType === k ? "on" : ""} onClick={() => { setChartType(k); setMenu(""); }}>{label}</button>
            ))}
          </div>
        )}
      </div>

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
              {active.includes("ma") && legend.ma != null && (
                <div className="l4">MA (9, close, 0) ⌄ <b>{fmtP(legend.ma)}</b></div>
              )}
            </>
          )}
        </div>
      </div>

      <Sheet open={menu === "ind"} onClose={() => setMenu("")} title={tt("ind", "Indicators")}>
        <div className="cx-ind-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input type="text" value={iq} onChange={(e) => setIq(e.target.value)} placeholder={tt("search", "Search")} />
        </div>
        <div className="cx-ind-list">
          {indShown.map((k) => (
            <button key={k} type="button" className={"cx-ind-it" + (active.includes(k) ? " on" : "")} onClick={() => toggle(k)}>
              <span>{IND[k].label}</span>
              {active.includes(k) && <em>✓</em>}
            </button>
          ))}
          {indShown.length === 0 && <div className="cx-op-none">{tt("norec", "No data")}</div>}
        </div>
      </Sheet>
    </div>
  );
}

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

.cx-chart-toolbar{position:relative;display:flex;align-items:stretch;min-height:44px;background:#f4f5f7;border-bottom:1px solid #d6dae0;flex:none}
.cx-tb-cell{display:flex;align-items:center;justify-content:center;gap:6px;min-width:52px;padding:0 14px;background:transparent;border:0;border-right:1px solid #d6dae0;font-size:16px;cursor:pointer;color:#222}
.cx-tb-cell.wide{padding:0 14px;font-size:17px}
.cx-tb-cell.icon{border-right:0;border-left:1px solid #d6dae0;min-width:44px;padding:0 10px;font-size:18px}
.cx-chart-status{margin-left:auto;align-self:center;padding:0 8px;color:var(--gray);font-size:10px;white-space:nowrap}
.cx-pop{position:absolute;top:100%;left:0;z-index:12;display:flex;flex-wrap:wrap;gap:4px;width:max-content;max-width:100%;padding:8px;background:#fff;border:1px solid #d6dae0;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.14)}
.cx-pop.type{left:52px}
.cx-pop button{display:flex;align-items:center;justify-content:center;text-align:center;min-width:46px;height:34px;padding:0 12px;border:1px solid #e1e4e9;border-radius:6px;background:#fff;font-size:14px;cursor:pointer}
.cx-pop button.on{border-color:var(--blue);background:#eaf4fd;color:var(--blue)}
.cx-pop.col{flex-direction:column;flex-wrap:nowrap;gap:0;min-width:190px;padding:6px 0}
.cx-pop.col button{justify-content:flex-start;width:100%;height:40px;padding:0 18px;border:0;border-radius:0;background:transparent;font-size:14.5px}
.cx-pop.col button.on{background:var(--blue);color:#fff}
.cx-pop.col hr{margin:6px 0;border:0;border-top:1px solid #e1e4e9}

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

.cx-ind-search{display:flex;align-items:center;gap:10px;height:46px;margin:6px 0 4px;padding:0 12px;border-radius:12px;border:1.5px solid var(--f-bd);background:var(--f-card);color:var(--gray)}
.cx-ind-search:focus-within{border-color:var(--blue)}
.cx-ind-search input{flex:1;min-width:0;height:100%;border:0;outline:0;background:none;font-size:15px;color:var(--f-tx)}
.cx-ind-list{max-height:52vh;overflow:auto;-webkit-overflow-scrolling:touch}
.cx-op button.cx-ind-it{display:flex!important;align-items:center;justify-content:space-between;width:100%;height:44px;padding:0 6px!important;border:0!important;border-bottom:1px solid var(--bd)!important;border-radius:0!important;background:none!important;color:var(--f-tx)!important;font-size:14.5px;text-align:start;cursor:pointer}
.cx-op button.cx-ind-it.on{color:var(--blue)!important;font-weight:600}
.cx-ind-it em{font-style:normal;font-weight:700}

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

.cx-op-toast{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:600;width:max-content;max-width:calc(100% - 48px);
  padding:13px 22px;border-radius:14px;font-size:14.5px;font-weight:500;line-height:1.4;text-align:center;pointer-events:none;
  background:#e8f2fc;color:#1a6fb8;box-shadow:0 14px 40px -12px rgba(0,0,0,.45);animation:cxtoast .2s cubic-bezier(.2,.8,.2,1)}
.cx-op-toast.bad{background:#fdecee;color:#c8323f}
.cx-op-toast.ok{background:#e3f7ee;color:#0a8a5f}
@keyframes cxtoast{from{transform:translate(-50%,-46%) scale(.94);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}

.cx-op-ov{position:fixed;inset:0;z-index:200;background:rgba(8,14,26,.55);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);display:flex;align-items:flex-end;justify-content:center}
.cx-op-sh{width:100%;max-width:520px;max-height:90vh;overflow:auto;background:#fff;border-radius:22px 22px 0 0;padding:10px 18px calc(22px + env(safe-area-inset-bottom,0px));animation:cxup .2s ease-out}
@keyframes cxup{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
.cx-op-grab{display:block;width:40px;height:4px;margin:0 auto 12px;border-radius:4px;background:#d5dae3}
.cx-op-sh-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;font-size:17px;font-weight:700;letter-spacing:-.1px}
.cx-op-sh-h button{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--f-bg);border:0;font-size:14px;cursor:pointer;color:var(--gray)}

.cx-op-sec{display:flex;align-items:center;gap:8px;margin:14px 0 10px;font-size:13px;font-weight:600;color:#4b566b;letter-spacing:.2px}
.cx-op-sec::before{content:"";width:3px;height:13px;border-radius:2px;background:linear-gradient(180deg,var(--blue2),var(--blue))}
.cx-op-sec.t2{margin-top:20px}

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

.cx-op-field{display:flex;align-items:center;gap:8px;height:52px;margin-top:12px;padding:0 8px 0 14px;border-radius:12px;background:var(--f-card);border:1.5px solid var(--f-bd);overflow:hidden;transition:border-color .15s ease,box-shadow .15s ease}
.cx-op-field:focus-within{border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,130,214,.14)}
.cx-op-field input{flex:1;min-width:0;height:100%;border:0;outline:0;background:none;font-size:17px;font-weight:700;color:var(--f-tx);font-variant-numeric:tabular-nums}
.cx-op-field input::placeholder{font-size:14px;font-weight:400;color:var(--gray)}
.cx-op .cx-op-field input,
.cx-op .cx-op-field input:hover,
.cx-op .cx-op-field input:focus,
.cx-op .cx-op-field input:focus-visible,
.cx-op .cx-op-field input:active{outline:none!important;box-shadow:none!important;border:0!important;border-radius:0!important;background:transparent!important;-webkit-appearance:none;-moz-appearance:textfield;appearance:none}
.cx-op .cx-op-field input::-webkit-outer-spin-button,
.cx-op .cx-op-field input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.cx-op-field em{font-style:normal;font-size:12.5px;font-weight:700;color:var(--gray);letter-spacing:.3px;padding-right:6px}
.cx-op-field button{height:34px;padding:0 14px;border:0;border-radius:9px;background:rgba(26,130,214,.12);color:var(--blue)!important;font-size:13px;font-weight:700;cursor:pointer}
.cx-op-field button:active{background:var(--blue);color:#fff!important}

.cx-op-box{margin-top:18px;border-radius:14px;background:var(--f-bg);border:1.5px solid var(--f-bd);overflow:hidden}
.cx-op-box div{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;font-size:13px;border-bottom:1px dashed var(--f-ln)}
.cx-op-box div:last-child{border-bottom:0}
.cx-op-box span{color:var(--gray)}
.cx-op-box b{font-weight:600;color:var(--f-tx);font-variant-numeric:tabular-nums;text-align:end;word-break:break-all}
.cx-op-box b.g{color:var(--grn)}

.cx-op-sbtn{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}
.cx-op-sbtn .cx-op-go{height:52px;font-size:15.5px;border-radius:13px}
.cx-op-hint{margin-top:8px;font-size:12px;color:var(--gray)}

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
.cx-op.dk .cx-pop.col button{background:transparent;border:0}
.cx-op.dk .cx-pop.col button.on{background:#1a82d6;color:#fff}
.cx-op.dk .cx-pop.col hr{border-top-color:#2a3548}
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

.cx-op button.cx-op-opt{border:1.5px solid var(--f-bd)!important;background:var(--f-card)!important;color:var(--f-tx)!important;border-radius:12px!important;box-shadow:none}
.cx-op button.cx-op-opt.on{border:1.5px solid var(--blue)!important;background:#e3f1fd!important;color:var(--blue)!important;box-shadow:0 0 0 3px rgba(26,130,214,.14)}
.cx-op button.cx-op-pick{border:1.5px solid var(--f-bd)!important;background:var(--f-card)!important;border-radius:12px!important}
.cx-op button.cx-op-pick:active{border-color:var(--blue)!important}
.cx-op.dk button.cx-op-opt.on{background:#16335a!important;color:#7cc0ff!important;border-color:#4aa3f0!important;box-shadow:0 0 0 3px rgba(74,163,240,.18)}

.cx-op button.cx-op-pick{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;gap:3px!important;padding:0 6px!important;height:52px!important;line-height:1.15!important;min-width:0}
.cx-op button.cx-op-pick span{display:block;width:100%;text-align:center!important;white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis}
.cx-op button.cx-op-pick span:first-child{display:flex;align-items:center;justify-content:center;gap:5px;font-size:11.5px!important;font-weight:500;color:var(--gray)}
.cx-op button.cx-op-pick span:first-child::after{content:"";flex:none;width:5px;height:5px;margin-top:-3px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg)}
.cx-op button.cx-op-pick span:last-child{font-size:15px!important;font-weight:700;color:var(--f-tx)}
`;

export default function Options({ P, W, sym, setSym, pos = [], orders = [], dark }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

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
  const [secs, setSecs] = useState(SECS[0]);
  const [sh, setSh] = useState("");
  const [cf, setCf] = useState(null);
  const [panel, setPanel] = useState(false);
  const [tab, setTab] = useState("pos");
  const [qIn, setQIn] = useState(String(QTY[0]));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", s: "bad" });
  const [now, setNow] = useState(Date.now());
  const [st, setSt] = useState(null);
  const tm = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => clearTimeout(tm.current), []);

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
  }, [W && W.guest]);

  const flash = (k, s = "bad") => {
    setMsg({ k, s });
    clearTimeout(tm.current);
    tm.current = setTimeout(() => setMsg({ k: "", s: "bad" }), 2600);
  };

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

  const pausedMsg = !st ? ""
    : !st.enabled ? tt("optionsOff", "Options trading is paused")
    : st.blocked ? tt("userBlocked", "Trading is disabled for your account")
    : (st.disabled_syms || []).includes(sym) ? tt("symOff", "This coin is paused")
    : "";
  const paused = !!pausedMsg;
  const minQ = st && st.qty_min > 0 ? st.qty_min : MIN_Q;
  const maxQ = st && st.qty_max > 0 ? st.qty_max : MAX_Q;
  const yld = st && st.yield > 0 ? st.yield : YIELD;

  const check = (withBal = true) => {
    if (W.guest) { W.needLogin(); return false; }
    if (paused) { flash(pausedMsg); return false; }
    if (!(qty >= minQ && qty <= maxQ)) { flash(t("badQ")); return false; }
    if (!SECS.includes(secs)) { flash(tt("badSec", "Invalid time")); return false; }
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

      <div className="cx-op-top">
        <button type="button" className="cx-op-pair" onClick={() => setSh("coin")}>
          <Ic d={ICON.menu} s={24} />{sym}/USDT
        </button>
        <button type="button" onClick={() => setPanel(true)}>
          {t("pos")} <Ic d={ICON.doc} s={24} />
        </button>
      </div>

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

      {paused && <div className="cx-op-off">{pausedMsg}</div>}

      <div className="cx-op-body">
        <div className="cx-op-chart">
          <Chart sym={sym} tt={tt} dark={isDark} />
        </div>

        <div className="cx-op-bar">
          <button type="button" className="cx-op-pick" onClick={() => { setQIn(qty ? String(qty) : ""); setSh("trade"); }}>
            <span>{t("qty")}</span><span>{fq(qty)}</span>
          </button>
          <button type="button" className="cx-op-pick" onClick={() => setSh("trade")}>
            <span>{t("time")}</span><span>{fmtDur(secs)}</span>
          </button>
          <button type="button" className="cx-op-go up" disabled={busy || paused} onClick={() => ask(DIR.long)}>{t("bl")}</button>
          <button type="button" className="cx-op-go dn" disabled={busy || paused} onClick={() => ask(DIR.short)}>{t("ss")}</button>
        </div>
      </div>

      {msg.k && <div className={"cx-op-toast " + msg.s}>{msg.k}</div>}

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
          {SECS.map((s) => (
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
