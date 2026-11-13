
import React, { useState } from "react";
import {
  useT,
  store,
  api,
  Ic,
  ICON,
  LangPicker,
  CSheet
} from "./Home";

/* =====================================================================
   Register_Login.jsx
   Login | Register | Forgot Password → Customer Support
   ===================================================================== */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- ICONS ---------- */

const MailI = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
  >
    <path d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm1.6 2L12 12.4 19.4 7z" />
  </svg>
);

const EyeI = ({ off }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d={ICON.eye} />
    {off && (
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    )}
  </svg>
);

const Logo = () => (
  <div className="cx-plogo">
    <svg viewBox="0 0 100 100">
      <g fill="none" stroke="#fff" strokeWidth="7">
        <path d="M76 16H50a34 34 0 000 68h26V66" />
        <path d="M76 33H50a17 17 0 000 34h26V54" />
        <path d="M76 49H54a3 3 0 000 6h22" />
      </g>
    </svg>
  </div>
);

/* ---------- INPUT FIELD ---------- */

function Field({
  label,
  icon,
  type = "text",
  value,
  onChange,
  onKeyDown,
  auto,
  placeholder,
  err
}) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";

  return (
    <div className="cx-fd">
      <label>{label}</label>

      <div className={"cx-fw" + (err ? " err" : "")}>
        <span className="cx-fi">{icon}</span>

        <input
          type={isPw && show ? "text" : type}
          autoComplete={auto}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />

        {isPw && (
          <button
            type="button"
            className="cx-fe"
            onClick={() => setShow(!show)}
            aria-label="Toggle password visibility"
          >
            <EyeI off={show} />
          </button>
        )}
      </div>

      {err && <small className="cx-fer">{err}</small>}
    </div>
  );
}

/* ---------- PAGE SHELL ---------- */

function Shell({
  title,
  sub,
  onBack,
  lang,
  setLang,
  children,
  onSupportReady
}) {
  const t = useT();
  const [cs, setCs] = useState(false);

  const openSupport = () => {
    setCs(true);
  };

  React.useEffect(() => {
    onSupportReady?.(openSupport);
  }, [onSupportReady]);

  return (
    <div className="cx-pg cx-au">

      <div className="cx-pt">
        <button onClick={onBack} aria-label="Back">
          ‹
        </button>

        <div className="cx-pt2">
          {setLang && (
            <LangPicker lang={lang} setLang={setLang} />
          )}

          <button
            onClick={openSupport}
            aria-label="Customer Support"
          >
            <Ic d={ICON.headset} s={26} />
          </button>
        </div>
      </div>

      <div className="cx-hero">
        <Logo />
        <h1 className="cx-cap">{title}</h1>
        <p>{sub}</p>
      </div>

      <div className="cx-pcard">
        {children}
      </div>

      <button
        className="cx-pcs"
        onClick={openSupport}
      >
        <Ic d={ICON.headset} s={20} />
        {t("csHelp")}
      </button>

      <CSheet
        open={cs}
        onClose={() => setCs(false)}
      />

    </div>
  );
}

/* ================= LOGIN PAGE ================= */

