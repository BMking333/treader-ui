import React, { useState, useRef } from "react";
import { useT, api } from "./Home";

/* =====================================================================
   src/pages/depsoted.jsx — Deposit পেজ + shared (NETS, Chips, TxList)
   ===================================================================== */

export const NETS = { USDT: ["TRC20", "ERC20"], USDC: ["ERC20"], ETH: ["ERC20"], BTC: ["BTC"] };

// শুধু Deposit পেজের জন্য (বাকি পেজে NETS অপরিবর্তিত)
const DEP_NETS = {
  ...NETS,
  DOGE: ["DOGE"], XRP: ["XRP"], SOL: ["SOL"], PYUSD: ["ERC20"],
};
const NET_LABEL = { TRC20: "Tron", ERC20: "Ethereum", BTC: "Bitcoin", DOGE: "Dogecoin", XRP: "XRP", SOL: "Solana" };

// ⚠️ এখানে নিজের deposit address বসাও
const ADDR = {
  "USDT-TRC20": "YOUR_TRON_ADDRESS",
  "USDT-ERC20": "YOUR_ETH_ADDRESS",
  "USDC-ERC20": "YOUR_ETH_ADDRESS",
  "ETH-ERC20": "YOUR_ETH_ADDRESS",
  "PYUSD-ERC20": "YOUR_ETH_ADDRESS",
  "BTC-BTC": "YOUR_BTC_ADDRESS",
  "DOGE-DOGE": "YOUR_DOGE_ADDRESS",
  "XRP-XRP": "YOUR_XRP_ADDRESS",
  "SOL-SOL": "YOUR_SOL_ADDRESS",
};

const isDone = (x) => x.type === "dep" || /done|success|complete|approved|paid/i.test(x.status || "");

// Withdraw পেজ এটা ব্যবহার করে, তাই export থাকছে
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

