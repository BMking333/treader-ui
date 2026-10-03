import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/* ============================================================
   কনফিগ
============================================================ */
const BASE_URL = "https://loan.microfinancedevelopmentprojectbangladesh.com";
const DRAFT_KEY = "kyc_draft_v2";

const fileUrl = (v) => {
  if (!v) return null;
  if (v.startsWith("http")) return v;
  return `${BASE_URL}${v.startsWith("/") ? "" : "/"}${v}`;
};

const PROFESSIONS = ["ব্যবসায়ী", "চাকরিজীবী", "কৃষক", "শিক্ষক", "ড্রাইভার", "গৃহিণী", "শিক্ষার্থী", "অন্যান্য"];
const LOAN_REASONS = ["ব্যবসা", "চিকিৎসা", "শিক্ষা", "বিবাহ", "বাড়ি নির্মাণ", "কৃষি", "ব্যক্তিগত প্রয়োজন"];
const RELATIONS = ["পিতা", "মাতা", "স্বামী", "স্ত্রী", "ভাই", "বোন", "ছেলে", "মেয়ে", "অন্যান্য"];

// ২টি পেজ: ১) নাম-ঠিকানা-নমিনি  ২) ডকুমেন্ট ও সিগনেচার
const STEPS = [
  { title: "ব্যক্তিগত তথ্য", sub: "নাম, ঠিকানা ও নমিনি", icon: "badge" },
  { title: "ডকুমেন্ট", sub: "ছবি, এনআইডি ও সিগনেচার", icon: "shield" },
];

const STEP_FIELDS = {
  1: [
    "full_name", "nid_number", "mobile_number", "profession", "loan_reason",
    "current_address", "permanent_address",
    "nominee_name", "nominee_relation", "nominee_phone",
  ],
  2: ["selfie", "nid_front", "nid_back", "signature"],
};

const INITIAL = {
  full_name: "",
  nid_number: "",
  mobile_number: "",
  profession: "",
  loan_reason: "",
  current_address: "",
  permanent_address: "",
  nominee_name: "",
  nominee_relation: "",
  nominee_phone: "",
  selfie: null,
  nid_front: null,
  nid_back: null,
  signature: null,
};

const PHONE_RE = /^01[3-9]\d{8}$/;

/* ============================================================
   স্টাইল (প্রিমিয়াম ব্যাংক: navy + orange)
============================================================ */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap');

.kc-root { font-family: 'Hind Siliguri', 'Noto Sans Bengali', 'Kalpurush', system-ui, sans-serif; }
.kc-num { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-variant-numeric: tabular-nums; }
.kc-sheet { animation: kcUp .25s ease-out; }
@keyframes kcUp { from { transform: translateY(28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

const CARD = "rounded-[28px] bg-white shadow-[0_10px_30px_-8px_rgba(15,27,61,0.14)]";
const NAVY_GRAD = "bg-gradient-to-br from-[#1B2F6B] to-[#0F1B3D]";

const PRIMARY_BTN =
  "bg-gradient-to-b from-[#FB923C] via-[#F97316] to-[#EA580C] text-white " +
  "shadow-[0_10px_24px_-8px_rgba(249,115,22,0.6)] hover:brightness-105 active:translate-y-px " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F97316]/30 " +
  "disabled:opacity-70 disabled:cursor-not-allowed";

/* ============================================================
   আইকন
============================================================ */
const PATHS = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 15.3c1.9.7 3.1 2.2 3.5 4.7" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  ),
  badge: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6.5 16c.5-1.6 1.6-2.2 2.5-2.2s2 .6 2.5 2.2M14 10h4M14 14h3" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 15h2" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  city: <path d="M4 21V8l6-3v16M10 21V11l6-2v12M3 21h18" />,
  heart: <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" />,
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  pen: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 11v5M12 7.5h.01" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h5" />
    </>
  ),
  flip: <path d="M3 7h13l-3-3M21 17H8l3 3" />,
  face: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2M9 10h.01M15 10h.01" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-9 9" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 13l4 4L19 7" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5M12 16.5h.01" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4" />
      <path d="M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4" />
    </>
  ),
};

