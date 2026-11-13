import React from "react";
import { useT, api, Ic, ICON } from "./Home";

/* =====================================================================
   src/pages/sidebar.jsx — সাইড মেনু (প্রোফাইল, নাইট মোড, লগআউট)
   ===================================================================== */

export default function SideMenu({ open, onClose, me, logout, dark, setDark, go, notify, guest, askLogin }) {
  const t = useT();
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
  const rows = [
    ["idcard", t("auth"), t("wait"), true, () => { onClose(); go("auth"); }],
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
        {rows.map(([ic, label, val, red, fn]) => (
          <button key={ic} className="cx-mr" onClick={fn}>
            <span className="cx-mi"><Ic d={ICON[ic]} s={28} /></span>
            <span className="cx-ml">{label}</span>
            {val === "switch" ? <span className={"cx-sw" + (dark ? " on" : "")}><i /></span> : <>{val && <span className={"cx-mv" + (red ? " red" : "")}>{val}</span>}<span className="cx-ar">›</span></>}
          </button>
        ))}
        {me && <button className="cx-lo" onClick={() => { onClose(); logout(); }}>{t("logout")}</button>}
      </aside>
    </div>
  );
}
