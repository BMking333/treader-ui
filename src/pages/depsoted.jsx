import React, { useState } from "react";
import { useT, api } from "./Home";

/* =====================================================================
   src/pages/depsoted.jsx — Deposit পেজ + shared (NETS, Chips, TxList)
   ===================================================================== */

export const NETS = { USDT: ["TRC20", "ERC20"], USDC: ["ERC20"], ETH: ["ERC20"], BTC: ["BTC"] };
const isDone = (x) => x.type === "dep" || /done|success|complete|approved|paid/i.test(x.status || "");

export function TxList({ txs, type }) {
  const t = useT();
  const l = txs.filter((x) => x.type === type);
  return (
    <div className="cx-hist">
      <h3>{t("hist")}</h3>
      {l.length ? l.map((x) => (
        <div key={x.id} className="cx-tx">
          <span><b>{x.type === "dep" ? "+" : "-"}{x.amt} {x.coin}</b><small>{x.net} · {new Date(x.time).toLocaleString()}</small></span>
          <span className={"st " + (isDone(x) ? "dep" : "wd")}>{t(isDone(x) ? "done" : "proc")}</span>
        </div>
      )) : <div className="cx-empty2">{t("norec")}</div>}
    </div>
  );
}

export function Chips({ list, v, set }) {
  return <div className="cx-chips">{list.map((x) => <button key={x} className={x === v ? "on" : ""} onClick={() => set(x)}>{x}</button>)}</div>;
}

export default function Deposit({ W, go, txs }) {
  const t = useT();
  const [coin, setCoin] = useState("USDT"), [net, setNet] = useState("TRC20"), [amt, setAmt] = useState(""), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false });
  const nl = NETS[coin], nn = nl.includes(net) ? net : nl[0];
  const pickCoin = (c) => { setCoin(c); setNet(NETS[c][0]); };
  const submit = async () => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    const a = parseFloat(amt);
    if (!(a > 0)) return setMsg({ k: "eAmt", ok: false });
    setBusy(true);
    try {
      await api("/deposit", { method: "POST", body: { coin, net: nn, amount: a } });
      await W.reload();
      setAmt(""); setMsg({ k: "depOk", ok: true });
    } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  return (
    <>
      <div className="cx-top"><button onClick={() => go("home")}>‹</button><h1>{t("dep")}</h1><span /></div>
      <div className="cx-fm">
        <h4>{t("coin")}</h4><Chips list={Object.keys(NETS)} v={coin} set={pickCoin} />
        <h4>{t("net")}</h4><Chips list={nl} v={nn} set={setNet} />
        <h4>{t("amount")}</h4>
        <div className="cx-in"><input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={t("amount")} inputMode="decimal" /><b>{coin}</b></div>
        {msg.k && <p className={"cx-msg" + (msg.ok ? "" : " bad")} style={{ margin: "10px 0 0" }}>{t(msg.k)}</p>}
        <button className="cx-a1 flat" style={{ opacity: busy ? 0.6 : 1 }} onClick={submit}>{t("submit")}</button>
      </div>
      <TxList txs={txs} type="dep" />
    </>
  );
}
