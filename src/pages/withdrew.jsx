import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DownBar from "../components/DownBar";
import api from "../services/api";

import bkashIcon from "../assets/icons/BKash.png";
import nagadIcon from "../assets/icons/Nagad.png";

/* ================= STYLES ================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');

.wd-root {
  font-family: 'Hind Siliguri', 'Noto Sans Bengali', 'Kalpurush', system-ui, sans-serif;
  line-height: 1.75;
  letter-spacing: 0;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.wd-root h1, .wd-root h2, .wd-root h3, .wd-root p, .wd-root span, .wd-root button {
  letter-spacing: 0 !important;
}
`;

const NAVY_BG = {
  background: "radial-gradient(900px 420px at 15% -20%, #17495a 0%, #0A1F2E 65%)",
};

const GOLD_BTN =
  "bg-gradient-to-b from-[#E8CB7E] via-[#C9A24B] to-[#B48A34] text-[#1B1405] " +
  "shadow-[0_10px_24px_-8px_rgba(201,162,75,0.75),inset_0_1px_0_rgba(255,255,255,0.55)] " +
  "hover:brightness-105 active:translate-y-px " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A24B]/40";

const INK_BTN =
  "bg-[#0A1F2E] text-white hover:bg-[#123244] active:translate-y-px " +
  "shadow-[0_10px_24px_-10px_rgba(10,31,46,0.8)] " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A1F2E]/30";

/* ================= ICONS ================= */

const Svg = ({ children, className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const BackIcon = () => (
  <Svg className="w-5 h-5">
    <path d="M15 18l-6-6 6-6" />
  </Svg>
);

const CheckCircleIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12.5l2.7 2.7L16 9.8" />
  </Svg>
);

const ClockIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

const CrossCircleIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </Svg>
);

const AlertIcon = () => (
  <Svg>
    <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

const InfoIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-5M12 8h.01" />
  </Svg>
);

const CardIcon = () => (
  <Svg>
    <rect x="2" y="5" width="20" height="14" rx="2.5" />
    <path d="M2 10h20M6 15h4" />
  </Svg>
);

const BankIcon = () => (
  <Svg>
    <path d="M3 10l9-6 9 6" />
    <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
    <path d="M3 21h18" />
  </Svg>
);

const CopyIcon = () => (
  <Svg className="w-4 h-4">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Svg>
);

/* ================= HELPERS ================= */

const METHOD_BN = {
  bkash: "বিকাশ",
  nagad: "নগদ",
  rocket: "রকেট",
  bank: "ব্যাংক",
};

const bnMethodName = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("bkash") || n.includes("বিকাশ")) return METHOD_BN.bkash;
  if (n.includes("nagad") || n.includes("নগদ")) return METHOD_BN.nagad;
  if (n.includes("rocket") || n.includes("রকেট")) return METHOD_BN.rocket;
  if (n.includes("bank") || n.includes("ব্যাংক")) return METHOD_BN.bank;
  return name || "—";
};

const methodIcon = (m) => {
  const key = `${m.method_type || ""} ${m.method_name || ""}`.toLowerCase();
  if (key.includes("bkash")) return <img src={bkashIcon} alt="বিকাশ" className="h-8 w-8 object-contain" />;
  if (key.includes("nagad")) return <img src={nagadIcon} alt="নগদ" className="h-8 w-8 object-contain" />;
  return <CardIcon />;
};

const maskNumber = (num = "") => {
  if (!num) return "•••• •••• ••••";
  if (num.length <= 6) return "•".repeat(num.length);
  return `${num.slice(0, 3)}${"•".repeat(num.length - 6)}${num.slice(-3)}`;
};

const formatTk = (v) =>
  Number(v || 0).toLocaleString("bn-BD", { maximumFractionDigits: 0 });

const authHeaders = () => {
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  return { Authorization: token ? `Bearer ${token}` : "" };
};

/* ================= LOAN STATUS CONFIG ================= */

