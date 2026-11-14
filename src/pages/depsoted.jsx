import React, { useState, useRef, useEffect, useCallback } from "react";
import { useT, api } from "./Home";

/* =====================================================================
   src/pages/depsoted.jsx — Deposit পেজ + shared (NETS, Chips, TxList)

   Backend:
     GET  /deposit/methods   -> Admin-এর তৈরি Active payment methods
     POST /deposit           -> { payment_method_id, amount, txid, sender_info, proof_url }
     GET  /deposit/history   -> ব্যবহারকারীর deposit request তালিকা
   Deposit approve হলে তবেই Wallet-এ Coin যোগ হয়।
   ===================================================================== */

export const NETS = { USDT: ["TRC20", "ERC20"], USDC: ["ERC20"], ETH: ["ERC20"], BTC: ["BTC"] };

const TYPE_LABEL = { crypto: "₿ Crypto", bkash: "bKash", nagad: "Nagad", bank: "Bank" };
const TYPE_ORDER = ["crypto", "bkash", "nagad", "bank"];

const ERR = {
  badAmt: "Amount সঠিক নয় বা limit-এর বাইরে।",
  badTxid: "Transaction ID/TXID সঠিক নয় (কমপক্ষে ৩ অক্ষর)।",
  duplicateTxid: "এই TXID আগেই জমা দেওয়া হয়েছে।",
  paymentProofRequired: "Payment proof (screenshot) আপলোড করুন।",
  paymentUnavailable: "এই payment method এখন পাওয়া যাচ্ছে না।",
  unauthorized: "আবার Login করুন।",
  neterr: "সার্ভারের সাথে সংযোগ করা যাচ্ছে না।",
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

/* ---------- helpers ---------- */
function unwrap(res) {
  if (res?.data !== undefined) return res.data;
  if (res?.result !== undefined) return res.result;
  return res;
}

function toList(res) {
  const d = unwrap(res);
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.methods)) return d.methods;
  if (Array.isArray(d?.results)) return d.results;
  return [];
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (v, max = 8) => num(v).toLocaleString("en-US", { maximumFractionDigits: max });

