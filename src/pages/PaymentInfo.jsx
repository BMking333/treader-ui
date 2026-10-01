import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import backIcon from "../assets/icons/back.png";
import bkashLogo from "../assets/BKash.png";
import nagadLogo from "../assets/Nagad.png";
import rocketLogo from "../assets/rocket.png";
import bankLogo from "../assets/bank.png";

/* ================= STYLES ================= */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap');

.pi-root {
  font-family: 'Noto Sans Bengali', 'Hind Siliguri', 'Kalpurush', system-ui, sans-serif;
  font-feature-settings: "liga" 1, "clig" 1, "rlig" 1, "calt" 1, "locl" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}
.pi-root h1, .pi-root h2, .pi-root h3, .pi-root p, .pi-root span, .pi-root button, .pi-root label {
  letter-spacing: 0 !important;
}
.pi-root input { font-size: 16px; }
`;

/* ================= মেথড স্টাইল (type অনুযায়ী) ================= */
const STYLES = {
  bkash: {
    bn: "বিকাশ",
    logo: bkashLogo,
    card: "from-[#6B0F36] via-[#B5124F] to-[#E2136E]",
  },
  nagad: {
    bn: "নগদ",
    logo: nagadLogo,
    card: "from-[#6E2605] via-[#C2410C] to-[#F26B21]",
  },
  rocket: {
    bn: "রকেট",
    logo: rocketLogo,
    card: "from-[#2A0E5C] via-[#5B2A86] to-[#8B2F97]",
  },
  bank: {
    bn: "ব্যাংক",
    logo: bankLogo,
    card: "from-[#06121F] via-[#0F3045] to-[#1E5A74]",
  },
  default: {
    bn: null,
    logo: bankLogo,
    card: "from-[#06121F] via-[#0F3045] to-[#1E5A74]",
  },
};

const normalizeMethod = (m) => {
  const t = (m.method_type || "").toLowerCase().trim();
  const s = STYLES[t] || STYLES.default;
  return {
    id: String(m.id),
    name: s.bn || m.method_name,
    type: t === "bank" ? "bank" : "mobile",
    card: s.card,
    logo: s.logo,
  };
};

const groupDigits = (s = "") => s.replace(/(.{4})/g, "$1 ").trim();

const maskNumber = (n = "") =>
  n.length > 4 ? "•".repeat(n.length - 4) + n.slice(-4) : n;

/* ================= ছোট আইকন ================= */
const ChipSvg = () => (
  <svg width="44" height="34" viewBox="0 0 42 32" fill="none">
    <rect x="1" y="1" width="40" height="30" rx="6" fill="#E8CB7E" stroke="#B48A34" strokeWidth="1.5" />
    <path d="M1 11h40M1 21h40M15 1v30M27 1v30" stroke="#8A6A1F" strokeWidth="1" opacity="0.6" />
  </svg>
);

const EyeIcon = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
    <path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="14" rx="3" />
    <path d="M3 10h18M16 15h2" />
    <path d="M6 6l9-3 2 3" />
  </svg>
);

/* ================= থিম (Dashboard-এর মতো) ================= */
const GOLD_BTN =
  "bg-gradient-to-b from-[#E8CB7E] via-[#C9A24B] to-[#B48A34] text-[#1B1405] " +
  "shadow-[0_10px_24px_-8px_rgba(201,162,75,0.75),inset_0_1px_0_rgba(255,255,255,0.55)] " +
  "hover:brightness-105 active:translate-y-px active:scale-[0.99] " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A24B]/40 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const inputCls =
  "w-full rounded-xl border border-[#E3DDCC] bg-white px-4 py-3 text-[16px] font-medium text-[#0A1F2E] " +
  "outline-none transition placeholder:text-[#B5B09F] " +
  "focus:border-[#C9A24B] focus:ring-4 focus:ring-[#C9A24B]/20";

const Label = ({ children }) => (
  <label className="mb-1.5 block text-[14px] font-semibold text-[#33404A]">{children}</label>
);

/* ================= মূল কম্পোনেন্ট ================= */
const PaymentInfo = () => {
  const navigate = useNavigate();

  const [methods, setMethods] = useState([]);
  const [savedName, setSavedName] = useState("");
  const [payment, setPayment] = useState({
    payment_method_id: "",
    mobile_wallet_number: "",
    bank_account_number: "",
    bank_account_name: "",
    bank_name: "",
    bank_branch_name: "",
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [hasPayment, setHasPayment] = useState(false);
  const [showNumber, setShowNumber] = useState(false);

  /* ================= লোড ================= */
  const fetchAll = async () => {
    // একটি ফেইল করলেও অন্যটি কাজ করবে
    const [mRes, pRes] = await Promise.allSettled([
      api.get("/user/payment/methods"),
      api.get("/user/payment/me"),
    ]);

    if (mRes.status === "fulfilled") {
      setMethods((mRes.value.data || []).map(normalizeMethod));
    }

    if (pRes.status === "fulfilled") {
      const data = pRes.value.data || {};
      const exists =
        data.payment_method_id ||
        data.mobile_wallet_number ||
        data.bank_account_number;

      setHasPayment(!!exists);
      setSavedName(data.payment_method || "");

      setPayment({
        payment_method_id: data.payment_method_id ? String(data.payment_method_id) : "",
        mobile_wallet_number: data.mobile_wallet_number || "",
        bank_account_number: data.bank_account_number || "",
        bank_account_name: data.bank_account_name || "",
        bank_name: data.bank_name || "",
        bank_branch_name: data.bank_branch_name || "",
      });
    } else {
      setHasPayment(false);
      setMessage({ type: "error", text: "পেমেন্ট তথ্য লোড করতে সমস্যা হয়েছে" });
    }

    setPageLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ================= পরিবর্তন ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const digitsOnly = ["mobile_wallet_number", "bank_account_number"].includes(name);

    setPayment((prev) => ({
      ...prev,
      [name]: digitsOnly ? value.replace(/\D/g, "") : value,
    }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  const selectMethod = (id) => {
    setPayment((prev) => ({ ...prev, payment_method_id: id }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  /* ================= বর্তমান মেথড ================= */
  let method = methods.find((m) => m.id === payment.payment_method_id);

  // মেথড লিস্ট না এলেও সেভ করা কার্ড দেখানোর ফলব্যাক
  if (!method && hasPayment) {
    method = {
      id: payment.payment_method_id,
      name: savedName || "পেমেন্ট",
      type: payment.bank_account_number ? "bank" : "mobile",
      card: STYLES.default.card,
      logo: STYLES.default.logo,
    };
  }

  const isBank = method?.type === "bank";
  const isMobile = method?.type === "mobile";
  const accountNumber = payment.mobile_wallet_number || payment.bank_account_number || "";

  /* ================= জমা ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!method) {
      setMessage({ type: "error", text: "একটি পেমেন্ট মেথড নির্বাচন করুন" });
      return;
    }

    if (method.type === "mobile" && !/^01[3-9]\d{8}$/.test(payment.mobile_wallet_number)) {
      setMessage({ type: "error", text: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন" });
      return;
    }

    if (method.type === "bank" && !payment.bank_account_number.trim()) {
      setMessage({ type: "error", text: "ব্যাংক অ্যাকাউন্ট নম্বর দিন" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const formData = new FormData();
      formData.append("payment_method_id", payment.payment_method_id);
      formData.append("mobile_wallet_number", method.type === "mobile" ? payment.mobile_wallet_number : "");
      formData.append("payment_description", "");
      formData.append("bank_account_number", method.type === "bank" ? payment.bank_account_number : "");
      formData.append("bank_account_name", method.type === "bank" ? payment.bank_account_name : "");
      formData.append("bank_name", method.type === "bank" ? payment.bank_name : "");
      formData.append("bank_branch_name", method.type === "bank" ? payment.bank_branch_name : "");

      await api.post("/user/payment/update", formData);

      setMessage({ type: "success", text: "সফলভাবে সংরক্ষণ হয়েছে" });
      await fetchAll();
    } catch (err) {
      const d = err?.response?.data?.detail;
      setMessage({
        type: "error",
        text: typeof d === "string" ? d : "সংরক্ষণ করতে সমস্যা হয়েছে",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= টপ বার ================= */
  const TopBar = (
    <div className="sticky top-0 z-30 border-b border-[#C9A24B]/30 bg-[#081A2B]/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3.5">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A24B]/50 bg-[#C9A24B]/10 transition hover:bg-[#C9A24B]/20 active:scale-95"
          aria-label="প্রোফাইলে ফিরে যান"
        >
          <img src={backIcon} alt="পেছনে" className="h-5 w-5 invert" />
        </button>
        <h1 className="text-lg font-bold tracking-wide text-[#F2D98F]">পেমেন্ট সেটিংস</h1>
      </div>
    </div>
  );

  /* ================= লোডিং ================= */
  if (pageLoading) {
    return (
      <div lang="bn" className="pi-root min-h-screen bg-[#FAF8F3]">
        <style>{styles}</style>
        {TopBar}
        <div className="mx-auto mt-6 max-w-md animate-pulse space-y-4 px-4">
          <div className="h-52 rounded-3xl bg-[#EDE7D5]" />
          <div className="h-16 rounded-2xl bg-[#EDE7D5]" />
        </div>
      </div>
    );
  }

  return (
    <div lang="bn" className="pi-root min-h-screen bg-[#FAF8F3] pb-10 text-[#0A1F2E]">
      <style>{styles}</style>
      {TopBar}

      <div className="mx-auto mt-6 max-w-md space-y-5 px-4">
        {/* ===== বার্তা ===== */}
        {message.text && (
          <div
            className={`rounded-2xl border px-4 py-3 text-[15px] font-semibold ${
              message.type === "success"
                ? "border-[#BFE3D0] bg-[#EEF8F3] text-[#15724E]"
                : "border-[#F0C9C9] bg-[#FCEFEF] text-[#B02F2F]"
            }`}
          >
            {message.type === "success" ? "✅ " : "⚠️ "}
            {message.text}
          </div>
        )}

        {/* ================= সেভ করা পেমেন্ট কার্ড ================= */}
        {hasPayment && method && (
          <>
            <div
              className={`relative overflow-hidden rounded-3xl border border-[#E8CB7E]/50 bg-gradient-to-br ${method.card} p-6 text-white shadow-[0_24px_60px_-24px_rgba(10,31,46,0.8)]`}
            >
              {/* সাজসজ্জা */}
              <div className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full border border-white/15 bg-white/10" />
              <div className="pointer-events-none absolute -bottom-24 -left-14 h-64 w-64 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#F2D98F] to-transparent" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg ring-2 ring-[#E8CB7E]/70">
                      <img src={method.logo} alt={method.name} className="h-full w-full object-contain" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#F2D98F]/80">পেমেন্ট মেথড</p>
                      <p className="mt-0.5 text-xl font-bold">{method.name}</p>
                    </div>
                  </div>
                  <ChipSvg />
                </div>

                <div className="mt-8 flex items-center justify-between gap-3">
                  <p className="break-all font-mono text-[22px] font-semibold tracking-[0.18em] drop-shadow">
                    {groupDigits(showNumber ? accountNumber : maskNumber(accountNumber))}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNumber((s) => !s)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 transition hover:bg-white/25 active:scale-95"
                    aria-label="নম্বর দেখান বা লুকান"
                  >
                    <EyeIcon off={showNumber} />
                  </button>
                </div>

                <div className="mt-7 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#F2D98F]/70">
                      {isBank ? "অ্যাকাউন্ট হোল্ডার" : "অ্যাকাউন্ট টাইপ"}
                    </p>
                    <p className="truncate text-sm font-semibold uppercase">
                      {isBank ? payment.bank_account_name || "—" : "মোবাইল ওয়ালেট"}
                    </p>
                  </div>
                  {isBank && (
                    <div className="min-w-0 text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#F2D98F]/70">ব্যাংক</p>
                      <p className="truncate text-sm font-semibold">{payment.bank_name || "—"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isBank && (
              <div className="rounded-3xl border border-[#E3DDCC] bg-white px-5 py-2 shadow-[0_10px_40px_-24px_rgba(10,31,46,0.35)]">
                {[
                  ["অ্যাকাউন্টের নাম", payment.bank_account_name],
                  ["ব্যাংকের নাম", payment.bank_name],
                  ["শাখা", payment.bank_branch_name],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-[#EFE9D8] py-3 last:border-0">
                    <span className="shrink-0 text-[13px] font-medium text-[#5B6770]">{k}</span>
                    <span className="break-words text-right text-[15px] font-semibold text-[#0A1F2E]">{v || "—"}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#EBDCA8] bg-[#FDF6E3] px-4 py-3.5 text-[13px] font-semibold text-[#5C4512]">
              <LockIcon />
              <span>নিরাপত্তার জন্য পেমেন্ট তথ্য পরিবর্তন করা যাবে না</span>
            </div>
          </>
        )}

        {/* ================= ফর্ম ================= */}
        {!hasPayment && (
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl border border-[#C9A24B]/40 bg-white shadow-[0_20px_60px_-28px_rgba(10,31,46,0.45)]"
          >
            <div className="h-1.5 bg-gradient-to-r from-[#B48A34] via-[#F2D98F] to-[#B48A34]" />

            <div className="space-y-5 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C9A24B]/50 bg-[#FDF6E3] text-[#8A6A1F]">
                  <WalletIcon />
                </span>
                <div>
                  <h2 className="text-[17px] font-bold text-[#0A1F2E]">পেমেন্ট অ্যাকাউন্ট যোগ করুন</h2>
                  <p className="text-[13px] text-[#5B6770]">লোনের টাকা পাওয়ার জন্য এটি আবশ্যক</p>
                </div>
              </div>

              {/* মেথড টাইল (ডাটাবেস থেকে) */}
              <div>
                <Label>পেমেন্ট মেথড</Label>
                {methods.length === 0 ? (
                  <p className="text-[13px] text-[#B02F2F]">কোনো পেমেন্ট মেথড পাওয়া যায়নি</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2.5">
                    {methods.map((m) => {
                      const active = payment.payment_method_id === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selectMethod(m.id)}
                          className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-3 text-xs font-bold transition active:scale-95 ${
                            active
                              ? "border-[#C9A24B] bg-[#FDF6E3] text-[#8A6A1F] shadow-[0_0_0_3px_rgba(201,162,75,0.2)]"
                              : "border-[#E3DDCC] bg-white text-[#5B6770] hover:border-[#C9A24B]/60"
                          }`}
                        >
                          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EFE9D8] bg-white p-1.5 shadow-sm">
                            <img src={m.logo} alt={m.name} className="h-full w-full object-contain" />
                          </span>
                          <span className="max-w-full truncate">{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* মোবাইল */}
              {isMobile && (
                <div>
                  <Label>{method.name} নম্বর</Label>
                  <input
                    name="mobile_wallet_number"
                    value={payment.mobile_wallet_number}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    inputMode="numeric"
                    maxLength={11}
                    className={inputCls}
                  />
                </div>
              )}

              {/* ব্যাংক */}
              {isBank && (
                <div className="space-y-4">
                  <div>
                    <Label>অ্যাকাউন্টের নাম</Label>
                    <input
                      name="bank_account_name"
                      value={payment.bank_account_name}
                      onChange={handleChange}
                      placeholder="অ্যাকাউন্ট হোল্ডারের নাম"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label>অ্যাকাউন্ট নম্বর</Label>
                    <input
                      name="bank_account_number"
                      value={payment.bank_account_number}
                      onChange={handleChange}
                      placeholder="অ্যাকাউন্ট নম্বর"
                      inputMode="numeric"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label>ব্যাংকের নাম</Label>
                    <input
                      name="bank_name"
                      value={payment.bank_name}
                      onChange={handleChange}
                      placeholder="যেমন: ডাচ-বাংলা ব্যাংক"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label>শাখা</Label>
                    <input
                      name="bank_branch_name"
                      value={payment.bank_branch_name}
                      onChange={handleChange}
                      placeholder="শাখার নাম"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-2xl border border-[#EBDCA8] bg-[#FDF6E3] px-3.5 py-3 text-[13px] leading-relaxed text-[#5C4512]">
                <ShieldIcon />
                <span>সংরক্ষণের পর এই তথ্য আর পরিবর্তন করা যাবে না। ভালোভাবে যাচাই করে জমা দিন।</span>
              </div>

              <button
                type="submit"
                disabled={loading || !method}
                className={`w-full rounded-xl py-3.5 text-[17px] font-bold transition ${GOLD_BTN}`}
              >
                {loading ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentInfo;
