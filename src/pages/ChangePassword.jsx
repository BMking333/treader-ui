import React, { useState } from "react";
import { useT, api } from "./Home";

/* =====================================================================
   src/pages/ChangePassword.jsx — পাসওয়ার্ড পরিবর্তন
   Props: go, notify, me
   Backend: POST /user/change-password { old_password, new_password }
   ===================================================================== */

const CSS = `
.cx-cp{padding:16px 18px 32px;max-width:480px;margin:0 auto}
.cx-cp-h{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.cx-cp-back{background:none;border:0;color:inherit;font-size:22px;line-height:1;padding:4px 8px 4px 0;cursor:pointer;opacity:.8}
.cx-cp-h h2{margin:0;font-size:16px;font-weight:600}
.cx-cp-f{margin-bottom:14px}
.cx-cp-f label{display:block;font-size:12px;font-weight:500;opacity:.75;margin-bottom:6px}
.cx-cp-w{position:relative}
.cx-cp-w input{width:100%;box-sizing:border-box;padding:12px 56px 12px 12px;font-size:14px;color:inherit;
  background:rgba(128,128,128,.08);border:1px solid rgba(128,128,128,.25);border-radius:8px;outline:none;transition:border-color .15s}
.cx-cp-w input:focus{border-color:#4b8bf5}
.cx-cp-w button{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:0;
  color:inherit;opacity:.65;font-size:12px;font-weight:500;padding:6px 8px;cursor:pointer}
.cx-cp-hint{font-size:11.5px;opacity:.6;margin:-6px 0 14px}
.cx-cp-err{font-size:12.5px;color:#f0616d;margin:0 0 12px}
.cx-cp-btn{width:100%;padding:13px 0;font-size:14px;font-weight:600;color:#fff;background:#4b8bf5;
  border:0;border-radius:8px;cursor:pointer;transition:opacity .15s}
.cx-cp-btn:disabled{opacity:.5;cursor:default}
`;

export default function ChangePassword({ go, notify, me }) {
  const t = useT();
  const tx = (key, fb) => {
    const v = t(key);
    return v && v !== key ? v : fb;
  };

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [conf, setConf] = useState("");
  const [show, setShow] = useState({ o: false, n: false, c: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

  const submit = async (e) => {
    e && e.preventDefault();
    if (busy) return;
    setErr("");

    if (!oldPw || !newPw || !conf) return setErr("সব ঘর পূরণ করুন");
    if (newPw.length < 6) return setErr("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
    if (newPw === oldPw) return setErr("নতুন পাসওয়ার্ড পুরনোটির মতো হতে পারবে না");
    if (newPw !== conf) return setErr("নতুন পাসওয়ার্ড দুটি মিলছে না");

    setBusy(true);
    try {
      await api("/user/change-password", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      });
      notify(tx("pwChanged", "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে"));
      setOldPw(""); setNewPw(""); setConf("");
      go("home");
    } catch (ex) {
      const msg =
        (ex && (ex.detail || ex.message)) ||
        (typeof ex === "string" ? ex : "") ||
        "পাসওয়ার্ড পরিবর্তন করা যায়নি";
      setErr(String(msg));
    } finally {
      setBusy(false);
    }
  };

  const Field = ({ id, label, value, set }) => (
    <div className="cx-cp-f">
      <label htmlFor={"cp-" + id}>{label}</label>
      <div className="cx-cp-w">
        <input
          id={"cp-" + id}
          type={show[id] ? "text" : "password"}
          value={value}
          onChange={(e) => set(e.target.value)}
          autoComplete={id === "o" ? "current-password" : "new-password"}
        />
        <button type="button" onClick={() => toggle(id)}>
          {show[id] ? "লুকান" : "দেখান"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="cx-cp">
      <style>{CSS}</style>

      <div className="cx-cp-h">
        <button className="cx-cp-back" onClick={() => go("home")} aria-label="back">‹</button>
        <h2>{tx("chpwd", "পাসওয়ার্ড পরিবর্তন")}</h2>
      </div>

      <form onSubmit={submit}>
        {Field({ id: "o", label: "বর্তমান পাসওয়ার্ড", value: oldPw, set: setOldPw })}
        {Field({ id: "n", label: "নতুন পাসওয়ার্ড", value: newPw, set: setNewPw })}
        <p className="cx-cp-hint">কমপক্ষে ৬ অক্ষর</p>
        {Field({ id: "c", label: "নতুন পাসওয়ার্ড নিশ্চিত করুন", value: conf, set: setConf })}

        {err && <p className="cx-cp-err">{err}</p>}

        <button type="submit" className="cx-cp-btn" disabled={busy}>
          {busy ? "অপেক্ষা করুন..." : tx("confirm", "নিশ্চিত করুন")}
        </button>
      </form>
    </div>
  );
}
