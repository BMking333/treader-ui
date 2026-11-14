import React, { useState, useRef, useEffect } from "react";
import { useT, api } from "./Home";

/* =====================================================================
   src/pages/depsoted.jsx — Deposit পেজ + shared (NETS, Chips, TxList)

   Backend:
     GET  /deposit/methods   -> Admin-এর তৈরি Active payment methods
     POST /deposit           -> { payment_method_id, amount, txid, sender_info, proof_url }
   Deposit approve হলে তবেই Wallet-এ Coin যোগ হয়।

   ভাষা: সব লেখা src/lib/i18n.jsx থেকে t("key") দিয়ে আসে (dp* কী গুলো TR_DEP-এ)।
   ===================================================================== */

export const NETS = { USDT: ["TRC20", "ERC20"], USDC: ["ERC20"], ETH: ["ERC20"], BTC: ["BTC"] };

const TYPE_ICON = { crypto: "₿", bkash: "৳", nagad: "৳", bank: "🏦" };
const TYPE_ORDER = ["crypto", "bkash", "nagad", "bank"];

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

/* ---------- styles (self-contained, সব রঙ explicit — app-এর theme-এ প্রভাবিত হবে না) ---------- */
const CSS = `
.dp, .dp * { box-sizing: border-box; }
.dp {
  --bg: #0a0f1c;
  --card: #111a2e;
  --card2: #0d1526;
  --line: #1f2c47;
  --text: #eef3ff;
  --muted: #8a99b8;
  --blue: #2f7bff;
  --blue2: #5b9bff;
  --green: #2ecc8f;
  --red: #ff6b7a;
  --amber: #f5b942;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding-bottom: 40px;
  font-family: Inter, "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.dp button { font-family: inherit; }

/* top bar */
.dp-top {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  background: rgba(10,15,28,.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.dp-top h1 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text); letter-spacing: .2px; }
.dp-icon-btn {
  width: 38px; height: 38px; border-radius: 12px;
  background: var(--card); border: 1px solid var(--line);
  color: var(--text); font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.cx[dir=rtl] .dp-top .dp-icon-btn:first-child { transform: scaleX(-1); }

.dp-wrap { max-width: 640px; margin: 0 auto; padding: 18px 16px 0; }

/* segmented tabs */
.dp-tabs {
  display: flex; gap: 6px; padding: 5px;
  background: var(--card); border: 1px solid var(--line);
  border-radius: 16px; margin-bottom: 14px;
}
.dp-tab {
  flex: 1; min-width: 0; border: 0; cursor: pointer;
  padding: 11px 6px; border-radius: 12px;
  background: transparent; color: var(--muted);
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all .18s;
}
.dp-tab.on {
  background: linear-gradient(135deg, #2f7bff, #4f8dff);
  color: #fff; box-shadow: 0 6px 18px rgba(47,123,255,.35);
}

/* method chips */
.dp-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 12px; scrollbar-width: none; }
.dp-chips::-webkit-scrollbar { display: none; }
.dp-chip {
  flex-shrink: 0; cursor: pointer;
  padding: 9px 14px; border-radius: 999px;
  background: var(--card); color: var(--muted);
  border: 1px solid var(--line);
  font-size: 13px; font-weight: 600;
}
.dp-chip.on { color: #fff; border-color: var(--blue); background: rgba(47,123,255,.16); }
.dp-chip small { opacity: .75; font-weight: 500; margin-inline-start: 4px; display: inline; }

/* card + step header */
.dp-card {
  background: var(--card); border: 1px solid var(--line);
  border-radius: 20px; padding: 20px; margin-bottom: 14px;
}
.dp-step { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.dp-step-n {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(47,123,255,.18); color: var(--blue2);
  font-size: 13px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.dp-step-t { font-size: 16px; font-weight: 700; color: var(--text); }
.dp-step-s { font-size: 12px; color: var(--muted); margin-top: 2px; }

/* coin badge */
.dp-coin { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 14px; }
.dp-coin b { font-size: 20px; color: var(--text); }
.dp-tag {
  padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
  background: rgba(46,204,143,.14); color: var(--green);
}

/* QR */
.dp-qr {
  width: 188px; height: 188px; margin: 0 auto 16px;
  background: #fff; border-radius: 16px; padding: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,.35);
}
.dp-qr img { width: 100%; height: 100%; display: block; object-fit: contain; }

/* address / info rows */
.dp-label { font-size: 12px; color: var(--muted); font-weight: 600; margin-bottom: 8px; }
.dp-addr {
  display: flex; align-items: center; gap: 10px;
  background: var(--card2); border: 1px solid var(--line);
  border-radius: 14px; padding: 12px 12px 12px 14px;
}
.dp-addr span {
  flex: 1; min-width: 0; word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px; color: var(--text); line-height: 1.45;
  direction: ltr; text-align: start;
}
.dp-copy {
  flex-shrink: 0; border: 0; cursor: pointer;
  padding: 9px 14px; border-radius: 10px;
  background: var(--blue); color: #fff; font-size: 12px; font-weight: 700;
}
.dp-copy.done { background: var(--green); color: #05241a; }

.dp-rows { margin-top: 14px; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.dp-r { display: flex; justify-content: space-between; gap: 12px; padding: 12px 14px; font-size: 13px; background: var(--card2); }
.dp-r + .dp-r { border-top: 1px solid var(--line); }
.dp-r span { color: var(--muted); }
.dp-r b { color: var(--text); text-align: end; word-break: break-word; }

.dp-warn {
  margin-top: 14px; padding: 12px 14px; border-radius: 12px;
  background: rgba(245,185,66,.1); border: 1px solid rgba(245,185,66,.3);
  color: var(--amber); font-size: 12.5px; line-height: 1.5; white-space: pre-wrap;
}

/* form */
.dp-field { margin-bottom: 16px; }
.dp-inwrap {
  display: flex; align-items: center;
  background: var(--card2); border: 1px solid var(--line);
  border-radius: 14px; transition: border-color .15s, box-shadow .15s;
}
.dp-inwrap:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(47,123,255,.18); }
.dp-in {
  flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
  color: var(--text); font-size: 15px; padding: 14px;
  font-family: inherit;
}
.dp-in::placeholder { color: #5d6c8c; }
.dp-suffix { padding-inline-end: 14px; color: var(--muted); font-size: 13px; font-weight: 700; }
.dp-hint { margin-top: 7px; font-size: 12px; color: var(--muted); }

.dp-recv {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-radius: 14px; margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(47,123,255,.16), rgba(46,204,143,.1));
  border: 1px solid rgba(47,123,255,.3);
}
.dp-recv span { font-size: 12.5px; color: var(--muted); }
.dp-recv b { font-size: 17px; color: var(--text); }

/* upload */
.dp-drop {
  position: relative; cursor: pointer;
  border: 1.5px dashed #34476d; border-radius: 16px;
  background: var(--card2); min-height: 130px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  color: var(--muted); font-size: 13px; overflow: hidden;
}
.dp-drop:hover { border-color: var(--blue); }
.dp-drop .ic { font-size: 28px; }
.dp-drop img { width: 100%; max-height: 260px; object-fit: contain; display: block; background: #000; }
.dp-rm {
  position: absolute; top: 8px; inset-inline-end: 8px; border: 0; cursor: pointer;
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(0,0,0,.65); color: #fff; font-size: 14px;
}

/* messages + submit */
.dp-msg { padding: 12px 14px; border-radius: 12px; font-size: 13px; margin: 4px 0 14px; line-height: 1.5; }
.dp-msg.ok { background: rgba(46,204,143,.12); color: var(--green); border: 1px solid rgba(46,204,143,.3); }
.dp-msg.bad { background: rgba(255,107,122,.1); color: var(--red); border: 1px solid rgba(255,107,122,.3); }

.dp-submit {
  width: 100%; border: 0; cursor: pointer;
  padding: 16px; border-radius: 14px;
  background: linear-gradient(135deg, #2f7bff, #4f8dff);
  color: #fff; font-size: 16px; font-weight: 700; text-align: center;
  box-shadow: 0 10px 26px rgba(47,123,255,.35);
}
.dp-submit:disabled { opacity: .55; cursor: not-allowed; box-shadow: none; }

.dp-center { text-align: center; color: var(--muted); padding: 40px 10px; font-size: 14px; }

.dp-note {
  display: flex; gap: 8px; align-items: flex-start;
  color: var(--muted); font-size: 12px; line-height: 1.5; margin: 0 4px 14px;
}
`;

