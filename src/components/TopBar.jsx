import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../services/api";

/* ================= STYLES ================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');

.tb-root {
  font-family: 'Hind Siliguri', 'Noto Sans Bengali', 'Kalpurush', system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
}
.tb-root h1, .tb-root p, .tb-root span { letter-spacing: 0 !important; }
`;

/* ===== THEME: dark navy blue + gold =====
   page bg #06121F   deep #040D16
   cream   #F5EBCB   gold #C9A24B   light gold #F2D98F
*/

const CARD_BG = {
  background:
    "radial-gradient(700px 300px at 8% -50%, #1E5A74 0%, transparent 60%), linear-gradient(150deg, #0F3045 0%, #071826 75%)",
};

/* ================= ICON ================= */

const EmblemIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M3 10l9-6 9 6" />
    <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
    <path d="M3 21h18" />
  </svg>
);

const TopBar = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  // ================= API CALL =================
  const fetchUser = async () => {
    try {
      const token =
        localStorage.getItem("access") ||
        localStorage.getItem("token");

      const res = await api.get("/user/kyc/me", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      setUser(res.data);
    } catch (err) {
      console.log("User fetch error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ================= HELPERS =================
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "শুভ সকাল";
    if (h < 17) return "শুভ দুপুর";
    if (h < 20) return "শুভ বিকেল";
    return "শুভ রাত";
  };

  const getInitial = (name) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "U";

  // works for both /uploads/kyc/... and full URL
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `https://loan.microfinancedevelopmentprojectbangladesh.com${path}`;
  };

  return (
    <header
      className="tb-root sticky top-0 z-40 bg-[#06121F]/90 px-3 pb-2 backdrop-blur-md sm:px-4"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
    >
      <style>{styles}</style>

      <div
        className="relative mx-auto flex max-w-3xl items-center justify-between gap-3 overflow-hidden
                   rounded-2xl border border-[#C9A24B]/50 px-3 py-3 text-white
                   shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] sm:gap-4 sm:rounded-3xl sm:px-5 sm:py-4"
        style={CARD_BG}
      >
        {/* সাজসজ্জা */}
        <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full border border-[#C9A24B]/20 sm:h-36 sm:w-36" />

        {/* LEFT */}
        <div className="relative flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                       border border-[#C9A24B]/60 bg-[#C9A24B]/15 text-[#F2D98F]
                       sm:h-12 sm:w-12 sm:rounded-2xl"
          >
            <EmblemIcon />
          </span>

          <div className="min-w-0">
            <h1 className="truncate text-[16px] font-bold leading-snug text-white sm:text-[19px]">
              ক্ষুদ্র-ঋণ উন্নয়ন প্রকল্প
            </h1>

            <p className="truncate text-[14px] leading-snug text-white/75 sm:text-[15px]">
              {getGreeting()},{" "}
              <span className="font-semibold text-[#F2D98F]">
                {user?.full_name || "নতুন ইউজার"}
              </span>
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="relative flex shrink-0 items-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            aria-label="নোটিফিকেশন ও প্রোফাইল"
            className="relative flex h-11 w-11 items-center justify-center rounded-full
                       border border-[#C9A24B]/40 bg-white/10 text-[#F2D98F] transition
                       hover:bg-[#C9A24B]/20 active:scale-95
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#C9A24B]"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#E5484D] ring-2 ring-[#0F3040]" />
          </button>

          {/* AVATAR */}
          <button
            type="button"
            onClick={() => navigate("/profile")}
            aria-label="প্রোফাইল দেখুন"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B] active:scale-95"
          >
            {loading ? (
              <div className="h-11 w-11 animate-pulse rounded-full bg-white/15 sm:h-12 sm:w-12" />
            ) : user?.selfie ? (
              <img
                src={getImageUrl(user.selfie)}
                alt="প্রোফাইল ছবি"
                className="h-11 w-11 rounded-full object-cover ring-2 ring-[#C9A24B] sm:h-12 sm:w-12"
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full
                           border border-[#C9A24B]/70 bg-[#C9A24B]/15
                           text-lg font-bold text-[#F2D98F] sm:h-12 sm:w-12"
              >
                {getInitial(user?.full_name)}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
