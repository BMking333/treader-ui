import React, { useEffect, useState } from "react";
import { GREEN, RED, COINS, useT, fmt, fmtV, Ic, ICON, Coin, LangPicker } from "../lib/cex";
import img1 from "../assets/Image1.png";
import img2 from "../assets/Image2.png";
import img3 from "../assets/Image3.png";

const BANNERS = [img1, img2, img3];

/* ---------------- Coin list (Home + Market দুই জায়গায় ব্যবহার হয়) ---------------- */
export function List({ P, go, names }) {
  const t = useT();
  return (
    <>
      <div className="cx-th"><span>{t("name")}</span><span>{t("lp")}</span><span>{t("chg")}</span></div>
      {COINS.map((s) => (
        <button key={s} className="cx-row" onClick={() => go("exchange", s)}>
          <span className="cx-nm">
            <Coin s={s} size={names ? 38 : 42} />
            {names
              ? <span><b>{s}<small>/USDT</small></b><small>24H {fmtV(P[s].vol)}</small></span>
              : <b>{s}<small>/USDT</small></b>}
          </span>
          <span className="cx-pr">{names ? <><b>{fmt(P[s].price)}</b><small>$ {P[s].price.toFixed(2)}</small></> : <b>{fmt(P[s].price)}</b>}</span>
          <span className="cx-pill" style={{ background: P[s].chg >= 0 ? GREEN : RED }}>{P[s].chg >= 0 ? "+" : ""}{Math.abs(P[s].chg) < 0.005 ? "0" : P[s].chg.toFixed(2)}%</span>
        </button>
      ))}
    </>
  );
}

/* ---------------- Home ---------------- */
export default function Home({ P, go, lang, setLang, onMenu }) {
  const t = useT();
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % 3), 3500); return () => clearInterval(id); }, []);
  const tick = ["ETH", "DOGE", "BCH"].map((s, k) => ["ETH", "DOGE", "BCH", "TRX", "SHIB", "LTC"][(k + i * 3) % 6]);
  const acts = [["rech", "card", "deposit"], ["wd", "card", "withdraw"], ["cs", "chat", "home"], ["swap", "swap", "exchange"], ["loan", "loan", "home"], ["tf", "card", "assets"]];
  return (
    <>
      <div className="cx-bar">
        <button className="cx-logo" onClick={onMenu} aria-label="menu">C</button>
        <LangPicker lang={lang} setLang={setLang} />
      </div>
      <div className="cx-banner">
        <div className="cx-slides" style={{ transform: `translateX(-${i * 100}%)` }}>
          {BANNERS.map((b, k) => <img key={k} src={b} alt="" draggable="false" />)}
        </div>
        <div className="cx-dots">{BANNERS.map((_, d) => <i key={d} className={d === i ? "on" : ""} onClick={() => setI(d)} />)}</div>
      </div>
      <div className="cx-tick">
        {tick.map((s) => (
          <button key={s} onClick={() => go("exchange", s)}>
            <span>{s}/USDT</span><b style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{fmt(P[s].price)}</b>
            <em style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{P[s].chg.toFixed(2)}%</em>
          </button>
        ))}
      </div>
      <div className="cx-grid">
        {acts.map(([l, ic, to]) => (
          <button key={l} onClick={() => go(to)}><span style={{ color: "#17c3c9" }}><Ic d={ICON[ic]} s={34} /></span>{t(l)}</button>
        ))}
      </div>
      <h3 className="cx-h">{t("chg")}</h3>
      <List P={P} go={go} />
    </>
  );
}