export default function Deposit({ W, go }) {
  const t = useT();

  const [methods, setMethods] = useState([]);
  const [loadingM, setLoadingM] = useState(true);

  const [type, setType] = useState("crypto");
  const [methodId, setMethodId] = useState(null);

  const [amt, setAmt] = useState("");
  const [txid, setTxid] = useState("");
  const [sender, setSender] = useState("");
  const [proof, setProof] = useState("");              // compressed dataURL

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [copied, setCopied] = useState("");
  const fileRef = useRef(null);

  const say = (text, ok = false) => setMsg({ text, ok });
  const errText = (e) => {
    const m = e?.message;
    if (!m) return t("dpGeneric");
    return t(ERR_KEY[m] || m);
  };

  const typeLabel = (tp) =>
    tp === "crypto" ? "Crypto" : tp === "bkash" ? "bKash" : tp === "nagad" ? "Nagad" : t("dpBank");

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

  const pickMethod = (id) => {
    setMethodId(id);
    setMsg({ text: "", ok: false });
  };

  const qrSrc = method
    ? method.qr_image_url
      || (isCrypto && method.address
        ? "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=" + encodeURIComponent(method.address)
        : "")
    : "";

  /* ---------- actions ---------- */
  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
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
          .replace("{cur}", method.currency)
      );
    }
    if (txid.trim().length < 3) return say(t("dpBadTxid"));
    if (!proof) return say(t("dpProof"));

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
        <button className="dp-icon-btn" onClick={() => go("home")} aria-label="Back">‹</button>
        <h1>{t("dpTitle")}</h1>
        <button className="dp-icon-btn" aria-label="Support">🎧</button>
      </div>

      <div className="dp-wrap">
        {loadingM && <div className="dp-center">{t("dpLoading")}</div>}

        {!loadingM && !methods.length && (
          <div className="dp-card dp-center">
            {t("dpNone")}
            {msg.text && <div className="dp-msg bad" style={{ marginTop: 14 }}>{msg.text}</div>}
          </div>
        )}

        {!loadingM && method && (
          <>
            {/* Type tabs */}
            <div className="dp-tabs">
              {types.map((tp) => (
                <button key={tp} className={"dp-tab" + (tp === type ? " on" : "")} onClick={() => pickType(tp)}>
                  <span>{TYPE_ICON[tp]}</span>{typeLabel(tp)}
                </button>
              ))}
            </div>

            {/* Method chips */}
            {ofType.length > 1 && (
              <div className="dp-chips">
                {ofType.map((m) => (
                  <button key={m.id} className={"dp-chip" + (m.id === method.id ? " on" : "")} onClick={() => pickMethod(m.id)}>
                    {m.name}{m.network ? <small>{m.network}</small> : null}
                  </button>
                ))}
              </div>
            )}

            {/* STEP 1 — payment details */}
            <div className="dp-card">
              <div className="dp-step">
                <div className="dp-step-n">1</div>
                <div>
                  <div className="dp-step-t">{isCrypto ? t("dpS1c") : t("dpS1b")}</div>
                  <div className="dp-step-s">{isCrypto ? t("dpS1cSub") : t("dpS1bSub")}</div>
                </div>
              </div>

              <div className="dp-coin">
                <b>{method.name}</b>
                {isCrypto && method.network && <span className="dp-tag">{method.network}</span>}
              </div>

              {qrSrc && (
                <div className="dp-qr"><img src={qrSrc} alt="QR code" /></div>
              )}

              {method.address && (
                <>
                  <div className="dp-label">
                    {isCrypto ? t("dpAddr") : method.method_type === "bank" ? t("dpAcctNo") : t("dpPayNo")}
                  </div>
                  <div className="dp-addr">
                    <span>{method.address}</span>
                    <button
                      className={"dp-copy" + (copied === "addr" ? " done" : "")}
                      onClick={() => copy(method.address, "addr")}
                    >
                      {copied === "addr" ? t("dpCopied") : t("dpCopy")}
                    </button>
                  </div>
                </>
              )}

              {(method.account_name || method.bank_name || method.branch) && (
                <div className="dp-rows">
                  {method.account_name && <div className="dp-r"><span>{t("dpAccName")}</span><b>{method.account_name}</b></div>}
                  {method.bank_name && <div className="dp-r"><span>{t("dpBank")}</span><b>{method.bank_name}</b></div>}
                  {method.branch && <div className="dp-r"><span>{t("dpBranch")}</span><b>{method.branch}</b></div>}
                </div>
              )}

              {isCrypto && (
                <div className="dp-warn">
                  ⚠ {t("dpWarn").replace("{coin}", method.coin).replace("{net}", method.network || "")}
                </div>
              )}

              {method.instructions && <div className="dp-warn">{method.instructions}</div>}
            </div>

            {/* STEP 2 — submit details */}
            <div className="dp-card">
              <div className="dp-step">
                <div className="dp-step-n">2</div>
                <div>
                  <div className="dp-step-t">{t("dpS2")}</div>
                  <div className="dp-step-s">{t("dpS2Sub")}</div>
                </div>
              </div>

              <div className="dp-field">
                <div className="dp-label">{t("dpAmount")}</div>
                <div className="dp-inwrap">
                  <input
                    className="dp-in"
                    value={amt}
                    onChange={(e) => setAmt(e.target.value)}
                    placeholder={`${fmt(method.min_amount)} – ${fmt(method.max_amount)}`}
                    inputMode="decimal"
                  />
                  <span className="dp-suffix">{method.currency}</span>
                </div>
                <div className="dp-hint">
                  {t("dpMin")} {fmt(method.min_amount)} · {t("dpMax")} {fmt(method.max_amount)} {method.currency}
                  {!isCrypto && <> · {t("dpRate").replace("{coin}", method.coin).replace("{rate}", fmt(rate))}</>}
                </div>
              </div>

              {receive > 0 && (
                <div className="dp-recv">
                  <span>{t("dpRecv")}</span>
                  <b>≈ {fmt(receive)} {method.coin}</b>
                </div>
              )}

              <div className="dp-field">
                <div className="dp-label">{isCrypto ? t("dpTxid") : t("dpTxidB")}</div>
                <div className="dp-inwrap">
                  <input
                    className="dp-in"
                    value={txid}
                    onChange={(e) => setTxid(e.target.value)}
                    placeholder={isCrypto ? t("dpTxidPh") : t("dpTxidPhB")}
                  />
                </div>
              </div>

              <div className="dp-field">
                <div className="dp-label">{isCrypto ? t("dpSenderC") : t("dpSenderB")}</div>
                <div className="dp-inwrap">
                  <input
                    className="dp-in"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder={isCrypto ? t("dpSenderPhC") : "01XXXXXXXXX"}
                  />
                </div>
              </div>

              <div className="dp-field">
                <div className="dp-label">{t("dpProofLbl")}</div>
                <div className="dp-drop" onClick={() => fileRef.current && fileRef.current.click()}>
                  {proof ? (
                    <>
                      <img src={proof} alt="proof" />
                      <button
                        className="dp-rm"
                        onClick={(e) => { e.stopPropagation(); setProof(""); }}
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="ic">📷</span>
                      <span>{t("dpUpload")}</span>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              </div>

              {msg.text && <div className={"dp-msg " + (msg.ok ? "ok" : "bad")}>{msg.text}</div>}

              <button className="dp-submit" onClick={submit} disabled={busy}>
                {busy ? t("dpSubmitting") : t("dpSubmit")}
              </button>
            </div>

            <div className="dp-note">
              <span>🔒</span>
              <span>{t("dpNote")}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