const STATUS = {
  Approved: {
    wrap: "bg-[#E8F6EE] border-[#8FD1AF]",
    circle: "bg-[#C5EBD5] text-[#116B47]",
    title: "text-[#0C5A3B]",
    text: "text-[#1D4A38]",
    icon: <CheckCircleIcon />,
    heading: "ঋণ অনুমোদিত হয়েছে",
    message: "অভিনন্দন! আপনার ঋণ অনুমোদিত হয়েছে, আপনি এখন ঋণ উত্তোলন করতে পারেন।",
  },
  Pending: {
    wrap: "bg-[#FFF6DC] border-[#E6CB7A]",
    circle: "bg-[#F8E2A0] text-[#8A5A00]",
    title: "text-[#6E4700]",
    text: "text-[#4F3A10]",
    icon: <ClockIcon />,
    heading: "অনুমোদনের অপেক্ষায়",
    message: "আপনার ঋণের আবেদন পর্যবেক্ষণ করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।",
  },
  Rejected: {
    wrap: "bg-[#EEF0F2] border-[#B9C0C6]",
    circle: "bg-[#D9DEE2] text-[#3F4A53]",
    title: "text-[#222D35]",
    text: "text-[#3F4A53]",
    icon: <CrossCircleIcon />,
    heading: "আবেদন প্রত্যাখ্যাত",
    message: "আপনার ঋণ আবেদন বাতিল করা হয়েছে।",
  },
  Processing: {
    wrap: "bg-[#FDECEC] border-[#EDA9A9]",
    circle: "bg-[#F8CFCF] text-[#B92A2A]",
    title: "text-[#961F1F]",
    text: "text-[#5E2626]",
    icon: <AlertIcon />,
    heading: "প্রক্রিয়াধীন",
    message: "আপনার অনুমোদিত ঋণ দেরির কারণে উত্তোলন এখন সম্ভব নয়!",
  },
  "Payment Pending": {
    wrap: "bg-[#E8F0FB] border-[#A5C3EA]",
    circle: "bg-[#CFE0F5] text-[#174382]",
    title: "text-[#123A73]",
    text: "text-[#22436F]",
    icon: <ClockIcon />,
    heading: "পেমেন্ট যাচাই চলছে",
    message: "আপনার পাঠানো পেমেন্ট স্ক্রিনশট যাচাই করা হচ্ছে।",
  },
};

/* ================= MAIN ================= */

