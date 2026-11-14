import React, { useState, useRef, useEffect, useMemo } from "react";
import { useT, api } from "./Home";

/* =====================================================================
   src/pages/depsoted.jsx — Deposit পেজ + shared (NETS, Chips, TxList)

   Backend:
     GET  /deposit/methods -> Admin-এর তৈরি Active payment methods
     POST /deposit         -> { payment_method_id, amount, txid, sender_info, proof_url }
   Deposit approve হলে তবেই Wallet-এ Coin যোগ হয়।
   ===================================================================== */

export const NETS = { USDT: ["TRC20", "ERC20"], USDC: ["ERC20"], ETH: ["ERC20"], BTC: ["BTC"] };

// Customer service (Telegram)
const SUPPORT = [
  { name: "Customer service-1", url: "https://t.me/Michaelgwebb" },
  { name: "Customer service-2", url: "https://t.me/Michaelgwebb1" },
];

// Backend error code -> i18n key
const ERR_KEY = {
  badAmt: "dpBadAmt",
  badTxid: "dpBadTxid",
  duplicateTxid: "dpDup",
  paymentProofRequired: "dpProof",
  paymentUnavailable: "dpUnavail",
  unauthorized: "unauthorized",
  neterr: "neterr",
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

// ছবি ছোট করে (max 1000px, JPEG) dataURL বানায়
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

// ইউজার txid না দিলে প্রতিটি ডিপোজিটের জন্য ইউনিক রেফারেন্স
const makeRef = () => "DP-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

/* ---------- styles ---------- */
const CSS = `
.dp, .dp * { box-sizing: border-box; }
.dp {
  --bg: #0b1320;
  --panel: #12202f;
  --panel2: #0e1a28;
  --line: #1b2c40;
  --text: #ffffff;
  --muted: #8d9bb0;
  --blue: #0a7cff;
  --btn: #1a82d9;
  --green: #2ecc8f;
  --red: #ff6b7a;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding-bottom: 48px;
  font-family: Inter, "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.dp button { font-family: inherit; }

.dp-top {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  height: 62px; padding: 0 16px;
  background: var(--panel);
  border-bottom: 1px solid var(--line);
}
.dp-top h1 { margin: 0; font-size: 20px; font-weight: 500; }
.dp-ibtn {
  width: 40px; height: 40px; border: 0; background: transparent; color: var(--text);
  cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
}
.dp-ibtn svg { width: 26px; height: 26px; }
.cx[dir=rtl] .dp-ibtn.back { transform: scaleX(-1); }

.dp-wrap { max-width: 560px; margin: 0 auto; padding: 22px 16px 0; }

.dp-select {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  background: var(--panel); border: 0; color: var(--text);
  padding: 0 18px; height: 62px; font-size: 18px; cursor: pointer; text-align: start;
}
.dp-select b { font-weight: 400; display: flex; align-items: center; gap: 8px; }
.dp-select svg { width: 22px; height: 22px; }

.dp-nets { display: flex; margin-top: 14px; background: var(--panel); }
.dp-net {
  flex: 1; height: 56px; border: 0; background: transparent; color: var(--text);
  font-size: 19px; cursor: pointer;
}
.dp-net.on { background: var(--blue); }

.dp-card {
  margin-top: 16px; background: var(--panel); border-radius: 22px;
  padding: 24px 16px 28px; text-align: center;
}
.dp-qr { width: 100%; max-width: 280px; aspect-ratio: 1 / 1; margin: 0 auto; background: #fff; overflow: hidden; }
.dp-qr img { width: 100%; height: 100%; object-fit: contain; display: block; }

.dp-lbl { margin-top: 22px; font-size: 19px; }
.dp-addr {
  margin-top: 14px; font-size: 18px; line-height: 1.4;
  word-break: break-all; direction: ltr; padding: 0 4px;
}
.dp-copy {
  margin-top: 16px; min-width: 170px; height: 62px; border: 0; border-radius: 16px;
  background: var(--btn); color: #fff; font-size: 22px; cursor: pointer;
}
.dp-copy.done { background: var(--green); color: #05241a; }

.dp-voucher {
  position: relative; margin: 26px auto 0; width: 100%; max-width: 225px; aspect-ratio: 1 / 1;
  background: var(--bg); cursor: pointer; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.dp-voucher svg { width: 36px; height: 36px; }
.dp-voucher img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dp-rm {
  position: absolute; top: 6px; inset-inline-end: 6px; width: 28px; height: 28px; border: 0;
  border-radius: 50%; background: rgba(0,0,0,.7); color: #fff; font-size: 13px; cursor: pointer;
}

.dp-row {
  margin-top: 34px; display: flex; align-items: center; gap: 18px; text-align: start;
  padding: 0 10px;
}
.dp-row > span { font-size: 19px; flex-shrink: 0; }
.dp-row input {
  flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
  border-bottom: 1px solid #c9d3e0; color: var(--text);
  font-size: 19px; padding: 6px 0 8px; font-family: inherit;
}
.dp-row input::placeholder { color: #aab6c6; }
.dp-row input:focus { border-bottom-color: var(--blue); }
.dp-hint { margin: 10px 10px 0; font-size: 13px; color: var(--muted); text-align: start; }

.dp-msg { margin: 20px 10px 0; padding: 12px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; text-align: start; }
.dp-msg.ok { background: rgba(46,204,143,.12); color: var(--green); border: 1px solid rgba(46,204,143,.3); }
.dp-msg.bad { background: rgba(255,107,122,.1); color: var(--red); border: 1px solid rgba(255,107,122,.3); }

.dp-submit {
  width: calc(100% - 20px); margin: 26px 10px 0; height: 58px; border: 0; border-radius: 16px;
  background: var(--blue); color: #fff; font-size: 19px; font-weight: 600; cursor: pointer;
}
.dp-submit:disabled { opacity: .55; cursor: not-allowed; }

.dp-center { text-align: center; color: var(--muted); padding: 60px 10px; font-size: 15px; }

/* bottom sheet */
.dp-ov { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.6); display: flex; align-items: flex-end; justify-content: center; }
.dp-sheet {
  width: 100%; max-width: 640px; background: var(--panel);
  border-radius: 24px 24px 0 0; padding: 18px 20px 28px;
  animation: dpUp .2s ease-out;
}
@keyframes dpUp { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .dp-sheet { animation: none; } }
.dp-sh-head { display: flex; align-items: center; justify-content: space-between; min-height: 40px; }
.dp-sh-head h3 { margin: 0; font-size: 22px; font-weight: 600; flex: 1; text-align: center; }
.dp-sh-btn { border: 0; background: transparent; font-size: 20px; cursor: pointer; color: var(--muted); padding: 6px 4px; }
.dp-sh-btn.ok { color: #5b8cff; }
.dp-opts { margin-top: 14px; max-height: 50vh; overflow-y: auto; }
.dp-opt {
  width: 100%; border: 0; border-top: 1px solid var(--line); background: transparent;
  color: var(--text); font-size: 22px; padding: 20px 0; cursor: pointer;
}
.dp-opt.on { color: #5b9bff; font-weight: 600; }
.dp-svc {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  border: 0; border-top: 1px solid var(--line); background: transparent; color: var(--text);
  font-size: 21px; padding: 22px 2px; cursor: pointer; text-align: start; text-decoration: none;
}
.dp-svc:last-child { border-bottom: 1px solid var(--line); }
.dp-svc svg { width: 24px; height: 24px; color: var(--muted); }
.cx[dir=rtl] .dp-svc svg { transform: scaleX(-1); }
`;

/* ---------- icons ---------- */
const Svg = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcBack = () => <Svg><polyline points="15 5 8 12 15 19" /></Svg>;
const IcDown = () => <Svg><polyline points="5 9 12 16 19 9" /></Svg>;
const IcRight = () => <Svg><polyline points="9 5 16 12 9 19" /></Svg>;
const IcClose = () => <Svg><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></Svg>;
const IcHeadset = () => (
  <svg viewBox="0 0 24 24" fill="#2bb4ff">
    <path d="M12 2a8 8 0 0 0-8 8v4a3 3 0 0 0 3 3h1v-7H6.1A6 6 0 0 1 17.9 10H16v7h-4v2h4a3 3 0 0 0 3-3v-1a3 3 0 0 0 1-2.2V10a8 8 0 0 0-8-8z" />
    <circle cx="12" cy="11" r="3.2" />
    <path d="M6.5 22c.4-3 2.6-4.5 5.5-4.5s5.1 1.5 5.5 4.5z" />
  </svg>
);
const IcCamera = () => (
  <svg viewBox="0 0 24 24" fill="#fff">
    <path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9zm3 5.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
  </svg>
);

export default function Deposit({ W, go }) {
  const t = useT();
  // i18n key না থাকলে ইংরেজি fallback
  const L = (key, fb) => {
    const s = t(key);
    return s && s !== key ? s : fb;
  };

  const [methods, setMethods] = useState([]);
  const [loadingM, setLoadingM] = useState(true);

  const [coin, setCoin] = useState("");
  const [methodId, setMethodId] = useState(null);

  const [amt, setAmt] = useState("");
  const [proof, setProof] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [copied, setCopied] = useState(false);

  const [sheet, setSheet] = useState(null);   // "coin" | "support" | null
  const [pick, setPick] = useState("");
  const fileRef = useRef(null);

  const say = (text, ok = false) => setMsg({ text, ok });
  const errText = (e) => {
    const m = e?.message;
    if (!m) return t("dpGeneric");
    return t(ERR_KEY[m] || m);
  };

  /* ---------- load methods ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = toList(await api("/deposit/methods")).filter((m) => m.method_type === "crypto");
        if (!alive) return;
        setMethods(list);
        if (list.length) {
          setCoin(list[0].coin);
          setMethodId(list[0].id);
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

  /* ---------- derived ---------- */
  const coins = useMemo(() => [...new Set(methods.map((m) => m.coin))], [methods]);
  const ofCoin = methods.filter((m) => m.coin === coin);
  const method = ofCoin.find((m) => m.id === methodId) || ofCoin[0] || null;
  const a = parseFloat(amt);

  const qrSrc = method
    ? method.qr_image_url ||
      (method.address
        ? "https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=" + encodeURIComponent(method.address)
        : "")
    : "";

  /* ---------- actions ---------- */
  const confirmCoin = () => {
    if (pick && pick !== coin) {
      const first = methods.find((m) => m.coin === pick);
      setCoin(pick);
      setMethodId(first ? first.id : null);
      setMsg({ text: "", ok: false });
      setCopied(false);
    }
    setSheet(null);
  };

  const openCoin = () => {
    setPick(coin);
    setSheet("coin");
  };

  const pickNet = (id) => {
    setMethodId(id);
    setMsg({ text: "", ok: false });
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(method?.address || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      say(t("dpCopyFail"));
    }
  };

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      setProof(await compressImage(f));
    } catch {
      say(t("dpImgFail"));
    }
  };

  const submit = async () => {
    if (busy || !method) return;
    if (W.guest) return W.needLogin();

    if (!(a > 0)) return say(t("dpBadAmt"));
    if (a < num(method.min_amount) || a > num(method.max_amount)) {
      return say(
        t("dpRange")
          .replace("{min}", fmt(method.min_amount))
          .replace("{max}", fmt(method.max_amount))
          .replace("{cur}", method.currency || method.coin)
      );
    }
    if (!proof) return say(t("dpProof"));

    setBusy(true);
    setMsg({ text: "", ok: false });
    try {
      await api("/deposit", {
        method: "POST",
        body: {
          payment_method_id: method.id,
          amount: a,
          txid: makeRef(),
          sender_info: null,
          proof_url: proof,
        },
      });
      setAmt("");
      setProof("");
      say(t("dpOk"), true);
    } catch (e) {
      say(errText(e));
    }
    setBusy(false);
  };

  /* ---------- UI ---------- */
  return (
    <div className="dp">
      <style>{CSS}</style>

      <div className="dp-top">
        <button className="dp-ibtn back" onClick={() => go("home")} aria-label="Back"><IcBack /></button>
        <h1>{t("dpTitle")}</h1>
        <button className="dp-ibtn" onClick={() => setSheet("support")} aria-label="Customer service"><IcHeadset /></button>
      </div>

      <div className="dp-wrap">
        {loadingM && <div className="dp-center">{t("dpLoading")}</div>}

        {!loadingM && !method && (
          <div className="dp-center">
            {t("dpNone")}
            {msg.text && <div className="dp-msg bad">{msg.text}</div>}
          </div>
        )}

        {!loadingM && method && (
          <>
            <button className="dp-select" onClick={openCoin}>
              <span>{L("dpCurrency", "Current currency")}</span>
              <b>{coin}<IcDown /></b>
            </button>

            {ofCoin.length > 1 && (
              <div className="dp-nets">
                {ofCoin.map((m) => (
                  <button key={m.id} className={"dp-net" + (m.id === method.id ? " on" : "")} onClick={() => pickNet(m.id)}>
                    {m.network || m.name}
                  </button>
                ))}
              </div>
            )}

            <div className="dp-card">
              {qrSrc && <div className="dp-qr"><img src={qrSrc} alt="QR code" /></div>}

              {method.address && (
                <>
                  <div className="dp-lbl">{L("dpAddr", "Deposit address")}</div>
                  <div className="dp-addr">{method.address}</div>
                  <button className={"dp-copy" + (copied ? " done" : "")} onClick={copy}>
                    {copied ? t("dpCopied") : t("dpCopy")}
                  </button>
                </>
              )}

              <div className="dp-voucher" onClick={() => fileRef.current && fileRef.current.click()}>
                {proof ? (
                  <>
                    <img src={proof} alt="voucher" />
                    <button className="dp-rm" aria-label="Remove" onClick={(e) => { e.stopPropagation(); setProof(""); }}>✕</button>
                  </>
                ) : <IcCamera />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              <div className="dp-lbl" style={{ marginTop: 18 }}>{L("dpVoucher", "Payment voucher")}</div>

              <label className="dp-row">
                <span>{L("dpDepositLbl", "Deposit")}</span>
                <input
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  placeholder={L("dpQtyPh", "Please enter the quantity")}
                  inputMode="decimal"
                />
              </label>
              <div className="dp-hint">
                {t("dpMin")} {fmt(method.min_amount)} · {t("dpMax")} {fmt(method.max_amount)} {method.currency || method.coin}
              </div>

              {msg.text && <div className={"dp-msg " + (msg.ok ? "ok" : "bad")}>{msg.text}</div>}

              <button className="dp-submit" onClick={submit} disabled={busy}>
                {busy ? t("dpSubmitting") : t("dpSubmit")}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Currency picker */}
      {sheet === "coin" && (
        <div className="dp-ov" onClick={() => setSheet(null)}>
          <div className="dp-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="dp-sh-head">
              <button className="dp-sh-btn" onClick={() => setSheet(null)}>{L("dpCancel", "Cancel")}</button>
              <button className="dp-sh-btn ok" onClick={confirmCoin}>{L("dpConfirm", "Confirm")}</button>
            </div>
            <div className="dp-opts">
              {coins.map((c) => (
                <button key={c} className={"dp-opt" + (c === pick ? " on" : "")} onClick={() => setPick(c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer service */}
      {sheet === "support" && (
        <div className="dp-ov" onClick={() => setSheet(null)}>
          <div className="dp-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="dp-sh-head">
              <span style={{ width: 40 }} />
              <h3>{L("dpSupport", "Customer service")}</h3>
              <button className="dp-ibtn" onClick={() => setSheet(null)} aria-label="Close"><IcClose /></button>
            </div>
            <div className="dp-opts" style={{ marginTop: 22 }}>
              {SUPPORT.map((s) => (
                <a key={s.url} className="dp-svc" href={s.url} target="_blank" rel="noopener noreferrer">
                  <span>{s.name}</span>
                  <IcRight />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
