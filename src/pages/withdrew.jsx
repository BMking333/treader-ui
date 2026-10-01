import React, { useEffect, useRef, useState } from "react";
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

/* কার্ডের রং: পেমেন্ট মেথড অনুযায়ী */
const CARD_BG = {
  bkash: "radial-gradient(900px 420px at 15% -20%, #E2136E 0%, #6B0F36 70%)",
  nagad: "radial-gradient(900px 420px at 15% -20%, #F26B21 0%, #6E2605 70%)",
  rocket: "radial-gradient(900px 420px at 15% -20%, #8B2F97 0%, #2A0E5C 70%)",
  bank: NAVY_BG.background,
};

/*
 * PaymentInfo-এর মতোই:
 *  - বিকাশ/নগদ/রকেট → method_type = "mobile", method_name = "Bkash" / "Nagad" / "Rocket"
 *  - ব্যাংক         → method_type = "bank",   method_name = ব্যাংকের নাম
 */
const detectKey = (type, name) => {
  const ty = String(type || "").toLowerCase().trim();
  if (ty === "bank") return "bank";

  const n = String(name || "").toLowerCase();
  if (/bkash|bikash|বিকাশ/.test(n)) return "bkash";
  if (/nagad|নগদ/.test(n)) return "nagad";
  if (/rocket|রকেট/.test(n)) return "rocket";
  if (/bank|ব্যাংক/.test(n)) return "bank";

  if (/bkash|bikash/.test(ty)) return "bkash";
  if (/nagad/.test(ty)) return "nagad";
  if (/rocket/.test(ty)) return "rocket";

  return "default";
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

const CameraIcon = () => (
  <Svg>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </Svg>
);

const ImageIcon = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M21 16l-5-5-8 8" />
  </Svg>
);

/* ================= HELPERS ================= */

const METHOD_BN = {
  bkash: "বিকাশ",
  nagad: "নগদ",
  rocket: "রকেট",
  bank: "ব্যাংক",
};