const Withdrew = () => {
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loan, setLoan] = useState(null);
  const [methods, setMethods] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const headers = authHeaders();

      const [pRes, lRes, mRes] = await Promise.allSettled([
        api.get("/user/payment/me", { headers }),
        api.get("/loan/loan/my-loans", { headers }),
        api.get("/paymentmethod/active"),
      ]);

      if ([pRes, lRes].some((r) => r.status === "rejected" && r.reason?.response?.status === 401)) {
        localStorage.removeItem("access");
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      if (pRes.status === "fulfilled") setPayment(pRes.value.data || null);

      if (lRes.status === "fulfilled") {
        const loans = Array.isArray(lRes.value.data) ? [...lRes.value.data] : [];
        loans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setLoan(loans[0] || null);
      }

      if (mRes.status === "fulfilled") setMethods(mRes.value.data || []);

      setPageLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  const hasPayment = !!(
    payment &&
    (payment.payment_method_id ||
      payment.mobile_wallet_number ||
      payment.bank_account_number)
  );

  const accountNumber =
    payment?.mobile_wallet_number || payment?.bank_account_number || "";

  const isBank = !!payment?.bank_account_number;
  const isShotOn = loan?.shot_status === "On";
  const feeMethods = methods.filter((m) => m.account_number);
  const status = loan ? STATUS[loan.loan_status] : null;

  /* ================= LOADING ================= */
  if (pageLoading) {
    return (
      <div className="wd-root flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAF8F3]">
        <style>{styles}</style>
        <svg className="h-10 w-10 animate-spin text-[#C9A24B]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="text-[18px] font-bold text-[#0A1F2E]">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="wd-root min-h-screen bg-[#FAF8F3] pb-28 text-[#0A1F2E]">
      <style>{styles}</style>

      {/* ===== TOP BAR ===== */}
      <header className="sticky top-0 z-40 border-b border-[#C9A24B]/30 bg-[#0A1F2E] text-white shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95"
            aria-label="পেছনে যান"
          >
            <BackIcon />
          </button>
          <h1 className="text-[21px] font-bold">ঋণ উত্তোলন</h1>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-3xl space-y-5 px-4">
        {/* ================= ১) পেমেন্ট অ্যাকাউন্ট ================= */}
        {hasPayment ? (
          <section
            className="relative overflow-hidden rounded-3xl border border-[#C9A24B]/40 p-6 text-white shadow-[0_24px_60px_-24px_rgba(10,31,46,0.8)] sm:p-8"
            style={NAVY_BG}
          >
            <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/5" />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-medium text-white/85">
                    পেমেন্ট পদ্ধতি
                  </p>
                  <p className="mt-1 text-[24px] font-bold text-[#F2D98F]">
                    {bnMethodName(payment.payment_method)}
                  </p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[#F2D98F]">
                  {isBank ? <BankIcon /> : <CardIcon />}
                </span>
              </div>

              <p className="mt-7 text-[16px] font-medium text-white/85">অ্যাকাউন্ট নম্বর</p>
              <p className="mt-1 break-all font-mono text-[26px] font-bold tracking-[0.12em]">
                {maskNumber(accountNumber)}
              </p>
            </div>
          </section>
        ) : (
          <NoticeBox
            title="পেমেন্ট অ্যাকাউন্ট যোগ করা নেই"
            text="ঋণ উত্তোলনের জন্য প্রথমে আপনার ব্যাংক বা মোবাইল ওয়ালেট অ্যাকাউন্ট যোগ করুন।"
            buttonText="অ্যাকাউন্ট যোগ করুন"
            onClick={() => navigate("/payment-info")}
          />
        )}

        {/* ================= ২) ঋণের আবেদন নেই ================= */}
        {!loan && (
          <NoticeBox
            title="ঋণের আবেদন করা হয়নি"
            text="আপনি এখনো ঋণের জন্য আবেদন করেননি। উত্তোলনের আগে ঋণের আবেদন করুন।"
            buttonText="ঋণের আবেদন করুন"
            onClick={() => navigate("/loan")}
          />
        )}

        {/* ================= SHOT ON: ফি ও তথ্য ================= */}
        {isShotOn && (
          <section className="rounded-3xl border border-[#E0D7BC] bg-white p-5 shadow-[0_10px_40px_-20px_rgba(10,31,46,0.25)] sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A1F2E] text-[#F2D98F]">
                <InfoIcon />
              </span>
              <h2 className="text-[20px] font-bold text-[#0A1F2E]">উত্তোলনের তথ্য</h2>
            </div>

            <div className="whitespace-pre-line rounded-2xl border border-[#E6DFC9] bg-[#FAF8F3] p-4 text-[17px] font-medium leading-[1.85] text-[#1F2A33]">
              {loan?.shot_info || "কোনো তথ্য নেই"}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#0A1F2E] px-5 py-4 text-white">
              <span className="text-[17px] font-medium text-white/90">প্রদেয় ফি</span>
              <span className="text-[28px] font-bold text-[#F2D98F]">
                ৳{formatTk(loan?.shot_amount)}
              </span>
            </div>
          </section>
        )}

        {/* ================= কর্পোরেট নম্বর ================= */}
        {isShotOn && feeMethods.length > 0 && (
          <section
            className="rounded-3xl border border-[#C9A24B]/40 p-6 text-white shadow-[0_24px_60px_-24px_rgba(10,31,46,0.8)]"
            style={NAVY_BG}
          >
            <p className="text-center text-[17px] font-medium leading-[1.8] text-white">
              ফি প্রদানের জন্য নিচের কর্পোরেট নম্বরে সেন্ড-মানি করুন।
            </p>

            <div className="mt-5 space-y-3">
              {feeMethods.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/15 p-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#0A1F2E]">
                      {methodIcon(m)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-white/85">{bnMethodName(m.method_name)}</p>
                      <p className="truncate font-mono text-[19px] font-bold tracking-wider">
                        {m.account_number}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copy(m.id, m.account_number)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-[15px] font-bold transition hover:bg-white/30 active:scale-95"
                  >
                    <CopyIcon />
                    {copiedId === m.id ? "কপি হয়েছে" : "কপি"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= লোনের অবস্থা ================= */}
        {!isShotOn && status && (
          <section className={`rounded-2xl border-2 p-5 ${status.wrap}`}>
            <div className="flex items-start gap-4">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${status.circle}`}>
                {status.icon}
              </span>
              <div className="min-w-0">
                <h2 className={`text-[21px] font-bold ${status.title}`}>{status.heading}</h2>
                <p className={`mt-1 text-[17px] font-medium leading-[1.8] ${status.text}`}>{status.message}</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <DownBar />
    </div>
  );
};

/* ================= NOTICE BOX ================= */
const NoticeBox = ({ title, text, buttonText, onClick }) => (
  <section className="rounded-2xl border-2 border-[#E6CB7A] bg-[#FFF6DC] p-5">
    <div className="flex items-start gap-3.5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F8E2A0] text-[#8A5A00]">
        <InfoIcon />
      </span>
      <div>
        <h3 className="text-[19px] font-bold text-[#4A3608]">{title}</h3>
        <p className="mt-1 text-[16px] font-medium leading-[1.8] text-[#4F3A10]">{text}</p>
      </div>
    </div>

    <button
      onClick={onClick}
      className={`mt-4 w-full rounded-xl px-6 py-3.5 text-[17px] font-bold transition ${INK_BTN}`}
    >
      {buttonText}
    </button>
  </section>
);

export default Withdrew;
