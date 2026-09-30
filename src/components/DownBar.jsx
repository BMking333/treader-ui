// src/components/DownBar.jsx
import { useNavigate, useLocation } from "react-router-dom";

/* ================= ICONS ================= */

const Svg = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-[24px] w-[24px]"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const HomeIcon = () => (
  <Svg>
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </Svg>
);

const LoanIcon = () => (
  <Svg>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 9.5v.01M18 14.5v.01" />
  </Svg>
);

const CardIcon = () => (
  <Svg>
    <rect x="2" y="5" width="20" height="14" rx="2.5" />
    <path d="M2 10h20M6 15h4" />
  </Svg>
);

const SupportIcon = () => (
  <Svg>
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
    <rect x="2.5" y="14" width="4" height="6" rx="1.5" />
    <rect x="17.5" y="14" width="4" height="6" rx="1.5" />
    <path d="M19.5 20c0 1.2-1.6 2-4 2h-1.5" />
  </Svg>
);

const ProfileIcon = () => (
  <Svg>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </Svg>
);

/* ================= NAV ITEMS ================= */

const NAVS = [
  { label: "হোম", path: "/dashboard", icon: <HomeIcon /> },
  { label: "ঋণ", path: "/loan", icon: <LoanIcon /> },
  { label: "কার্ড", path: "/bank-info", icon: <CardIcon /> },
  { label: "সাহায্য", path: "/support", icon: <SupportIcon /> },
  { label: "প্রোফাইল", path: "/profile", icon: <ProfileIcon /> },
];

/* ================= COMPONENT ================= */

const DownBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      aria-label="প্রধান নেভিগেশন"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#C9A24B]/30 bg-white shadow-[0_-8px_30px_-12px_rgba(10,31,46,0.25)]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        fontFamily:
          "'Hind Siliguri', 'Noto Sans Bengali', 'Kalpurush', system-ui, sans-serif",
      }}
    >
      <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2">
        {NAVS.map((n) => {
          const active = location.pathname.startsWith(n.path);

          return (
            <button
              key={n.path}
              type="button"
              onClick={() => navigate(n.path)}
              aria-label={n.label}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 pb-2 pt-2.5 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B]/50"
            >
              {/* সক্রিয় ট্যাবের উপরের গোল্ড দাগ */}
              <span
                className={`absolute left-1/2 top-0 h-[3px] -translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#E8CB7E] via-[#C9A24B] to-[#B48A34] transition-all duration-300 ${
                  active ? "w-10 opacity-100" : "w-0 opacity-0"
                }`}
              />

              {/* আইকন */}
              <span
                className={`flex h-9 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                  active
                    ? "bg-[#C9A24B]/20 text-[#0A1F2E]"
                    : "text-[#6B7780] hover:text-[#0A1F2E]"
                }`}
              >
                {n.icon}
              </span>

              {/* লেখা */}
              <span
                className={`text-[14px] leading-tight transition-colors ${
                  active
                    ? "font-bold text-[#0A1F2E]"
                    : "font-medium text-[#6B7780]"
                }`}
              >
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default DownBar;