/* ---------- styles (self-contained) ---------- */
const S = {
  page: { background: "#e0e0e8", minHeight: "100vh", paddingBottom: 30 },
  top: { background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", fontSize: 22 },
  back: { background: "none", border: 0, fontSize: 30, lineHeight: 1, cursor: "pointer" },
  wrap: { padding: "14px 28px" },
  cur: { background: "#fff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, cursor: "pointer", marginBottom: 14 },
  tabs: { display: "flex", marginBottom: 14 },
  tab: (on) => ({ flex: 1, padding: "20px 0", textAlign: "center", fontSize: 20, border: 0, cursor: "pointer", background: on ? "#007aff" : "#fff", color: on ? "#fff" : "#000" }),
  card: { background: "#fff", borderRadius: 22, padding: "28px 24px", textAlign: "center" },
  badge: { display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 18 },
  tag: { background: "#f0f0f4", color: "#666", fontSize: 13, fontWeight: 400, padding: "2px 8px", borderRadius: 4 },
  qrBox: { width: 170, margin: "10px auto 0", padding: 8, boxShadow: "0 0 8px #0001", borderRadius: 8 },
  qrTxt: { fontSize: 11, fontWeight: 600, wordBreak: "break-all", marginTop: 4 },
  lbl: { fontSize: 22, margin: "28px 0 12px" },
  addr: { fontSize: 20, wordBreak: "break-all" },
  copy: { background: "#1a7fd4", color: "#fff", border: 0, borderRadius: 14, fontSize: 24, padding: "14px 0", width: 220, margin: "18px 0", cursor: "pointer" },
  upl: { width: 230, height: 230, background: "#e0e0e8", margin: "10px auto 0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", fontSize: 40 },
  row: { display: "flex", alignItems: "center", gap: 14, margin: "50px 0 30px", textAlign: "left" },
  inp: { flex: 1, border: 0, borderBottom: "1px solid #999", fontSize: 20, padding: "8px 2px", outline: "none", minWidth: 0 },
  submit: { width: "100%", background: "#1a7fd4", color: "#fff", border: 0, borderRadius: 16, fontSize: 24, padding: "20px 0", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 50, display: "flex", alignItems: "flex-end" },
  sheet: { background: "#fff", width: "100%", borderRadius: "24px 24px 0 0", padding: "16px 16px 24px" },
  sheetTop: { display: "flex", justifyContent: "space-between", fontSize: 20, padding: "6px 10px 14px" },
  opt: (on) => ({ padding: "18px 0", textAlign: "center", fontSize: 24, borderTop: "1px solid #eee", cursor: "pointer", color: on ? "#007aff" : "#000", fontWeight: on ? 700 : 400 }),
};

export default function Deposit({ W, go }) {
  const t = useT();
  const [coin, setCoin] = useState("USDT"), [net, setNet] = useState("TRC20"), [amt, setAmt] = useState(""), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false });
  const [voucher, setVoucher] = useState("");        // base64 dataURL
  const [sheet, setSheet] = useState(false), [tmp, setTmp] = useState("USDT");
  const fileRef = useRef(null);

  const nl = DEP_NETS[coin], nn = nl.includes(net) ? net : nl[0];
  const addr = ADDR[coin + "-" + nn] || "";
  const pickCoin = (c) => { setCoin(c); setNet(DEP_NETS[c][0]); };

  const copy = async () => {
    try { await navigator.clipboard.writeText(addr); setMsg({ k: "copied", ok: true }); }
    catch { setMsg({ k: "copyFail", ok: false }); }
  };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setVoucher(r.result);
    r.readAsDataURL(f);
  };

  const submit = async () => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    const a = parseFloat(amt);
    if (!(a > 0)) return setMsg({ k: "eAmt", ok: false });
    setBusy(true);
    try {
      await api("/deposit", { method: "POST", body: { coin, net: nn, amount: a, voucher } });
      await W.reload();
      setAmt(""); setVoucher(""); setMsg({ k: "depOk", ok: true });
    } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };

  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=" + encodeURIComponent(addr);

  return (
    <div style={S.page}>
      <div style={S.top}>
        <button style={S.back} onClick={() => go("home")}>‹</button>
        <span>Deposit</span>
        <span style={{ fontSize: 30 }}>🎧</span>
      </div>

      <div style={S.wrap}>
        {/* Current currency */}
        <div style={S.cur} onClick={() => { setTmp(coin); setSheet(true); }}>
          <span>Current currency</span><span>{coin} ⌄</span>
        </div>

        {/* Network tabs */}
        <div style={S.tabs}>
          {nl.map((n) => <button key={n} style={S.tab(n === nn)} onClick={() => setNet(n)}>{n}</button>)}
        </div>

        <div style={S.card}>
          <div style={S.badge}>{coin} <span style={S.tag}>{NET_LABEL[nn] || nn}</span></div>
          <div style={S.qrBox}>
            <img src={qr} alt="qr" style={{ width: "100%", display: "block" }} />
            <div style={S.qrTxt}>{addr}</div>
          </div>

          <div style={S.lbl}>Deposit address</div>
          <div style={S.addr}>{addr}</div>
          <button style={S.copy} onClick={copy}>Copy</button>

          {/* Payment voucher */}
          <div style={S.upl} onClick={() => fileRef.current && fileRef.current.click()}>
            {voucher ? <img src={voucher} alt="voucher" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📷"}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <div style={{ fontSize: 24, marginTop: 20 }}>Payment voucher</div>

          <div style={S.row}>
            <span style={{ fontSize: 22 }}>Deposit</span>
            <input style={S.inp} value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Please enter the quantity" inputMode="decimal" />
          </div>

          {msg.k && <p className={"cx-msg" + (msg.ok ? "" : " bad")} style={{ margin: "0 0 14px" }}>{t(msg.k)}</p>}
          <button style={{ ...S.submit, opacity: busy ? 0.6 : 1 }} onClick={submit}>Submit for review</button>
        </div>
      </div>

      {/* Currency picker bottom sheet */}
      {sheet && (
        <div style={S.overlay} onClick={() => setSheet(false)}>
          <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={S.sheetTop}>
              <span style={{ color: "#888", cursor: "pointer" }} onClick={() => setSheet(false)}>Cancel</span>
              <span style={{ color: "#3b5998", cursor: "pointer" }} onClick={() => { pickCoin(tmp); setSheet(false); }}>Confirm</span>
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {Object.keys(DEP_NETS).map((c) => (
                <div key={c} style={S.opt(c === tmp)} onClick={() => setTmp(c)}>{c}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
                                                       }
