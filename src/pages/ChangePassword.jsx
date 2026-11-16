import React, { useState } from "react";
import { useT, api } from "./Home";

const CSS = `
.cx-cp{padding:18px 18px 40px;max-width:480px;margin:0 auto}

/* Header */
.cx-cp-h{display:flex;align-items:center;gap:12px;margin-bottom:26px}
.cx-cp-back{width:38px;height:38px;display:flex;align-items:center;justify-content:center;
  background:rgba(128,128,128,.1);border:1px solid rgba(128,128,128,.2);border-radius:12px;
  color:inherit;cursor:pointer;transition:background .15s,transform .15s}
.cx-cp-back:hover{background:rgba(128,128,128,.18)}
.cx-cp-back:active{transform:scale(.94)}
.cx-cp-h h2{margin:0;font-size:18px;font-weight:700;letter-spacing:.2px}

/* Hero icon */
.cx-cp-hero{display:flex;justify-content:center;margin-bottom:22px}
.cx-cp-ico{width:72px;height:72px;border-radius:22px;display:flex;align-items:center;justify-content:center;
  color:#fff;background:linear-gradient(135deg,#5b9dff 0%,#7a5cff 100%);
  box-shadow:0 10px 28px rgba(91,110,255,.38),inset 0 1px 0 rgba(255,255,255,.35)}

/* Card */
.cx-cp-card{padding:22px 18px 24px;border-radius:20px;
  background:linear-gradient(180deg,rgba(128,128,128,.10),rgba(128,128,128,.05));
  border:1px solid rgba(128,128,128,.22);
  box-shadow:0 12px 36px rgba(0,0,0,.18)}

/* Field */
.cx-cp-f{margin-bottom:16px}
.cx-cp-f label{display:block;font-size:12px;font-weight:600;opacity:.8;margin:0 0 8px 2px;letter-spacing:.3px}
.cx-cp-w{position:relative;display:flex;align-items:center}
.cx-cp-lk{position:absolute;left:14px;opacity:.5;display:flex;pointer-events:none}
.cx-cp-w input{width:100%;box-sizing:border-box;padding:14px 48px 14px 42px;font-size:14.5px;color:inherit;
  background:rgba(128,128,128,.10);border:1.5px solid rgba(128,128,128,.25);border-radius:12px;outline:none;
  transition:border-color .18s,box-shadow .18s,background .18s}
.cx-cp-w input:focus{border-color:#5b8cff;background:rgba(91,140,255,.08);box-shadow:0 0 0 4px rgba(91,140,255,.16)}
.cx-cp-eye{position:absolute;right:6px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;
  background:none;border:0;color:inherit;opacity:.6;cursor:pointer;border-radius:10px;transition:opacity .15s,background .15s}
.cx-cp-eye:hover{opacity:1;background:rgba(128,128,128,.15)}

/* Strength meter */
.cx-cp-str{display:flex;gap:6px;margin:-4px 2px 8px}
.cx-cp-str i{flex:1;height:4px;border-radius:4px;background:rgba(128,128,128,.25);transition:background .2s}
.cx-cp-str i.on1{background:#f0616d}
.cx-cp-str i.on2{background:#f5a524}
.cx-cp-str i.on3{background:#4cc38a}

.cx-cp-hint{font-size:11.5px;opacity:.6;margin:0 2px 18px;line-height:1.5}
.cx-cp-err{font-size:12.5px;color:#f0616d;margin:0 0 16px;padding:10px 12px;border-radius:10px;
  background:rgba(240,97,109,.10);border:1px solid rgba(240,97,109,.28);text-align:center}

/* Centered button */
.cx-cp-act{display:flex;justify-content:center;margin-top:8px}
.cx-cp-btn{min-width:200px;padding:14px 36px;font-size:14.5px;font-weight:700;letter-spacing:.4px;color:#fff;
  background:linear-gradient(135deg,#4b8bf5 0%,#7a5cff 100%);border:0;border-radius:999px;cursor:pointer;
  box-shadow:0 8px 22px rgba(91,110,255,.40);display:inline-flex;align-items:center;justify-content:center;gap:8px;
  transition:transform .15s,box-shadow .15s,opacity .15s}
.cx-cp-btn:hover:not(:disabled){box-shadow:0 12px 28px rgba(91,110,255,.5);transform:translateY(-1px)}
.cx-cp-btn:active:not(:disabled){transform:scale(.97)}
.cx-cp-btn:disabled{opacity:.55;cursor:default;box-shadow:none}
.cx-cp-spin{width:15px;height:15px;border-radius:50%;border:2px solid rgba(255,255,255,.4);
  border-top-color:#fff;animation:cxcpspin .7s linear infinite}
@keyframes cxcpspin{to{transform:rotate(360deg)}}
`;

