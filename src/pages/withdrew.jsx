import React, { useState } from "react";
import { useT, api } from "./Home";
import { NETS, Chips, TxList } from "./depsoted";

/* =====================================================================
   src/pages/withdrew.jsx — Withdraw পেজ
   ===================================================================== */

const WFEE = { USDT: 1, USDC: 1, ETH: 0.002, BTC: 0.0002 };

export default function Withdraw({ W, go, txs }) {
  const t = useT();
  const [coin, setCoin] = useState("USDT"), [net, setNet] = useState("TRC20"), [addr, setAddr] = useState(""), [amt, setAmt] = useState(""), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false });
  const nl = NETS[coin], nn = nl.includes(net) ? net : nl[0];
  const pickCoin = (c) => { setCoin(c); setNet(NETS[c][0]); };
  const held = W.w[coin] || 0, fee = WFEE[coin], a = parseFloat(amt) || 0;
  const submit = async () => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    const ad = addr.trim();
    if (!ad) return setMsg({ k: "eAddr", ok: false });
    if (!/^[A-Za-z0-9]{20,100}$/.test(ad)) return setMsg({ k: "bAddr", ok: false });
    if (!(a > 0)) return setMsg({ k: "eAmt", ok: false });
    if (a <= fee) return setMsg({ k: "feeLow", ok: false });
    if (a > held) return setMsg({ k: "iB", ok: false });
    setBusy(true);
    try {
      await api("/withdraw", { method: "POST", body: { coin, net: nn, address: ad, amount: a } });
      await W.reload();
      setAmt(""); setAddr(""); setMsg({ k: "wdOk", ok: true });
    } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  return (
    <>
      <div className="cx-top"><button onClick={() => go("home")}>‹</button><h1>{t("wd")}</h1><span /></div>
      <div className="cx-fm">
        <h4>{t("coin")}</h4><Chips list={Object.keys(NETS)} v={coin} set={pickCoin} />
        <h4>{t("net")}</h4><Chips list={nl} v={nn} set={setNet} />
        <h4>{t("addr")}</h4>
        <div className="cx-in"><input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder={t("addr")} autoComplete="off" /></div>
        <h4>{t("amount")}</h4>
        <div className="cx-in"><input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={t("amount")} inputMode="decimal" /><button className="cx-all" onClick={() => setAmt(String(held))}>{t("all")}</button><b>{coin}</b></div>
        <div className="cx-kv"><span>{t("avail")}</span><b>{held.toFixed(8)} {coin}</b></div>
        <div className="cx-kv"><span>{t("fee")}</span><b>{fee} {coin}</b></div>
        <div className="cx-kv"><span>{t("recv")}</span><b>{Math.max(0, a - fee).toFixed(8)} {coin}</b></div>
        {msg.k && <p className={"cx-msg" + (msg.ok ? "" : " bad")} style={{ margin: "10px 0 0" }}>{t(msg.k)}</p>}
        <button className="cx-a1 flat" style={{ opacity: busy ? 0.6 : 1 }} onClick={submit}>{t("submit")}</button>
      </div>
      <TxList txs={txs} type="wd" />
    </>
  );
}