const Icon = ({ name, className = "h-5 w-5", strokeWidth = 1.9 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {PATHS[name] || PATHS.doc}
  </svg>
);

/* ============================================================
   ছোট UI অংশ
============================================================ */
const Shell = ({ title, children }) => {
  // ব্রাউজার/মোবাইলের স্ট্যাটাস বার হালকা রাখা (ব্যাটারি, নেটওয়ার্ক স্পষ্ট দেখাবে)
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');
    const created = !meta;
    const prev = meta?.getAttribute("content");
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "#FFFFFF");
    return () => {
      if (created) meta.remove();
      else if (prev) meta.setAttribute("content", prev);
    };
  }, []);

  return (
    <div className="kc-root min-h-screen bg-[#F3F6FB] text-[#111827]">
      <style>{styles}</style>
      <div className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white shadow-[0_6px_18px_-8px_rgba(15,27,61,0.18)] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-xl items-center gap-3.5 px-4 py-2.5">
          <button
            onClick={() => window.history.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F6FB] text-[#0F1B3D] transition hover:bg-[#E5E7EB] active:scale-95"
            aria-label="পেছনে যান"
          >
            <Icon name="back" className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <h1 className="flex-1 truncate text-[20px] font-extrabold text-[#0F1B3D]">{title}</h1>
          <Icon name="shield" className="h-[22px] w-[22px] text-[#16A34A]" />
        </div>
      </div>
      <div className="mx-auto max-w-xl px-4 py-5">{children}</div>
    </div>
  );
};