export function Login({
  onLogin,
  lang,
  setLang,
  go,
  flash = ""
}) {
  const t = useT();

  const rem0 = store.get("cx_rem", "");

  const [email, setEmail] = useState(rem0);
  const [pw, setPw] = useState("");
  const [rem, setRem] = useState(!!rem0);
  const [busy, setBusy] = useState(false);

  const [msg, setMsg] = useState({
    k: flash,
    ok: true
  });

  const [errs, setErrs] = useState({});
  const [openSupport, setOpenSupport] = useState(null);

  const mail = email.trim().toLowerCase();

  /* ---------- LOGIN ---------- */

  const login = async () => {
    if (busy) return;

    const e = {};

    if (!EMAIL_RE.test(mail)) {
      e.email = t("bEmail");
    }

    if (!pw) {
      e.pw = t("pw");
    }

    setErrs(e);

    if (Object.keys(e).length) {
      setMsg({ k: "", ok: false });
      return;
    }

    setBusy(true);
    setMsg({ k: "wait2", ok: true });

    try {
      const r = await api("/auth/login", {
        method: "POST",
        body: {
          email: mail,
          password: pw
        }
      });

      store.set("cx_rem", rem ? mail : "");

      await onLogin(r);

    } catch (er) {
      setMsg({
        k: er.message,
        ok: false
      });
    } finally {
      setBusy(false);
    }
  };

  const enter = (e) => {
    if (e.key === "Enter") login();
  };

  /* ---------- FORGOT PASSWORD ---------- */

  const handleForgotPassword = () => {
    if (openSupport) {
      openSupport();
    }
  };

  return (
    <Shell
      title={t("login")}
      sub={t("welcomeSub")}
      onBack={() => go("app")}
      lang={lang}
      setLang={setLang}
      onSupportReady={setOpenSupport}
    >

      <Field
        label={t("email")}
        icon={<MailI />}
        type="email"
        auto="username"
        placeholder={t("acc")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        err={errs.email}
      />

      <Field
        label={t("pwLbl")}
        icon={<Ic d={ICON.lock} s={20} />}
        type="password"
        auto="current-password"
        placeholder={t("pw")}
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={enter}
        err={errs.pw}
      />

      <div className="cx-prow">

        <label className="cx-rm">
          <input
            type="checkbox"
            checked={rem}
            onChange={(e) => setRem(e.target.checked)}
          />
          {t("rem")}
        </label>

        <button
          type="button"
          className="cx-plink"
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </button>

      </div>

      {msg.k && (
        <p className={"cx-msg" + (msg.ok ? "" : " bad")}>
          {t(msg.k)}
        </p>
      )}

      <button
        className="cx-pbtn cx-cap"
        style={{
          opacity: busy ? 0.6 : 1
        }}
        onClick={login}
        disabled={busy}
      >
        {busy ? "Please Wait..." : t("login")}
      </button>

      <div className="cx-pdiv">
        <span />
      </div>

      <p className="cx-pfoot">
        {t("noAcc")}{" "}
        <button
          className="cx-plink cx-cap"
          onClick={() => go("register")}
        >
          {t("register")}
        </button>
      </p>

      <button
        className="cx-pghost"
        onClick={() => go("app")}
      >
        {t("guest")}
      </button>

    </Shell>
  );
}

/* ================= PASSWORD STRENGTH ================= */

const strength = (p) => {
  if (!p) return 0;

  const s =
    (p.length >= 6) +
    (p.length >= 10) +
    (/[A-Za-z]/.test(p) && /\d/.test(p)) +
    /[^A-Za-z0-9]/.test(p);

  return s <= 1 ? 1 : s <= 3 ? 2 : 3;
};

/* ================= REGISTER PAGE ================= */

export function Register({
  onLogin,
  go,
  lang,
  setLang
}) {
  const t = useT();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const [msg, setMsg] = useState({
    k: "",
    ok: false
  });

  const [errs, setErrs] = useState({});

  const mail = email.trim().toLowerCase();
  const st = strength(pw);

  /* ---------- REGISTER ---------- */

  const run = async () => {
    if (busy) return;

    const e = {};

    if (!EMAIL_RE.test(mail)) {
      e.email = t("bEmail");
    }

    if (pw.length < 6) {
      e.pw = t("bPw");
    }

    if (pw2 !== pw) {
      e.pw2 = t("bMatch");
    }

    setErrs(e);

    if (Object.keys(e).length) {
      setMsg({
        k: "",
        ok: false
      });
      return;
    }

    setBusy(true);
    setMsg({
      k: "wait2",
      ok: true
    });

    try {
      const r = await api("/auth/register", {
        method: "POST",
        body: {
          email: mail,
          password: pw,
          password2: pw2
        }
      });

      await onLogin(r);

    } catch (er) {
      setMsg({
        k: er.message,
        ok: false
      });
    } finally {
      setBusy(false);
    }
  };

  const enter = (e) => {
    if (e.key === "Enter") run();
  };

  return (
    <Shell
      title={t("createAcc")}
      sub={t("createSub")}
      onBack={() => go("login")}
      lang={lang}
      setLang={setLang}
    >

      <Field
        label={t("email")}
        icon={<MailI />}
        type="email"
        auto="username"
        placeholder={t("acc")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        err={errs.email}
      />

      <Field
        label={t("pwLbl")}
        icon={<Ic d={ICON.lock} s={20} />}
        type="password"
        auto="new-password"
        placeholder={t("pw")}
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        err={errs.pw}
      />

      {pw && (
        <div className="cx-str">
          <div>
            {[1, 2, 3].map((n) => (
              <i
                key={n}
                className={n <= st ? "on s" + st : ""}
              />
            ))}
          </div>

          <span className={"s" + st}>
            {t(["", "strWeak", "strMid", "strStrong"][st])}
          </span>
        </div>
      )}

      <Field
        label={t("pw2Lbl")}
        icon={<Ic d={ICON.lock} s={20} />}
        type="password"
        auto="new-password"
        placeholder={t("pw2")}
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
        onKeyDown={enter}
        err={errs.pw2}
      />

      {msg.k && (
        <p className={"cx-msg" + (msg.ok ? "" : " bad")}>
          {t(msg.k)}
        </p>
      )}

      <button
        className="cx-pbtn cx-cap"
        style={{
          opacity: busy ? 0.6 : 1
        }}
        onClick={run}
        disabled={busy}
      >
        {busy ? "Please Wait..." : t("register")}
      </button>

      <div className="cx-pdiv">
        <span />
      </div>

      <p className="cx-pfoot">
        {t("haveAcc")}{" "}
        <button
          className="cx-plink cx-cap"
          onClick={() => go("login")}
        >
          {t("login")}
        </button>
      </p>

    </Shell>
  );
}

export default Login;
