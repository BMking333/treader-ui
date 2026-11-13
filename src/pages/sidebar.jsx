import React, { useContext } from "react";
import { useT, api, Ic, ICON, LangCtx } from "./Home";

/* =====================================================================
   src/pages/sidebar.jsx — সাইড মেনু (প্রোফাইল, নাইট মোড, লগআউট)
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

/* "verified" ও "rejected" লেখা (গ্লোবাল অনুবাদে না থাকলে এখানে থেকে নেবে) */
const ST = {
  en: { ok: "Verified", bad: "Rejected" },
  bn: { ok: "যাচাই হয়েছে", bad: "বাতিল" },
  hi: { ok: "सत्यापित", bad: "अस्वीकृत" },
  ur: { ok: "تصدیق شدہ", bad: "مسترد" },
  ar: { ok: "تم التحقق", bad: "مرفوض" },
  fr: { ok: "Vérifié", bad: "Refusé" },
  es: { ok: "Verificado", bad: "Rechazado" },
  de: { ok: "Verifiziert", bad: "Abgelehnt" },
  pt: { ok: "Verificado", bad: "Recusado" },
  ru: { ok: "Подтверждено", bad: "Отклонено" },
  tr: { ok: "Doğrulandı", bad: "Reddedildi" },
  zh: { ok: "已认证", bad: "已拒绝" },
  ja: { ok: "確認済み", bad: "却下" },
  id: { ok: "Terverifikasi", bad: "Ditolak" },
};

export default function SideMenu({ open, onClose, me, logout, dark, setDark, go, notify, guest, askLogin }) {
  const t = useT();
  const { lang } = useContext(LangCtx);
  const st = (ST[lang] || ST.en);

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

  /* Authentication row: status অনুযায়ী লেখা, রঙ ও ক্লিক */
  const k = kind(me && me.verify_status);
  const authLabel = k === "wait" ? t("wait") : k === "ok" ? st.ok : k === "bad" ? st.bad : t("notset");
  const authRed = k !== "ok";
  const authLocked = k === "wait" || k === "ok"; /* under review / verified → কোনো পেজে যাবে না */
  const authFn = authLocked ? null : () => { onClose(); go("auth"); };

  const rows = [
    ["idcard", t("auth"), authLabel, authRed, authFn],
    ["pin", t("bind"), "", false, () => { onClose(); go("withdraw"); }],
    ["share", t("share"), "", false, share],
    ["bell", t("smsg"), "", false, () => notify(t("nomsg"))],
    ["moon", t("night"), "switch", false, () => setDark(!dark)],
    ["lock", t("sec"), t("notset"), true, soon],
    ["user", t("web"), "", false, soon],
  ];

  return (
    <div className={"cx-mo" + (open ? " open" : "")} onClick={onClose}>
      <aside className="cx-md" onClick={(e) => e.stopPropagation()}>
        {me ? <div className="cx-mp"><p>{me.email}</p><p>UID:{me.uid}</p><p>VIP:{me.vip ?? 0}</p><p>{t("rep")} : {me.reputation ?? 0}</p></div> : (
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
              <span className="cx-mi"><Ic d={ICON[ic]} s={28} /></span>
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