const IconLock = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
const IconEye = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

const strength = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10 || (/[A-Z]/.test(p) && /[a-z]/.test(p))) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 3);
};

export default function ChangePassword({ go, notify, me }) {
  const t = useT();

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [conf, setConf] = useState("");
  const [show, setShow] = useState({ o: false, n: false, c: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));
  const st = strength(newPw);

  const submit = async (e) => {
    e && e.preventDefault();
    if (busy) return;
    setErr("");

    if (!oldPw || !newPw || !conf) return setErr(t("cpFill"));
    if (newPw.length < 6) return setErr(t("cpMin"));
    if (newPw === oldPw) return setErr(t("cpSame"));
    if (newPw !== conf) return setErr(t("cpMatch"));

    setBusy(true);
    try {
      await api("/user/change-password", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      });
      notify(t("cpOk"));
      setOldPw("");
      setNewPw("");
      setConf("");
      go("home");
    } catch (ex) {
      const raw =
        (ex && (ex.detail || ex.message)) ||
        (typeof ex === "string" ? ex : "") ||
        "";
      const key = String(raw);
      const tr = key ? t(key) : "";
      setErr(tr && tr !== key ? tr : key || t("cpFail"));
    } finally {
      setBusy(false);
    }
  };

  const Field = ({ id, label, value, set }) => (
    <div className="cx-cp-f">
      <label htmlFor={"cp-" + id}>{label}</label>
      <div className="cx-cp-w">
        <span className="cx-cp-lk"><IconLock /></span>
        <input
          id={"cp-" + id}
          type={show[id] ? "text" : "password"}
          value={value}
          onChange={(e) => set(e.target.value)}
          autoComplete={id === "o" ? "current-password" : "new-password"}
        />
        <button
          type="button"
          className="cx-cp-eye"
          onClick={() => toggle(id)}
          aria-label={show[id] ? t("cpHide") : t("cpShow")}
        >
          <IconEye off={show[id]} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="cx-cp">
      <style>{CSS}</style>

      <div className="cx-cp-h">
        <button className="cx-cp-back" onClick={() => go("home")} aria-label="back">
          <IconBack />
        </button>
        <h2>{t("chpwd")}</h2>
      </div>

      <div className="cx-cp-hero">
        <div className="cx-cp-ico"><IconLock s={32} /></div>
      </div>

      <form className="cx-cp-card" onSubmit={submit}>
        {Field({ id: "o", label: t("cpOld"), value: oldPw, set: setOldPw })}
        {Field({ id: "n", label: t("cpNew"), value: newPw, set: setNewPw })}

        <div className="cx-cp-str" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <i key={i} className={st >= i ? "on" + st : ""} />
          ))}
        </div>
        <p className="cx-cp-hint">{t("cpHint")}</p>

        {Field({ id: "c", label: t("cpConf"), value: conf, set: setConf })}

        {err && <p className="cx-cp-err">{err}</p>}

        <div className="cx-cp-act">
          <button type="submit" className="cx-cp-btn" disabled={busy}>
            {busy && <span className="cx-cp-spin" />}
            {busy ? t("wait2") : t("confirm")}
          </button>
        </div>
      </form>
    </div>
  );
}