// null/undefined হলেও ক্র্যাশ করবে না
const bnMethodName = (name) => {
  const n = String(name || "").toLowerCase();
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

const maskNumber = (num) => {
  const s = String(num || "");
  if (!s) return "•••• •••• ••••";
  if (s.length <= 6) return "•".repeat(s.length);
  return `${s.slice(0, 3)}${"•".repeat(s.length - 6)}${s.slice(-3)}`;
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
  const [methods, setMethods] = useState([]); // কর্পোরেট নম্বর (ফি দেওয়ার জন্য)
  const [payMethods, setPayMethods] = useState([]); // ইউজারের পেমেন্ট মেথড লিস্ট (নাম চেনার জন্য)
  const [pageLoading, setPageLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // screenshot upload
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const headers = authHeaders();

        const [pRes, lRes, mRes, umRes] = await Promise.allSettled([
          api.get("/user/payment/me", { headers }),
          api.get("/loan/loan/my-loans", { headers }),
          api.get("/paymentmethod/active"),
          api.get("/user/payment/methods"),
        ]);

        if ([pRes, lRes].some((r) => r.status === "rejected" && r.reason?.response?.status === 401)) {
          localStorage.removeItem("access");
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        if (pRes.status === "fulfilled") {
          const d = pRes.value.data;
          setPayment(d && typeof d === "object" ? d : null);
        }

        if (lRes.status === "fulfilled") {
          const loans = Array.isArray(lRes.value.data) ? [...lRes.value.data] : [];
          loans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setLoan(loans[0] || null);
        }

        if (mRes.status === "fulfilled") {
          setMethods(Array.isArray(mRes.value.data) ? mRes.value.data : []);
        }

        if (umRes.status === "fulfilled") {
          setPayMethods(Array.isArray(umRes.value.data) ? umRes.value.data : []);
        }
      } catch (e) {
        // কিছু ভুল হলেও পেজ যেন সাদা না হয়
      } finally {
        setPageLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // preview cleanup
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const copy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setUploadErr("অনুগ্রহ করে একটি ছবি বেছে নিন।");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setUploadErr("ছবির সাইজ ৮ MB-এর বেশি হতে পারবে না।");
      return;
    }

    setUploadErr("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    setPreview("");
    setUploadErr("");
  };

  const submitProof = async () => {
    if (!file || !loan || uploading) return;

    setUploading(true);
    setUploadErr("");

    try {
      const fd = new FormData();
      fd.append("loan_id", loan.id);
      fd.append("shot_amount", loan.shot_amount || 0);
      fd.append("shot_info", "");
      fd.append("screenshot", file);

      const res = await api.post("/loan/loan/submit-shot", fd, {
        headers: authHeaders(),
      });

      // এখন shot_status = Pending হবে, তাই পেজ "পেমেন্ট যাচাই চলছে" দেখাবে
      setLoan((prev) => ({
        ...prev,
        loan_status: res.data?.loan_status || "Payment Pending",
        shot_status: res.data?.shot_status || "Pending",
      }));
      clearFile();
    } catch (err) {
      const d = err?.response?.data?.detail;
      setUploadErr(typeof d === "string" ? d : "জমা দেওয়া যায়নি, আবার চেষ্টা করুন।");
    } finally {
      setUploading(false);
    }
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

  // PaymentInfo-এর মতো: payment_method_id দিয়ে মেথড লিস্ট থেকে নাম/টাইপ বের করা
  const matched = payMethods.find(
    (m) => m && String(m.id) === String(payment?.payment_method_id)
  );
  const savedName = payment?.payment_method || "";

  const methodKey = matched
    ? detectKey(matched.method_type, matched.method_name)
    : isBank
    ? "bank"
    : detectKey("", savedName);

  const methodKeyFinal = methodKey === "default" ? "bank" : methodKey;

  const methodLabel = (() => {
    if (methodKeyFinal === "bank") {
      return (
        matched?.method_name ||
        savedName ||
        payment?.bank_name ||
        METHOD_BN.bank
      );
    }
    return METHOD_BN[methodKeyFinal] || matched?.method_name || savedName || "পেমেন্ট";
  })();

  const cardBg = CARD_BG[methodKeyFinal] || CARD_BG.bank;
  const isShotOn = loan?.shot_status === "On";
  const feeMethods = methods.filter((m) => m && m.account_number);
  const status = loan ? STATUS[loan.loan_status] || null : null;

  /* ================= LOADING ================= */
  if (pageLoading) {
    return (
      <div
        lang="bn"
        translate="no"
        className="notranslate wd-root flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAF8F3]"
      >
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
    <div
      lang="bn"
      translate="no"
      className="notranslate wd-root min-h-screen bg-[#FAF8F3] pb-28 text-[#0A1F2E]"
    >
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
            style={{ background: cardBg }}
          >
            <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/5" />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-medium text-white/85">
                    পেমেন্ট পদ্ধতি
                  </p>
                  <p className="mt-1 text-[24px] font-bold text-[#F2D98F]">
                    {methodLabel}
                  </p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[#F2D98F]">
                  {isBank ? <BankIcon /> : <CardIcon />}
                </span>
              </div>

              <p className="mt-7 text-[16px] font-medium text-white/85">অ্যাকাউন্ট নম্বর</p>
              {/* মাস্ক করা নম্বর */}
              <p className="mt-1 break-all font-mono text-[19px] font-bold tracking-[0.08em]">
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

            {/* ফি: মাঝখানে (center) */}
            <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-[#0A1F2E] px-4 py-3 text-center text-white">
              <span className="text-[15px] font-medium text-white/90">প্রদেয় ফি</span>
              <span className="text-[20px] font-bold text-[#F2D98F]">
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

        {/* ================= ফি প্রদানের স্ক্রিনশট জমা ================= */}
        {isShotOn && (
          <section className="rounded-3xl border border-[#E0D7BC] bg-white p-5 shadow-[0_10px_40px_-20px_rgba(10,31,46,0.25)] sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A1F2E] text-[#F2D98F]">
                <CameraIcon />
              </span>
              <h2 className="text-[20px] font-bold text-[#0A1F2E]">
                ফি প্রদানের স্ক্রিনশট জমা দিন
              </h2>
            </div>

            {/* hidden inputs: ক্যামেরা ও গ্যালারি */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPickFile}
              className="hidden"
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className="hidden"
            />

            {preview ? (
              <div className="rounded-2xl border border-[#E6DFC9] bg-[#FAF8F3] p-3">
                <img
                  src={preview}
                  alt="স্ক্রিনশট প্রিভিউ"
                  className="mx-auto max-h-72 w-auto rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  disabled={uploading}
                  className="mt-3 w-full rounded-xl border border-[#C9CFD4] bg-white py-2.5 text-[16px] font-bold text-[#3F4A53] transition active:scale-95 disabled:opacity-50"
                >
                  ছবি পাল্টান
                </button>
              </div>
            ) : (
              /* ক্যামেরা + গ্যালারি: একটাই ঘরের ভেতরে */
              <div className="grid grid-cols-2 overflow-hidden rounded-2xl border-2 border-dashed border-[#C9A24B] bg-[#FFF9E8] text-[#6E4700]">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 px-3 py-6 transition hover:bg-[#FFF3CF] active:scale-95"
                >
                  <CameraIcon />
                  <span className="text-[16px] font-bold">ক্যামেরা</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 border-l-2 border-dashed border-[#C9A24B] px-3 py-6 transition hover:bg-[#FFF3CF] active:scale-95"
                >
                  <ImageIcon />
                  <span className="text-[16px] font-bold">গ্যালারি</span>
                </button>
              </div>
            )}

            {uploadErr && (
              <p className="mt-3 rounded-xl bg-[#FDECEC] px-4 py-2.5 text-[15px] font-medium text-[#961F1F]">
                {uploadErr}
              </p>
            )}

            <button
              type="button"
              onClick={submitProof}
              disabled={!file || uploading}
              className={`mt-4 w-full rounded-xl px-6 py-3.5 text-[17px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${GOLD_BTN}`}
            >
              {uploading ? "জমা হচ্ছে..." : "স্ক্রিনশট জমা দিন"}
            </button>
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