const IconTile = ({ name }) => (
  <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[15px] bg-[#FFF1E6] text-[#F97316]">
    <Icon name={name} className="h-[23px] w-[23px]" />
  </span>
);

const Chip = ({ children, tone = "green", icon }) => {
  const tones = {
    green: "bg-[#ECFDF3] text-[#16A34A]",
    red: "bg-[#FEF2F2] text-[#DC2626]",
  };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ${tones[tone]}`}>
      {icon && <Icon name={icon} className="h-3.5 w-3.5" strokeWidth={2.4} />}
      {children}
    </span>
  );
};

const SectionHead = ({ title, subtitle, icon, right }) => (
  <div className="flex items-center gap-3">
    <IconTile name={icon} />
    <div className="min-w-0 flex-1">
      <h2 className="text-[18px] font-extrabold leading-tight text-[#0F1B3D]">{title}</h2>
      {subtitle && <p className="text-[13px] text-[#6B7280]">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const Card = ({ title, subtitle, icon, children }) => (
  <div className={`mb-4 p-5 ${CARD}`}>
    {title && (
      <div className="mb-[18px]">
        <SectionHead title={title} subtitle={subtitle} icon={icon} />
      </div>
    )}
    <div className="space-y-[18px]">{children}</div>
  </div>
);

const inputBase =
  "w-full rounded-[20px] border bg-white px-4 py-3.5 text-[17px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:ring-4";
const inputOk = "border-[#E5E7EB] focus:border-[#F97316] focus:ring-[#F97316]/15";
const inputErr = "border-[#FCA5A5] bg-[#FEF2F2] focus:border-[#DC2626] focus:ring-[#DC2626]/10";
const softShadow = "shadow-[0_5px_14px_-6px_rgba(15,27,61,0.14)]";

const Label = ({ children }) => (
  <label className="mb-2 block pl-1 text-[15px] font-bold text-[#1F2937]">{children}</label>
);

const ErrText = ({ children }) => (
  <p className="mt-1.5 flex items-center gap-1 pl-1 text-[13px] font-medium text-[#DC2626]">
    <Icon name="alert" className="h-[15px] w-[15px]" />
    {children}
  </p>
);

const Field = ({ label, name, value, onChange, error, placeholder, inputMode, textarea, maxLength, icon }) => (
  <div>
    <Label>{label}</Label>
    <div className={`relative rounded-[20px] ${softShadow}`}>
      {icon && (
        <span
          className={`pointer-events-none absolute left-4 z-10 ${
            textarea ? "top-4" : "top-1/2 -translate-y-1/2"
          } ${error ? "text-[#DC2626]" : "text-[#6B7280]"}`}
        >
          <Icon name={icon} className="h-[22px] w-[22px]" />
        </span>
      )}
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          className={`${inputBase} ${icon ? "pl-12" : ""} resize-none ${error ? inputErr : inputOk}`}
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type="text"
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete="off"
          className={`${inputBase} ${icon ? "pl-12" : ""} ${inputMode === "numeric" ? "kc-num" : ""} ${
            error ? inputErr : inputOk
          }`}
        />
      )}
    </div>
    {error && <ErrText>{typeof error === "string" ? error : "এই ঘরটি পূরণ করুন"}</ErrText>}
  </div>
);

/* প্রিমিয়াম ড্রপডাউন — ক্লিক করলে নিচ থেকে সুন্দর লিস্ট খুলবে */
const SelectField = ({ label, name, value, onSelect, options, error, icon }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  return (
    <div>
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-[20px] border bg-white px-4 py-3.5 text-left text-[17px] outline-none transition focus-visible:ring-4 ${softShadow} ${
          error
            ? "border-[#FCA5A5] bg-[#FEF2F2] focus-visible:ring-[#DC2626]/10"
            : "border-[#E5E7EB] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/15"
        }`}
      >
        <Icon name={icon} className={`h-[22px] w-[22px] ${error ? "text-[#DC2626]" : "text-[#6B7280]"}`} />
        <span className={`flex-1 ${value ? "text-[#111827]" : "text-[#9CA3AF]"}`}>
          {value || "-- নির্বাচন করুন --"}
        </span>
        <Icon name="chevron" className="h-5 w-5 text-[#6B7280]" strokeWidth={2.2} />
      </button>
      {error && <ErrText>একটি অপশন নির্বাচন করুন</ErrText>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#0F1B3D]/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="kc-sheet relative flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-20px_60px_-20px_rgba(15,27,61,0.5)] sm:rounded-[30px]">
            <div className="mx-auto mt-2.5 h-[5px] w-11 rounded-full bg-[#E5E7EB]" />
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h3 className="text-[19px] font-extrabold text-[#0F1B3D]">{label}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F6FB]"
                aria-label="বন্ধ করুন"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
              {options.map((o) => {
                const sel = o === value;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => {
                      onSelect(name, o);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-[16px] transition active:scale-[0.99] ${
                      sel
                        ? "border-[#F97316] bg-[#FFF1E6] font-extrabold text-[#EA580C]"
                        : "border-[#E5E7EB] bg-[#F8FAFC] font-medium text-[#111827] hover:border-[#F97316]/50"
                    }`}
                  >
                    {o}
                    {sel && <Icon name="check" className="h-5 w-5 text-[#F97316]" strokeWidth={2.6} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   ডকুমেন্ট আপলোড কার্ড (লম্বালম্বি)
============================================================ */
const UploadCard = ({ title, hint, icon, file, onPick, error, camera = "environment" }) => {
  const camRef = useRef(null);
  const galRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!(file instanceof File)) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handle = (e) => {
    const f = e.target.files?.[0];
    if (f) onPick(f);
    e.target.value = "";
  };

  return (
    <div className={`mb-4 p-5 ${CARD}`}>
      <div className="mb-4">
        <SectionHead
          title={title}
          subtitle={hint}
          icon={icon}
          right={
            file ? (
              <Chip icon="check">আপলোড হয়েছে</Chip>
            ) : error ? (
              <Chip tone="red">আবশ্যক</Chip>
            ) : null
          }
        />
      </div>

      <div
        onClick={() => galRef.current?.click()}
        className={`relative flex h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border-[1.6px] border-dashed text-center transition active:scale-[0.99] ${
          error
            ? "border-[#FCA5A5] bg-[#FEF2F2]"
            : preview
            ? "border-[#16A34A] bg-[#F8FAFC]"
            : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#F97316]"
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt={title} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-[#0F1B3D]/85 to-transparent py-3 text-[13px] font-bold text-white">
              <Icon name="refresh" className="h-4 w-4" /> ছবি পরিবর্তন করুন
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#FFF1E6] text-[#F97316]">
              <Icon name="camera" className="h-7 w-7" />
            </span>
            <p className="text-[15px] font-bold text-[#0F1B3D]">ছবি তুলুন বা আপলোড করুন</p>
            <p className="text-[12px] text-[#6B7280]">ক্যামেরা বা গ্যালারি থেকে বেছে নিন</p>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => camRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] py-3 text-[14px] font-bold text-[#0F1B3D] transition hover:border-[#F97316] active:scale-95"
        >
          <Icon name="camera" className="h-[18px] w-[18px] text-[#F97316]" /> ক্যামেরা
        </button>
        <button
          type="button"
          onClick={() => galRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] py-3 text-[14px] font-bold text-[#0F1B3D] transition hover:border-[#F97316] active:scale-95"
        >
          <Icon name="image" className="h-[18px] w-[18px] text-[#F97316]" /> গ্যালারি
        </button>
      </div>

      <input ref={camRef} type="file" accept="image/*" capture={camera} hidden onChange={handle} />
      <input ref={galRef} type="file" accept="image/*" hidden onChange={handle} />

      {error && <ErrText>এই ছবিটি আবশ্যক</ErrText>}
    </div>
  );
};

/* ============================================================
   সিগনেচার প্যাড
   - সই করার সময় পেজ স্ক্রল হবে না (touch-action: none + touchmove block)
   - শুধু ট্যাপ করলেও ফোঁটা পড়বে
   - দাগ মসৃণ (quadratic curve)
============================================================ */
const SIG_H = 210;

const SignaturePad = ({ value, onChange, error }) => {
  const canvasRef = useRef(null);
  const strokes = useRef([]); // [[{x,y}, ...], ...]
  const baseImg = useRef(null); // আগে আঁকা সিগনেচার (ধাপে ফিরে এলে)
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(!value);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, SIG_H);
    if (baseImg.current) ctx.drawImage(baseImg.current, 0, 0, w, SIG_H);

    ctx.strokeStyle = "#0F1B3D";
    ctx.fillStyle = "#0F1B3D";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    strokes.current.forEach((s) => {
      if (!s.length) return;
      if (s.length === 1) {
        ctx.beginPath();
        ctx.arc(s[0].x, s[0].y, 1.7, 0, Math.PI * 2); // ফোঁটা
        ctx.fill();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) {
        const mx = (s[i - 1].x + s[i].x) / 2;
        const my = (s[i - 1].y + s[i].y) / 2;
        ctx.quadraticCurveTo(s[i - 1].x, s[i - 1].y, mx, my);
      }
      ctx.lineTo(s[s.length - 1].x, s[s.length - 1].y);
      ctx.stroke();
    });
  }, []);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(SIG_H * ratio);
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (value) {
      const img = new Image();
      img.onload = () => {
        baseImg.current = img;
        redraw();
      };
      img.src = value;
    }
    setup();

    // iOS/Android: সই করার সময় পেজ স্ক্রল আটকানো
    const block = (e) => e.preventDefault();
    canvas.addEventListener("touchstart", block, { passive: false });
    canvas.addEventListener("touchmove", block, { passive: false });

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      let lastW = canvas.clientWidth;
      ro = new ResizeObserver(() => {
        if (canvas.clientWidth !== lastW) {
          lastW = canvas.clientWidth;
          setup();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      canvas.removeEventListener("touchstart", block);
      canvas.removeEventListener("touchmove", block);
      ro?.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.min(Math.max(e.clientX - rect.left, 0), rect.width),
      y: Math.min(Math.max(e.clientY - rect.top, 0), SIG_H),
    };
  };

  const start = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    strokes.current.push([pos(e)]);
    setEmpty(false);
    redraw();
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const s = strokes.current[strokes.current.length - 1];
    s.push(pos(e));
    redraw();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    strokes.current = [];
    baseImg.current = null;
    setEmpty(true);
    redraw();
    onChange(null);
  };

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-[20px] border-[1.6px] border-dashed bg-white ${
          error ? "border-[#FCA5A5]" : "border-[#CBD5E1]"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="block w-full select-none"
          style={{ height: SIG_H, touchAction: "none", overscrollBehavior: "contain", cursor: "crosshair" }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
        />

        {/* গাইড লাইন (সেভ হওয়া ছবিতে যাবে না) */}
        <div className="pointer-events-none absolute inset-x-6 bottom-[52px] border-b border-[#E2E8F0]" />
        <span className="pointer-events-none absolute bottom-[58px] left-6 text-[15px] text-[#CBD5E1]">✕</span>

        {empty && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[#9CA3AF]">
            <Icon name="pen" className="h-[30px] w-[30px] text-[#CBD5E1]" />
            <span className="text-[15px] font-semibold">এখানে সই করুন</span>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <Icon name="info" className="h-[15px] w-[15px] shrink-0 text-[#6B7280]" />
        <span className="flex-1 text-[12.5px] text-[#6B7280]">আঙুল/মাউস দিয়ে বক্সের ভেতরে সই করুন</span>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 rounded-full bg-[#FEF2F2] px-3 py-1.5 text-[13px] font-bold text-[#DC2626] transition active:scale-95"
        >
          <Icon name="trash" className="h-4 w-4" /> মুছুন
        </button>
      </div>
      {error && <ErrText>সিগনেচার আবশ্যক</ErrText>}
    </div>
  );
};

/* ============================================================
   কেওয়াইসি ফর্ম (২ পেজ)
============================================================ */
const KycForm = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [formData, setFormData] = useState(INITIAL);

  /* ড্রাফট: শুধু টেক্সট ফিল্ড সেভ হবে (ফাইল/Base64 না) */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (saved) setFormData((p) => ({ ...p, ...saved }));
    } catch {}
  }, []);

  useEffect(() => {
    const textOnly = {};
    Object.entries(formData).forEach(([k, v]) => {
      if (typeof v === "string" && k !== "signature") textOnly[k] = v;
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(textOnly));
  }, [formData]);

  const setField = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: undefined } : p));
  };

  const handleChange = (e) => setField(e.target.name, e.target.value);

  const validate = () => {
    const err = {};
    STEP_FIELDS[step].forEach((k) => {
      const v = formData[k];
      if (!v || (typeof v === "string" && !v.trim())) err[k] = true;
    });
    if (step === 1) {
      if (!err.nid_number && ![10, 13, 17].includes(formData.nid_number.trim().length))
        err.nid_number = "এনআইডি 10, 13 বা 17 ডিজিটের হতে হবে";
      if (!err.mobile_number && !PHONE_RE.test(formData.mobile_number.trim()))
        err.mobile_number = "সঠিক 11 ডিজিটের মোবাইল নম্বর দিন";
      if (!err.nominee_phone && !PHONE_RE.test(formData.nominee_phone.trim()))
        err.nominee_phone = "সঠিক 11 ডিজিটের মোবাইল নম্বর দিন";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const next = () => {
    if (!validate()) return toTop();
    setStep((s) => s + 1);
    toTop();
  };

  const prev = () => {
    setStep((s) => s - 1);
    setErrors({});
    toTop();
  };

  const submit = async () => {
    if (!validate()) return toTop();
    try {
      setLoading(true);
      setServerError("");

      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (!v || k === "signature") return;
        form.append(k, typeof v === "string" ? v.trim() : v);
      });

      if (formData.signature) {
        const blob = await (await fetch(formData.signature)).blob();
        form.append("signature", blob, "signature.png");
      }

      // Content-Type ম্যানুয়ালি সেট করবেন না
      await api.put("/user/kyc/submit-personal-info", form);

      localStorage.removeItem(DRAFT_KEY);
      onSuccess?.(); // সফল হলে /loan পেজে যাবে
    } catch (err) {
      const d = err?.response?.data?.detail;
      setServerError(typeof d === "string" ? d : "জমা দিতে সমস্যা হয়েছে, আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="pb-32">
      {/* ধাপ নির্দেশক */}
      <div className={`mb-4 rounded-[28px] p-5 shadow-[0_14px_30px_-10px_rgba(15,27,61,0.45)] ${NAVY_GRAD}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-extrabold text-white">{STEPS[step - 1].sub}</h2>
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-bold text-[#FFD2A8]">
            ধাপ <span className="kc-num">{step}</span> / <span className="kc-num">{STEPS.length}</span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            const lit = done || active;
            return (
              <div key={s.title}>
                <div
                  className={`h-[5px] rounded-full transition-all duration-500 ${lit ? "bg-[#F97316]" : "bg-white/20"}`}
                />
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                      done ? "bg-[#F97316]" : active ? "bg-white/20" : "bg-white/10"
                    }`}
                  >
                    <Icon name={done ? "check" : s.icon} className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </span>
                  <span className={`truncate text-[13px] font-bold ${lit ? "text-white" : "text-white/55"}`}>
                    {s.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasErrors && (
        <div className="mb-4 flex items-center gap-2.5 rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-[14px] font-semibold text-[#DC2626]">
          <Icon name="alert" className="h-5 w-5 shrink-0" />
          লাল চিহ্নিত ঘরগুলো সঠিকভাবে পূরণ করুন
        </div>
      )}

      {/* ===== পেজ ১: নাম, ঠিকানা, নমিনি ===== */}
      {step === 1 && (
        <>
          <Card title="ব্যক্তিগত তথ্য" subtitle="এনআইডি অনুযায়ী সঠিক তথ্য দিন" icon="user">
            <Field icon="user" label="পূর্ণ নাম" name="full_name" value={formData.full_name} onChange={handleChange} error={errors.full_name} placeholder="এনআইডি অনুযায়ী নাম" />
            <Field icon="badge" label="এনআইডি নম্বর" name="nid_number" value={formData.nid_number} onChange={handleChange} error={errors.nid_number} placeholder="10 / 13 / 17 ডিজিট" inputMode="numeric" maxLength={17} />
            <Field icon="phone" label="মোবাইল নম্বর" name="mobile_number" value={formData.mobile_number} onChange={handleChange} error={errors.mobile_number} placeholder="017XXXXXXXX" inputMode="numeric" maxLength={11} />
            <SelectField icon="briefcase" label="পেশা" name="profession" value={formData.profession} onSelect={setField} options={PROFESSIONS} error={errors.profession} />
            <SelectField icon="wallet" label="লোনের কারণ" name="loan_reason" value={formData.loan_reason} onSelect={setField} options={LOAN_REASONS} error={errors.loan_reason} />
          </Card>

          <Card title="ঠিকানা" subtitle="বর্তমান ও স্থায়ী ঠিকানা" icon="pin">
            <Field textarea icon="home" label="বর্তমান ঠিকানা" name="current_address" value={formData.current_address} onChange={handleChange} error={errors.current_address} placeholder="গ্রাম/মহল্লা, থানা, জেলা" />
            <Field textarea icon="city" label="স্থায়ী ঠিকানা" name="permanent_address" value={formData.permanent_address} onChange={handleChange} error={errors.permanent_address} placeholder="গ্রাম/মহল্লা, থানা, জেলা" />
            <button
              type="button"
              onClick={() => setField("permanent_address", formData.current_address)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1E6] px-3.5 py-2 text-[13.5px] font-bold text-[#EA580C] transition active:scale-95"
            >
              <Icon name="copy" className="h-[15px] w-[15px]" /> বর্তমান ঠিকানাই স্থায়ী ঠিকানা
            </button>
          </Card>

          <Card title="নমিনি তথ্য" subtitle="জরুরি প্রয়োজনে যোগাযোগের ব্যক্তি" icon="users">
            <Field icon="user" label="নমিনির নাম" name="nominee_name" value={formData.nominee_name} onChange={handleChange} error={errors.nominee_name} placeholder="নমিনির পূর্ণ নাম" />
            <SelectField icon="heart" label="সম্পর্ক" name="nominee_relation" value={formData.nominee_relation} onSelect={setField} options={RELATIONS} error={errors.nominee_relation} />
            <Field icon="phone" label="নমিনির ফোন" name="nominee_phone" value={formData.nominee_phone} onChange={handleChange} error={errors.nominee_phone} placeholder="017XXXXXXXX" inputMode="numeric" maxLength={11} />
          </Card>
        </>
      )}

      {/* ===== পেজ ২: ডকুমেন্ট (লম্বালম্বি) + সিগনেচার ===== */}
      {step === 2 && (
        <>
          <div className="mb-4 flex items-start gap-2.5 rounded-[18px] border border-[#BFDBFE] bg-[#EFF6FF] p-3.5 text-[13.5px] leading-relaxed text-[#1E40AF]">
            <Icon name="bulb" className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
            ছবি যেন পরিষ্কার ও আলোতে তোলা হয়। এনআইডির চারটি কোণা ও লেখা স্পষ্ট দেখা যেতে হবে।
          </div>

          <UploadCard
            title="আপনার সেলফি"
            hint="মুখ পরিষ্কার দেখা যায় এমন ছবি"
            icon="face"
            camera="user"
            file={formData.selfie}
            onPick={(f) => setField("selfie", f)}
            error={errors.selfie}
          />
          <UploadCard
            title="এনআইডি কার্ড (সামনে)"
            hint="কার্ডের সামনের দিকের ছবি"
            icon="card"
            file={formData.nid_front}
            onPick={(f) => setField("nid_front", f)}
            error={errors.nid_front}
          />
          <UploadCard
            title="এনআইডি কার্ড (পেছনে)"
            hint="কার্ডের পেছনের দিকের ছবি"
            icon="flip"
            file={formData.nid_back}
            onPick={(f) => setField("nid_back", f)}
            error={errors.nid_back}
          />

          <div className={`mb-4 p-5 ${CARD}`}>
            <div className="mb-4">
              <SectionHead
                title="ডিজিটাল সিগনেচার"
                subtitle="আপনার স্বাভাবিক সই করুন"
                icon="pen"
                right={
                  formData.signature ? (
                    <Chip icon="check">সই হয়েছে</Chip>
                  ) : errors.signature ? (
                    <Chip tone="red">আবশ্যক</Chip>
                  ) : null
                }
              />
            </div>
            <SignaturePad value={formData.signature} onChange={(v) => setField("signature", v)} error={errors.signature} />
          </div>

          {serverError && (
            <div className="mb-4 flex items-start gap-3 rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] p-4 text-[15px] font-semibold text-[#DC2626]">
              <Icon name="alert" className="h-5 w-5 shrink-0" />
              <p>{serverError}</p>
            </div>
          )}
        </>
      )}

      {/* নিচের বাটন বার */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white shadow-[0_-6px_24px_rgba(15,27,61,0.1)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-xl gap-3 px-4 py-3">
          {step > 1 && (
            <button
              onClick={prev}
              disabled={loading}
              className="w-1/3 rounded-[22px] border-[1.4px] border-[#E5E7EB] bg-white py-4 text-[16px] font-bold text-[#0F1B3D] transition hover:border-[#F97316] active:scale-95 disabled:opacity-60"
            >
              পেছনে
            </button>
          )}
          {step < STEPS.length ? (
            <button
              onClick={next}
              className={`flex flex-1 items-center justify-center gap-2 rounded-[22px] py-4 text-[17px] font-bold transition ${PRIMARY_BTN}`}
            >
              পরবর্তী ধাপ <Icon name="arrow" className="h-5 w-5" strokeWidth={2.2} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading}
              className={`flex flex-1 items-center justify-center gap-2 rounded-[22px] py-4 text-[17px] font-bold transition ${PRIMARY_BTN}`}
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
                  জমা হচ্ছে...
                </>
              ) : (
                <>
                  <Icon name="shield" className="h-5 w-5" /> জমা দিন
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   বিস্তারিত (শুধু দেখার জন্য)
============================================================ */
const DetailCard = ({ title, icon, children }) => (
  <div className={`mb-4 p-5 ${CARD}`}>
    <div className="mb-2.5">
      <SectionHead title={title} icon={icon} />
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value, num }) => (
  <div className="flex justify-between gap-4 border-b border-[#F1F5F9] py-3.5 last:border-0">
    <span className="shrink-0 text-[14px] text-[#6B7280]">{label}</span>
    <span className={`break-words text-right text-[16px] font-bold text-[#0F1B3D] ${num ? "kc-num" : ""}`}>
      {value || "—"}
    </span>
  </div>
);

const DocThumb = ({ label, src, onOpen }) => {
  const url = fileUrl(src);
  return (
    <button
      type="button"
      disabled={!url}
      onClick={() => url && onOpen({ url, label })}
      className="group relative h-[132px] overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-[#F8FAFC] transition active:scale-[0.97] disabled:opacity-60"
    >
      {url ? (
        <>
          <img src={url} alt={label} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F1B3D]/90 to-transparent py-2.5 text-[12.5px] font-bold text-white">
            {label}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-[12px] text-[#6B7280]">
          <Icon name="image" className="h-7 w-7" />
          {label}
          <span className="text-[11px] text-[#9CA3AF]">আপলোড নেই</span>
        </div>
      )}
    </button>
  );
};

const formatDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const KycDetails = ({ data }) => {
  const [viewer, setViewer] = useState(null);
  const submittedAt = formatDate(data.last_submitted_at || data.updated_at);

  return (
    <div className="pb-8">
      {/* স্ট্যাটাস কার্ড */}
      <div className={`mb-4 flex items-center gap-3.5 rounded-[28px] p-5 shadow-[0_14px_30px_-10px_rgba(15,27,61,0.45)] ${NAVY_GRAD}`}>
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[#4ADE80]">
          <Icon name="shield" className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="text-[18px] font-extrabold text-white">কেওয়াইসি জমা হয়েছে</p>
          {submittedAt && (
            <p className="kc-num mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-[#FFD2A8]">
              <Icon name="clock" className="h-3.5 w-3.5" /> {submittedAt}
            </p>
          )}
        </div>
      </div>

      <DetailCard title="ব্যক্তিগত তথ্য" icon="user">
        <InfoRow label="পূর্ণ নাম" value={data.full_name} />
        <InfoRow label="ফোন" value={data.phone_number} num />
        <InfoRow label="মোবাইল" value={data.mobile_number} num />
        <InfoRow label="এনআইডি" value={data.nid_number} num />
        <InfoRow label="পেশা" value={data.profession} />
        <InfoRow label="লোনের কারণ" value={data.loan_reason} />
      </DetailCard>

      <DetailCard title="ঠিকানা" icon="pin">
        <InfoRow label="বর্তমান" value={data.current_address} />
        <InfoRow label="স্থায়ী" value={data.permanent_address} />
      </DetailCard>

      <DetailCard title="নমিনি" icon="users">
        <InfoRow label="নাম" value={data.nominee_name} />
        <InfoRow label="সম্পর্ক" value={data.nominee_relation} />
        <InfoRow label="ফোন" value={data.nominee_phone} num />
      </DetailCard>

      <DetailCard title="ডকুমেন্টস" icon="doc">
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <DocThumb label="সেলফি" src={data.selfie} onOpen={setViewer} />
          <DocThumb label="এনআইডি সামনে" src={data.nid_front} onOpen={setViewer} />
          <DocThumb label="এনআইডি পেছনে" src={data.nid_back} onOpen={setViewer} />
          <DocThumb label="সিগনেচার" src={data.signature} onOpen={setViewer} />
        </div>
      </DetailCard>

      {/* ছবি বড় করে দেখা */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F1B3D]/95 p-4"
          onClick={() => setViewer(null)}
        >
          <p className="mb-3 text-[17px] font-bold text-white">{viewer.label}</p>
          <img
            src={viewer.url}
            alt={viewer.label}
            className="max-h-[75vh] max-w-full rounded-[20px] bg-white object-contain"
          />
          <button className={`mt-5 rounded-[18px] px-8 py-3 text-[15px] font-bold ${PRIMARY_BTN}`}>বন্ধ করুন</button>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   মূল কম্পোনেন্ট (ফর্ম বা বিস্তারিত অটো দেখাবে)
============================================================ */
const PersonalInfo = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/user/kyc/me"); // টোকেন interceptor-ই দিচ্ছে
      setData(res.data || null);
    } catch (err) {
      console.error("কেওয়াইসি ডাটা লোডে সমস্যা:", err);
      setData(null);
      setError("ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // জমা সফল হলে /loan পেজে নিয়ে যাবে
  const handleSuccess = () => {
    navigate("/loan", { replace: true });
  };

  if (loading) {
    return (
      <Shell title="ব্যক্তিগত তথ্য">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-[28px] bg-[#E2E8F0]" />
          <div className="h-56 rounded-[28px] bg-white" />
          <div className="h-40 rounded-[28px] bg-white" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell title="ব্যক্তিগত তথ্য">
        <div className="py-16 text-center">
          <p className="mb-4 font-semibold text-[#DC2626]">{error}</p>
          <button onClick={fetchData} className={`rounded-[18px] px-7 py-3 font-bold ${PRIMARY_BTN}`}>
            আবার চেষ্টা করুন
          </button>
        </div>
      </Shell>
    );
  }

  // শুধু kyc_submitted দিয়ে চেক (full_name রেজিস্ট্রেশনে থাকলেও ফর্ম দেখাবে)
  const submitted = data?.kyc_submitted === true;

  return (
    <Shell title={submitted ? "আমার কেওয়াইসি তথ্য" : "কেওয়াইসি যাচাইকরণ"}>
      {submitted ? <KycDetails data={data} /> : <KycForm onSuccess={handleSuccess} />}
    </Shell>
  );
};

export default PersonalInfo;