// ছবি ছোট করে (max 1000px, JPEG) dataURL বানায় — বড় base64 পাঠানো এড়াতে
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- styles (self-contained) ---------- */
const S = {
  page: { background: "#e0e0e8", minHeight: "100vh", paddingBottom: 30 },
  top: { background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", fontSize: 22 },
  back: { background: "none", border: 0, fontSize: 30, lineHeight: 1, cursor: "pointer" },
  wrap: { padding: "14px 28px" },
  cur: { background: "#fff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, cursor: "pointer", marginBottom: 14 },
  tabs: { display: "flex", marginBottom: 14, flexWrap: "wrap" },
  tab: (on) => ({ flex: 1, minWidth: 90, padding: "16px 6px", textAlign: "center", fontSize: 18, border: 0, cursor: "pointer", background: on ? "#007aff" : "#fff", color: on ? "#fff" : "#000" }),
  card: { background: "#fff", borderRadius: 22, padding: "28px 24px", textAlign: "center" },
  badge: { display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 18 },
  tag: { background: "#f0f0f4", color: "#666", fontSize: 13, fontWeight: 400, padding: "2px 8px", borderRadius: 4 },
  qrBox: { width: 170, margin: "10px auto 0", padding: 8, boxShadow: "0 0 8px #0001", borderRadius: 8 },
  qrTxt: { fontSize: 11, fontWeight: 600, wordBreak: "break-all", marginTop: 4 },
  lbl: { fontSize: 22, margin: "24px 0 10px" },
  addr: { fontSize: 20, wordBreak: "break-all" },
  info: { fontSize: 15, color: "#555", marginTop: 6 },
  note: { background: "#fff8e1", color: "#7a5b00", borderRadius: 10, padding: "10px 12px", fontSize: 14, textAlign: "left", margin: "16px 0 0", whiteSpace: "pre-wrap" },
  copy: { background: "#1a7fd4", color: "#fff", border: 0, borderRadius: 14, fontSize: 22, padding: "12px 0", width: 200, margin: "16px 0", cursor: "pointer" },
  upl: { width: 200, height: 200, background: "#e0e0e8", margin: "10px auto 0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", fontSize: 40 },
  row: { display: "flex", alignItems: "center", gap: 14, margin: "26px 0 0", textAlign: "left" },
  rowLbl: { fontSize: 18, width: 96, flexShrink: 0 },
  inp: { flex: 1, border: 0, borderBottom: "1px solid #999", fontSize: 18, padding: "8px 2px", outline: "none", minWidth: 0 },
  hint: { fontSize: 13, color: "#777", textAlign: "left", marginTop: 6 },
  submit: { width: "100%", background: "#1a7fd4", color: "#fff", border: 0, borderRadius: 16, fontSize: 22, padding: "18px 0", cursor: "pointer", marginTop: 26 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 50, display: "flex", alignItems: "flex-end" },
  sheet: { background: "#fff", width: "100%", borderRadius: "24px 24px 0 0", padding: "16px 16px 24px" },
  sheetTop: { display: "flex", justifyContent: "space-between", fontSize: 20, padding: "6px 10px 14px" },
  opt: (on) => ({ padding: "16px 0", textAlign: "center", fontSize: 20, borderTop: "1px solid #eee", cursor: "pointer", color: on ? "#007aff" : "#000", fontWeight: on ? 700 : 400 }),
  hist: { background: "#fff", borderRadius: 22, padding: "20px 20px", marginTop: 16 },
  histRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "12px 0", borderTop: "1px solid #eee", fontSize: 15 },
  pill: (s) => ({
    padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
    background: s === "approved" ? "#dff7ea" : s === "rejected" ? "#fde3e6" : "#fff2cc",
    color: s === "approved" ? "#127a4a" : s === "rejected" ? "#b4232f" : "#8a6500",
  }),
};

export default function Deposit({ W, go }) {
  const t = useT();

  const [methods, setMethods] = useState([]);
  const [loadingM, setLoadingM] = useState(true);
  const [history, setHistory] = useState([]);

  const [type, setType] = useState("crypto");
  const [methodId, setMethodId] = useState(null);

  const [amt, setAmt] = useState("");
  const [txid, setTxid] = useState("");
  const [sender, setSender] = useState("");
  const [proof, setProof] = useState("");              // compressed dataURL

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [sheet, setSheet] = useState(false);
  const [tmp, setTmp] = useState(null);
  const fileRef = useRef(null);

  const say = (text, ok = false) => setMsg({ text, ok });
  const errText = (e) => ERR[e?.message] || (e?.message ? t(e.message) : "Something went wrong.");

  /* ---------- load methods ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = toList(await api("/deposit/methods"));
        if (!alive) return;
        setMethods(list);

        const first = TYPE_ORDER.find((tp) => list.some((m) => m.method_type === tp));
        if (first) {
          setType(first);
          setMethodId(list.find((m) => m.method_type === first).id);
        }
      } catch (e) {
        if (alive) say(errText(e));
      } finally {
        if (alive) setLoadingM(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- load history (login থাকলে) ---------- */
  const loadHistory = useCallback(async () => {
    if (W.guest) return setHistory([]);
    try {
      setHistory(toList(await api("/deposit/history")));
    } catch {
      /* history ব্যর্থ হলে পেজ আটকাবে না */
    }
  }, [W.guest]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  /* ---------- derived ---------- */
  const types = TYPE_ORDER.filter((tp) => methods.some((m) => m.method_type === tp));
  const ofType = methods.filter((m) => m.method_type === type);
  const method = ofType.find((m) => m.id === methodId) || ofType[0] || null;
  const isCrypto = method?.method_type === "crypto";
  const rate = num(method?.rate_bdt_per_coin);
  const a = parseFloat(amt);
  const receive = method && a > 0
    ? (isCrypto ? a : rate > 0 ? a / rate : 0)
    : 0;

  const pickType = (tp) => {
    setType(tp);
    const first = methods.find((m) => m.method_type === tp);
    setMethodId(first ? first.id : null);
    setMsg({ text: "", ok: false });
  };

  const qrSrc = method
    ? method.qr_image_url
      || (isCrypto && method.address
        ? "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=" + encodeURIComponent(method.address)
        : "")
    : "";

  /* ---------- actions ---------- */
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      say("Copied", true);
    } catch {
      say("Copy failed");
    }
  };

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      setProof(await compressImage(f));
    } catch {
      say("ছবি পড়া যায়নি, অন্য ছবি দিন।");
    }
  };

  const submit = async () => {
    if (busy || !method) return;
    if (W.guest) return W.needLogin();

    if (!(a > 0)) return say(ERR.badAmt);
    if (a < num(method.min_amount) || a > num(method.max_amount)) {
      return say(`Amount ${fmt(method.min_amount)} – ${fmt(method.max_amount)} ${method.currency}-এর মধ্যে হতে হবে।`);
    }
    if (txid.trim().length < 3) return say(ERR.badTxid);
    if (!proof) return say(ERR.paymentProofRequired);

    setBusy(true);
    setMsg({ text: "", ok: false });
    try {
      await api("/deposit", {
        method: "POST",
        body: {
          payment_method_id: method.id,
          amount: a,
          txid: txid.trim(),
          sender_info: sender.trim() || null,
          proof_url: proof,
        },
      });
      setAmt(""); setTxid(""); setSender(""); setProof("");
      say("Deposit request জমা হয়েছে। Admin approve করলে Wallet-এ যোগ হবে।", true);
      loadHistory();
    } catch (e) {
      say(errText(e));
    }
    setBusy(false);
  };

  /* ---------- UI ---------- */
  return (
    <div style={S.page}>
      <div style={S.top}>
        <button style={S.back} onClick={() => go("home")}>‹</button>
        <span>Deposit</span>
        <span style={{ fontSize: 30 }}>🎧</span>
      </div>

      <div style={S.wrap}>
        {loadingM && <div style={{ ...S.card, fontSize: 16 }}>Loading...</div>}

        {!loadingM && !methods.length && (
          <div style={{ ...S.card, fontSize: 16 }}>
            এখন কোনো deposit method চালু নেই।
            {msg.text && <p className={"cx-msg bad"}>{msg.text}</p>}
          </div>
        )}

        {!loadingM && method && (
          <>
            {/* Payment type tabs */}
            <div style={S.tabs}>
              {types.map((tp) => (
                <button key={tp} style={S.tab(tp === type)} onClick={() => pickType(tp)}>
                  {TYPE_LABEL[tp]}
                </button>
              ))}
            </div>

            {/* Method picker */}
            <div style={S.cur} onClick={() => { setTmp(method.id); setSheet(true); }}>
              <span>Payment method</span>
              <span>{method.name} ⌄</span>
            </div>

            <div style={S.card}>
              <div style={S.badge}>
                {method.name}
                {isCrypto && method.network && <span style={S.tag}>{method.network}</span>}
              </div>

              {qrSrc && (
                <div style={S.qrBox}>
                  <img src={qrSrc} alt="qr" style={{ width: "100%", display: "block" }} />
                </div>
              )}

              {method.address && (
                <>
                  <div style={S.lbl}>
                    {isCrypto ? "Deposit address" : method.method_type === "bank" ? "Account number" : "Payment number"}
                  </div>
                  <div style={S.addr}>{method.address}</div>
                  <button style={S.copy} onClick={() => copy(method.address)}>Copy</button>
                </>
              )}

              {method.account_name && <div style={S.info}>Account name: <b>{method.account_name}</b></div>}
              {method.bank_name && <div style={S.info}>Bank: <b>{method.bank_name}</b></div>}
              {method.branch && <div style={S.info}>Branch: <b>{method.branch}</b></div>}

              {method.instructions && <div style={S.note}>{method.instructions}</div>}

              {/* Amount */}
              <div style={S.row}>
                <span style={S.rowLbl}>Amount ({method.currency})</span>
                <input
                  style={S.inp}
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  placeholder={`${fmt(method.min_amount)} – ${fmt(method.max_amount)}`}
                  inputMode="decimal"
                />
              </div>
              {!isCrypto && (
                <div style={S.hint}>
                  Rate: ১ {method.coin} = ৳{fmt(rate)}
                  {receive > 0 && <> · আপনি পাবেন ≈ <b>{fmt(receive)} {method.coin}</b></>}
                </div>
              )}

              {/* TXID */}
              <div style={S.row}>
                <span style={S.rowLbl}>{isCrypto ? "TXID" : "Transaction ID"}</span>
                <input style={S.inp} value={txid} onChange={(e) => setTxid(e.target.value)} placeholder="Transaction ID" />
              </div>

              {/* Sender */}
              <div style={S.row}>
                <span style={S.rowLbl}>{isCrypto ? "Sender wallet" : "Sender number"}</span>
                <input style={S.inp} value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Optional" />
              </div>

              {/* Proof */}
              <div style={S.upl} onClick={() => fileRef.current && fileRef.current.click()}>
                {proof
                  ? <img src={proof} alt="proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : "📷"}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              <div style={{ fontSize: 20, marginTop: 14 }}>Payment proof</div>

              {msg.text && (
                <p className={"cx-msg" + (msg.ok ? "" : " bad")} style={{ margin: "18px 0 0" }}>{msg.text}</p>
              )}

              <button style={{ ...S.submit, opacity: busy ? 0.6 : 1 }} onClick={submit} disabled={busy}>
                {busy ? "Submitting..." : "Submit for review"}
              </button>
            </div>

            {/* History */}
            {!W.guest && (
              <div style={S.hist}>
                <h3 style={{ margin: "0 0 6px" }}>{t("hist")}</h3>
                {history.length ? history.map((x) => (
                  <div key={x.id} style={S.histRow}>
                    <span>
                      <b>{fmt(x.amount)} {x.currency}</b>
                      <br />
                      <small style={{ color: "#777" }}>
                        → {fmt(x.credit_amount)} {x.coin} · {new Date(x.created_at).toLocaleString()}
                      </small>
                      {x.status === "rejected" && x.admin_note && (
                        <><br /><small style={{ color: "#b4232f" }}>Reason: {x.admin_note}</small></>
                      )}
                    </span>
                    <span style={S.pill(x.status)}>{String(x.status || "pending").toUpperCase()}</span>
                  </div>
                )) : <div className="cx-empty2">{t("norec")}</div>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Method picker bottom sheet */}
      {sheet && (
        <div style={S.overlay} onClick={() => setSheet(false)}>
          <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={S.sheetTop}>
              <span style={{ color: "#888", cursor: "pointer" }} onClick={() => setSheet(false)}>Cancel</span>
              <span
                style={{ color: "#3b5998", cursor: "pointer" }}
                onClick={() => { if (tmp != null) setMethodId(tmp); setSheet(false); setMsg({ text: "", ok: false }); }}
              >
                Confirm
              </span>
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {ofType.map((m) => (
                <div key={m.id} style={S.opt(m.id === tmp)} onClick={() => setTmp(m.id)}>
                  {m.name}{m.network ? ` · ${m.network}` : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
