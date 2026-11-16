import React from "react";
import { useT, api, Ic, ICON } from "./Home";

/* =====================================================================
   src/pages/sidebar.jsx — সাইড মেনু (প্রোফাইল, পাসওয়ার্ড, নাইট মোড, লগআউট)
   নাইট মোড টগল করলে App.jsx সেটা সার্ভারে সেভ করে।
   ===================================================================== */

/* verify_status → none | wait | ok | bad (authentication.jsx এর সাথে একই লজিক) */
const kind = (s) => {
  const v = String(s ?? "").trim();
  if (!v || /^(none|unverified|not|null|0)/i.test(v)) return "none";
  if (/reject|fail|den|refus/i.test(v)) return "bad";
  if (/approv|verif|success|pass|done|certif/i.test(v)) return "ok";
  if (/pend|review|wait|submit|process/i.test(v)) return "wait";
  return "none";
};

/* ক্লিন ও কমপ্যাক্ট স্টাইল (শুধু এই মেনুর জন্য) */
const CSS = `
.cx-md .cx-mp{padding:18px 18px 14px;border-bottom:1px solid rgba(128,128,128,.18);margin-bottom:6px}
.cx-md .cx-mp p{margin:0 0 4px;font-size:12.5px;line-height:1.45;opacity:.8;word-break:break-all}
.cx-md .cx-mp p:first-child{font-size:14px;font-weight:600;opacity:1}
.cx-md .cx-mp .cx-a1{font-size:13px;padding:9px 0;border-radius:8px;font-weight:600}
.cx-md .cx-mr{display:flex;align-items:center;gap:12px;width:100%;padding:12px 18px;min-height:48px;
  font-size:13.5px;font-weight:500;background:none;border:0;border-bottom:1px solid rgba(128,128,128,.12);
  color:inherit;text-align:left;transition:background .15s}
.cx-md .cx-mr:active{background:rgba(128,128,128,.12)}
.cx-md .cx-mi{display:flex;align-items:center;justify-content:center;width:22px;height:22px;opacity:.75;flex:none}
.cx-md .cx-ml{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-md .cx-mv{font-size:12px;font-weight:500;opacity:.9}
.cx-md .cx-ar{font-size:18px;opacity:.4;line-height:1}
.cx-md .cx-sw{width:36px;height:20px;border-radius:20px;flex:none}
.cx-md .cx-sw i{width:16px;height:16px;margin:2px}
.cx-md .cx-lo{margin:16px 18px;width:calc(100% - 36px);padding:11px 0;font-size:13.5px;font-weight:600;border-radius:8px}
`;

export default function SideMenu({ open, onClose, me, logout, dark, setDark, go, notify, guest, askLogin }) {
  const t = useT();

  /* অনুবাদ না থাকলে fallback লেখা */
  const tx = (key, fb) => {
    const v = t(key);
    return v && v !== key ? v : fb;
  };

  const share = async () => {
    if (!me) { onClose(); return askLogin("login", "needLogin"); }
    let link = (typeof window !== "undefined" ? window.location.origin : "") + "/?ref=" + me.uid;
    try {
      const j = await api("/user/share-link");
      const p = typeof j === "string" ? j : j && j.path;
      if (p) link = p.startsWith("/") ? (typeof window !== "undefined" ? window.location.origin : "") + p : p;
    } catch {}
    try { navigator.clipboard && navigator.clipboard.writeText(link).catch(() => {}); } catch {}
    notify(t("copied"));
  };
  const soon = () => notify(t("soon"));

  /* লগইন ছাড়া change-password এ যাওয়া যাবে না */
  const goChangePassword = () => {
    onClose();
    if (!me) return askLogin("login", "needLogin");
    go("change-password");
  };

  /* Authentication row: status অনুযায়ী লেখা, রঙ ও ক্লিক */
  const k = kind(me && me.verify_status);
  const authLabel = k === "wait" ? t("wait") : k === "ok" ? t("verified") : k === "bad" ? t("rejected") : t("notset");
  const authRed = k !== "ok";
  const authLocked = k === "wait" || k === "ok"; /* under review / verified → কোনো পেজে যাবে না */
  const authFn = authLocked ? null : () => { onClose(); go("auth"); };

  const rows = [
    ["idcard", t("auth"), authLabel, authRed, authFn],
    ["pin", t("bind"), "", false, () => { onClose(); go("withdraw"); }],
    ["share", t("share"), "", false, share],
    ["bell", t("smsg"), "", false, () => notify(t("nomsg"))],
    ["moon", t("night"), "switch", false, () => setDark(!dark)],
    ["lock", tx("chpwd", "পাসওয়ার্ড পরিবর্তন"), "", false, goChangePassword],
    ["user", t("web"), "", false, soon],
  ];

  return (
    <div className={"cx-mo" + (open ? " open" : "")} onClick={onClose}>
      <style>{CSS}</style>
      <aside className="cx-md" onClick={(e) => e.stopPropagation()}>
        {me ? (
          <div className="cx-mp">
            <p>{me.email}</p>
            <p>UID: {me.uid}</p>
            <p>VIP: {me.vip ?? 0}</p>
            <p>{t("rep")}: {me.reputation ?? 0}</p>
          </div>
        ) : (
          <div className="cx-mp">
            <button className="cx-a1 flat cx-cap" onClick={() => { onClose(); askLogin("login"); }}>{t("login")}</button>
            <button className="cx-a1 flat cx-cap" onClick={() => { onClose(); askLogin("register"); }}>{t("register")}</button>
          </div>
        )}

        {rows.map(([ic, label, val, red, fn]) => {
          const locked = !fn; /* fn নেই = ক্লিকে কিছু হবে না */
          return (
            <button
              key={ic}
              className="cx-mr"
              onClick={fn || undefined}
              style={locked ? { cursor: "default" } : undefined}
              tabIndex={locked ? -1 : undefined}
              aria-disabled={locked || undefined}
            >
              <span className="cx-mi"><Ic d={ICON[ic]} s={20} /></span>
              <span className="cx-ml">{label}</span>
              {val === "switch" ? (
                <span className={"cx-sw" + (dark ? " on" : "")}><i /></span>
              ) : (
                <>
                  {val && (
                    <span
                      className={"cx-mv" + (red ? " red" : "")}
                      style={!red && ic === "idcard" ? { color: "#4be0a8" } : undefined}
                    >
                      {val}
                    </span>
                  )}
                  {!locked && <span className="cx-ar">›</span>}
                </>
              )}
            </button>
          );
        })}

        {me && <button className="cx-lo" onClick={() => { onClose(); logout(); }}>{t("logout")}</button>}
      </aside>
    </div>
  );
}
