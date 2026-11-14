import React, { createContext, useState } from "react";

/* =====================================================================
   src/lib/i18n.jsx — ভাষার সব কিছু এই এক ফাইলে
   ১) LANGS  : ভাষার তালিকা  [কোড, নিজের নাম, পতাকা]
   ২) RTL    : ডান-থেকে-বামে লেখা ভাষা
   ৩) T      : সব অনুবাদ (ভাষা -> কী -> লেখা)
   ৪) LangPicker : ভাষা বাছাইয়ের ড্রপডাউন (সব পেজে এটাই ব্যবহার হবে)
   কোডগুলো ব্যাকএন্ডের app/core/langs.py (SUPPORTED_LANGS) এর সাথে হুবহু এক।
   নতুন ভাষা যোগ করতে হলে: এখানে LANGS-এ + ব্যাকএন্ডের SUPPORTED_LANGS-এ।
   ===================================================================== */

export const LANGS = [
  ["en", "English", "🇺🇸"],
  ["ar", "عربي", "🇦🇪"],
  ["fr", "Français", "🇫🇷"],
  ["it", "italiano", "🇮🇹"],
  ["ja", "日本語", "🇯🇵"],
  ["ko", "한국인", "🇰🇷"],
  ["de", "Deutsch", "🇩🇪"],
  ["pt", "Português", "🇵🇹"],
  ["ru", "Русский", "🇷🇺"],
  ["vi", "Tiếng Việt", "🇻🇳"],
  ["tr", "Türkçe", "🇹🇷"],
  ["es", "español", "🇪🇸"],
  ["fa", "فارسی", "🇮🇷"],
  ["id", "Indonesia", "🇮🇩"],
  ["el", "Ελληνικά", "🇬🇷"],
  ["ms", "Melayu", "🇲🇾"],
  ["th", "แบบไทย", "🇹🇭"],
  ["la", "Latinus", "🇻🇦"],
  ["hi", "हिंदी", "🇮🇳"],
  ["bn", "বাংলা", "🇧🇩"],
  ["ur", "اردو", "🇵🇰"],
  ["zh-TW", "繁体中文", "🇭🇰"],
  ["zh-CN", "简体中文", "🇨🇳"],
  ["ro", "România", "🇷🇴"],
  ["sv", "Svenska", "🇸🇪"],
  ["crs", "Creole", "🇸🇨"],
];

export const RTL = ["ar", "fa", "ur"];

export const LangCtx = createContext({ lang: "en", t: (k) => k });

export const isLang = (c) => LANGS.some((l) => l[0] === c);

/* ---------------- অনুবাদ ---------------- */

/* ব্যাকএন্ড error key + সাইডমেনুর "Verified/Rejected" */
const SYSTEM = {
  en: {
    verified: "Verified", rejected: "Rejected",
    bPw: "Password must be at least 6 characters",
    bMatch: "Passwords do not match",
    bEmail: "Invalid email",
    exists: "This email is already registered",
    noUser: "Account not found",
    wrongPw: "Wrong password",
    banned: "Account is disabled",
    resetOk: "Password reset successful",
    bLang: "Unsupported language",
  },
  bn: {
    verified: "যাচাই হয়েছে", rejected: "বাতিল",
    bPw: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে",
    bMatch: "পাসওয়ার্ড মিলছে না",
    bEmail: "ইমেইল সঠিক নয়",
    exists: "এই ইমেইল আগে থেকেই নিবন্ধিত",
    noUser: "অ্যাকাউন্ট পাওয়া যায়নি",
    wrongPw: "পাসওয়ার্ড ভুল",
    banned: "অ্যাকাউন্ট বন্ধ করা আছে",
    resetOk: "পাসওয়ার্ড রিসেট হয়েছে",
    bLang: "এই ভাষা সাপোর্ট করা হয় না",
  },
  hi: { verified: "सत्यापित", rejected: "अस्वीकृत" },
  ur: { verified: "تصدیق شدہ", rejected: "مسترد" },
  ar: { verified: "تم التحقق", rejected: "مرفوض" },
  fr: { verified: "Vérifié", rejected: "Refusé" },
  es: { verified: "Verificado", rejected: "Rechazado" },
  de: { verified: "Verifiziert", rejected: "Abgelehnt" },
  pt: { verified: "Verificado", rejected: "Recusado" },
  ru: { verified: "Подтверждено", rejected: "Отклонено" },
  tr: { verified: "Doğrulandı", rejected: "Reddedildi" },
  zh: { verified: "已认证", rejected: "已拒绝" },          // zh-CN এটাই নেবে
  "zh-TW": { verified: "已認證", rejected: "已拒絕" },
  ja: { verified: "確認済み", rejected: "却下" },
  id: { verified: "Terverifikasi", rejected: "Ditolak" },
};

/* পুরনো Home.jsx এর T, T2, T3 এর ভেতরের কনটেন্ট হুবহু এখানে বসান (শুধু {...} এর ভেতরটুকু) */
const OLD_T = {
  // en: { home: "Home", market: "Market", ... },
  // bn: { ... },
};
const OLD_T2 = {};
const OLD_T3 = {};

const merge = (...parts) => {
  const out = {};
  parts.forEach((p) =>
    Object.entries(p || {}).forEach(([lg, d]) => { out[lg] = { ...(out[lg] || {}), ...d }; })
  );
  return out;
};

export const T = merge(SYSTEM, OLD_T, OLD_T2, OLD_T3);

/* খোঁজার ক্রম: ভাষা -> মূল ভাষা (zh-CN -> zh) -> English -> কী নিজে */
export const translate = (lang, k) => {
  const base = String(lang || "en").split("-")[0];
  return T[lang]?.[k] ?? T[base]?.[k] ?? T.en?.[k] ?? k;
};

/* ---------------- ভাষা বাছাইয়ের ড্রপডাউন ---------------- */
export function LangPicker({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const cur = LANGS.find((l) => l[0] === lang) || LANGS[0];
  return (
    <div className="cx-lgw">
      <button className="cx-lang" onClick={() => setOpen(!open)}>
        {cur[1]} <span className="cx-fl">{cur[2]}</span>
      </button>
      {open && (
        <>
          <div className="cx-lgback" onClick={() => setOpen(false)} />
          <div className="cx-lgm">
            {LANGS.map(([c, n, f]) => (
              <button key={c} className={c === lang ? "on" : ""} onClick={() => { setLang(c); setOpen(false); }}>
                <span>{n}</span>
                <span className="cx-fl">{f}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
