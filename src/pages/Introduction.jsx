import React, { useContext } from "react";
import { LangCtx, BrandMark } from "./Home";

/* =====================================================================
   src/pages/Introduction.jsx — প্ল্যাটফর্ম পরিচিতি (route: /introduction)
   ✔ Night / Light: অ্যাপের রুট ক্লাস (.cx.dark) দেখে নিজে বদলায়
   ✔ ভাষা: নিচের TXT টেবিল; অনুবাদ না থাকা ভাষায় English দেখায়
   ===================================================================== */

const KEYS = ["title", "tag", "about", "why", "f1", "f2", "f3", "f4", "s1", "s2", "cta"];

/* f1–f4 ও s1–s2 ফরম্যাট: "শিরোনাম|বিবরণ" */
const RAW = {
  en: [
    "Introduction",
    "Trade crypto with confidence",
    "A modern trading platform for spot, options, swap and loans — built for speed, clarity and security, with live market data and an easy, mobile-first experience.",
    "Why choose us",
    "Spot trading|Buy and sell popular coins instantly at live market prices.",
    "Options trading|Pick a direction and time frame, and trade with a clear payout.",
    "Instant swap|Exchange one asset for another in a few taps.",
    "Flexible loans|Access funds against your assets with simple terms.",
    "Secure by design|Identity verification and protected accounts keep your assets safe.",
    "24/7 support|Our team is always available through customer service.",
    "Start trading",
  ],
  bn: [
    "পরিচিতি",
    "আত্মবিশ্বাসের সাথে ক্রিপ্টো ট্রেড করুন",
    "স্পট, অপশন, সোয়াপ ও লোনের আধুনিক ট্রেডিং প্ল্যাটফর্ম — গতি, স্বচ্ছতা ও নিরাপত্তা নিয়ে তৈরি, লাইভ মার্কেট ডেটা ও সহজ মোবাইল-ফার্স্ট অভিজ্ঞতাসহ।",
    "কেন আমাদের বেছে নেবেন",
    "স্পট ট্রেডিং|লাইভ মার্কেট দামে জনপ্রিয় কয়েন সাথে সাথে কেনা-বেচা করুন।",
    "অপশন ট্রেডিং|দিক ও সময় বেছে নিন, স্পষ্ট পে-আউটে ট্রেড করুন।",
    "ইনস্ট্যান্ট সোয়াপ|কয়েকটি ট্যাপে এক অ্যাসেট থেকে অন্যটিতে বদলান।",
    "সহজ লোন|সহজ শর্তে আপনার অ্যাসেটের বিপরীতে ফান্ড নিন।",
    "নিরাপত্তায় সেরা|পরিচয় যাচাই ও সুরক্ষিত অ্যাকাউন্টে আপনার সম্পদ নিরাপদ থাকে।",
    "২৪/৭ সাপোর্ট|কাস্টমার সার্ভিসের মাধ্যমে আমাদের টিম সবসময় পাশে আছে।",
    "ট্রেড শুরু করুন",
  ],
  hi: [
    "परिचय",
    "भरोसे के साथ क्रिप्टो ट्रेड करें",
    "स्पॉट, ऑप्शन, स्वैप और लोन के लिए आधुनिक ट्रेडिंग प्लेटफ़ॉर्म — गति, स्पष्टता और सुरक्षा के साथ, लाइव मार्केट डेटा और आसान मोबाइल-फ़र्स्ट अनुभव।",
    "हमें क्यों चुनें",
    "स्पॉट ट्रेडिंग|लाइव मार्केट कीमतों पर लोकप्रिय कॉइन तुरंत खरीदें और बेचें।",
    "ऑप्शन ट्रेडिंग|दिशा और समय चुनें, स्पष्ट पेआउट के साथ ट्रेड करें।",
    "इंस्टेंट स्वैप|कुछ टैप में एक एसेट को दूसरे में बदलें।",
    "लचीले लोन|सरल शर्तों पर अपने एसेट के बदले फंड पाएँ।",
    "सुरक्षा पहले|पहचान सत्यापन और सुरक्षित अकाउंट आपकी संपत्ति को सुरक्षित रखते हैं।",
    "24/7 सहायता|कस्टमर सर्विस के ज़रिए हमारी टीम हमेशा उपलब्ध है।",
    "ट्रेडिंग शुरू करें",
  ],
  ur: [
    "تعارف",
    "اعتماد کے ساتھ کرپٹو ٹریڈ کریں",
    "اسپاٹ، آپشنز، سواپ اور لون کے لیے جدید ٹریڈنگ پلیٹ فارم — رفتار، وضاحت اور سیکیورٹی کے ساتھ، لائیو مارکیٹ ڈیٹا اور آسان موبائل تجربہ۔",
    "ہمیں کیوں چنیں",
    "اسپاٹ ٹریڈنگ|لائیو مارکیٹ قیمتوں پر مقبول کوائنز فوری خریدیں اور بیچیں۔",
    "آپشنز ٹریڈنگ|سمت اور وقت چنیں، واضح پے آؤٹ کے ساتھ ٹریڈ کریں۔",
    "فوری سواپ|چند ٹیپس میں ایک اثاثے کو دوسرے سے بدلیں۔",
    "لچکدار لون|آسان شرائط پر اپنے اثاثوں کے بدلے فنڈز حاصل کریں۔",
    "سیکیورٹی پہلے|شناخت کی تصدیق اور محفوظ اکاؤنٹس آپ کے اثاثے محفوظ رکھتے ہیں۔",
    "24/7 سپورٹ|کسٹمر سروس کے ذریعے ہماری ٹیم ہر وقت دستیاب ہے۔",
    "ٹریڈنگ شروع کریں",
  ],
  ar: [
    "نبذة تعريفية",
    "تداول العملات الرقمية بثقة",
    "منصة تداول حديثة للفوري والخيارات والمبادلة والقروض — مصممة للسرعة والوضوح والأمان مع بيانات سوق مباشرة وتجربة سهلة على الجوال.",
    "لماذا نحن",
    "التداول الفوري|اشترِ وبِع العملات الشائعة فورًا بأسعار السوق المباشرة.",
    "تداول الخيارات|اختر الاتجاه والمدة وتداول بعائد واضح.",
    "مبادلة فورية|بدّل أصلًا بآخر بنقرات قليلة.",
    "قروض مرنة|احصل على تمويل مقابل أصولك بشروط بسيطة.",
    "أمان بالتصميم|التحقق من الهوية والحسابات المحمية يحافظان على أصولك.",
    "دعم على مدار الساعة|فريقنا متاح دائمًا عبر خدمة العملاء.",
    "ابدأ التداول",
  ],
  zh: [
    "平台介绍",
    "自信交易加密货币",
    "支持现货、期权、闪兑与借贷的现代交易平台——速度快、清晰透明、安全可靠，提供实时行情和便捷的移动端体验。",
    "为什么选择我们",
    "现货交易|按实时市场价格即时买卖主流币种。",
    "期权交易|选择方向与时间，以明确的收益进行交易。",
    "即时闪兑|几步操作即可将一种资产兑换为另一种。",
    "灵活借贷|以简单条款用资产获取资金。",
    "安全设计|实名认证与账户保护，守护您的资产。",
    "全天候支持|客服团队随时为您服务。",
    "开始交易",
  ],
  es: [
    "Introducción",
    "Opera cripto con confianza",
    "Una plataforma moderna para operar al contado, opciones, swap y préstamos, creada para la rapidez, la claridad y la seguridad, con datos de mercado en vivo y experiencia móvil sencilla.",
    "Por qué elegirnos",
    "Trading al contado|Compra y vende monedas populares al instante a precios de mercado en vivo.",
    "Trading de opciones|Elige dirección y plazo y opera con un pago claro.",
    "Swap instantáneo|Cambia un activo por otro en pocos toques.",
    "Préstamos flexibles|Obtén fondos con tus activos y condiciones simples.",
    "Seguro por diseño|La verificación de identidad y las cuentas protegidas cuidan tus activos.",
    "Soporte 24/7|Nuestro equipo está siempre disponible en atención al cliente.",
    "Empezar a operar",
  ],
  fr: [
    "Présentation",
    "Tradez la crypto en toute confiance",
    "Une plateforme moderne pour le spot, les options, le swap et les prêts — conçue pour la rapidité, la clarté et la sécurité, avec des données de marché en direct et une expérience mobile simple.",
    "Pourquoi nous choisir",
    "Trading spot|Achetez et vendez instantanément les principales cryptos aux prix du marché.",
    "Trading d'options|Choisissez une direction et une durée, avec un gain clair.",
    "Swap instantané|Échangez un actif contre un autre en quelques clics.",
    "Prêts flexibles|Obtenez des fonds contre vos actifs à des conditions simples.",
    "Sécurité avant tout|Vérification d'identité et comptes protégés pour garder vos actifs en sécurité.",
    "Support 24h/24|Notre équipe est toujours disponible via le service client.",
    "Commencer à trader",
  ],
  de: [
    "Einführung",
    "Krypto sicher handeln",
    "Eine moderne Handelsplattform für Spot, Optionen, Swap und Kredite — für Tempo, Klarheit und Sicherheit, mit Live-Marktdaten und einfacher mobiler Nutzung.",
    "Warum wir",
    "Spot-Handel|Beliebte Coins sofort zu Live-Marktpreisen kaufen und verkaufen.",
    "Optionshandel|Richtung und Zeitraum wählen und mit klarer Auszahlung handeln.",
    "Sofort-Swap|Ein Asset in wenigen Tipps gegen ein anderes tauschen.",
    "Flexible Kredite|Mit Ihren Assets einfach an Geld kommen.",
    "Sicher konzipiert|Identitätsprüfung und geschützte Konten sichern Ihr Vermögen.",
    "24/7-Support|Unser Team ist über den Kundenservice jederzeit erreichbar.",
    "Jetzt handeln",
  ],
  ru: [
    "О платформе",
    "Торгуйте криптовалютой уверенно",
    "Современная платформа для спот-торговли, опционов, обмена и займов — скорость, понятность и безопасность, данные рынка в реальном времени и удобный мобильный интерфейс.",
    "Почему мы",
    "Спот-торговля|Мгновенно покупайте и продавайте популярные монеты по рыночным ценам.",
    "Опционы|Выберите направление и время, торгуйте с понятной выплатой.",
    "Мгновенный обмен|Обменивайте один актив на другой в несколько касаний.",
    "Гибкие займы|Получайте средства под свои активы на простых условиях.",
    "Безопасность по умолчанию|Проверка личности и защита аккаунтов берегут ваши активы.",
    "Поддержка 24/7|Наша команда всегда на связи через службу поддержки.",
    "Начать торговлю",
  ],
};

const ICONS = {
  spot: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
  opt: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  swap: <><path d="M7 7h12l-3-3M17 17H5l3 3" /></>,
  loan: <><rect x="3" y="6" width="18" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.5" /></>,
  shield: <><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5L15.5 10" /></>,
  help: <><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /></>,
};

const Ico = ({ n, s = 22 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[n]}
  </svg>
);

const BackI = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

/* ভাষা অনুযায়ী টেক্সট: নিজের টেবিল → English */
const useTx = () => {
  const { lang } = useContext(LangCtx);
  const tbl = RAW[lang] || RAW.en;
  return (k) => {
    const i = KEYS.indexOf(k);
    return tbl[i] != null ? tbl[i] : RAW.en[i];
  };
};

const CSS = `
.cx-in-pg{--fg:#1a2230;--fg2:rgba(26,34,48,.68);--bd:rgba(0,0,0,.10);--sf:#fff;--sf2:#f3f5fa;--pg:#f3f5fa;
  background:var(--pg);color:var(--fg);min-height:100vh;padding-bottom:36px;box-sizing:border-box}
.cx.dark .cx-in-pg{--fg:#e8edf5;--fg2:rgba(232,237,245,.70);--bd:rgba(255,255,255,.10);--sf:#17263d;--sf2:#101c30;--pg:#121e2f}

.cx-in-pg .cx-in-top{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;height:50px;
  background:var(--sf);border-bottom:1px solid var(--bd)}
.cx-in-pg .cx-in-top h1{margin:0;font-size:16px;font-weight:600;text-align:center;color:var(--fg)}
.cx-in-pg .cx-in-top button{height:50px;display:grid;place-items:center;background:none!important;border:0!important;
  color:var(--fg)!important;cursor:pointer;padding:0;text-align:center!important}
.cx[dir=rtl] .cx-in-top button{transform:scaleX(-1)}

/* Hero */
.cx-in-pg .cx-in-hero{margin:16px 16px 0;padding:28px 20px 26px;border-radius:22px;text-align:center;color:#fff;
  background:linear-gradient(135deg,#17c3c9 0%,#2a7de1 55%,#5b6cff 100%);
  box-shadow:0 14px 34px rgba(42,125,225,.32)}
.cx-in-pg .cx-in-logo{width:64px;height:64px;margin:0 auto 14px;border-radius:20px;display:grid;place-items:center;
  background:rgba(255,255,255,.95);box-shadow:0 8px 20px rgba(0,0,0,.18)}
.cx-in-pg .cx-in-hero h2{margin:0 0 8px;font-size:20px;font-weight:700;letter-spacing:.2px;color:#fff}
.cx-in-pg .cx-in-hero p{margin:0;font-size:13.5px;line-height:1.6;color:rgba(255,255,255,.9)}

/* Section title */
.cx-in-pg .cx-in-h{margin:24px 18px 12px;font-size:15px;font-weight:700;color:var(--fg)}

/* Feature grid */
.cx-in-pg .cx-in-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px}
.cx-in-pg .cx-in-card{padding:16px 14px;border-radius:16px;background:var(--sf);border:1px solid var(--bd)}
.cx-in-pg .cx-in-ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;margin-bottom:10px;
  color:#2a7de1;background:rgba(42,125,225,.12)}
.cx-in-pg .cx-in-card b{display:block;font-size:13.5px;font-weight:700;margin-bottom:4px;color:var(--fg)}
.cx-in-pg .cx-in-card span{display:block;font-size:12px;line-height:1.5;color:var(--fg2)}

/* Trust rows */
.cx-in-pg .cx-in-list{display:flex;flex-direction:column;gap:10px;padding:0 16px}
.cx-in-pg .cx-in-row{display:flex;align-items:flex-start;gap:12px;padding:14px;border-radius:16px;background:var(--sf);border:1px solid var(--bd)}
.cx-in-pg .cx-in-row .cx-in-ic{margin:0;flex:none;color:#10b981;background:rgba(16,185,129,.12)}
.cx-in-pg .cx-in-row b{display:block;font-size:13.5px;font-weight:700;margin-bottom:3px;color:var(--fg)}
.cx-in-pg .cx-in-row span{display:block;font-size:12px;line-height:1.5;color:var(--fg2)}

/* CTA */
.cx-in-pg .cx-in-act{display:flex!important;justify-content:center!important;padding:0 16px;margin-top:28px}
.cx-in-pg .cx-in-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;
  min-width:min(240px,100%);height:48px;margin:0!important;padding:0 44px!important;border:0!important;border-radius:999px!important;
  background:linear-gradient(135deg,#2f80ed 0%,#5b6cff 100%)!important;color:#fff!important;font-size:15px!important;font-weight:600!important;
  text-align:center!important;cursor:pointer;box-shadow:0 8px 22px rgba(75,110,245,.35);transition:transform .15s,box-shadow .15s}
.cx-in-pg .cx-in-btn:hover{box-shadow:0 12px 28px rgba(75,110,245,.45);transform:translateY(-1px)}
.cx-in-pg .cx-in-btn:active{transform:scale(.97)}

@media(min-width:768px){.cx-in-pg .cx-in-grid{grid-template-columns:repeat(4,1fr)}}
`;

const FEATURES = [["f1", "spot"], ["f2", "opt"], ["f3", "swap"], ["f4", "loan"]];
const TRUST = [["s1", "shield"], ["s2", "help"]];

const split = (v) => {
  const i = String(v).indexOf("|");
  return i < 0 ? [v, ""] : [v.slice(0, i), v.slice(i + 1)];
};

export default function Introduction({ go }) {
  const tx = useTx();

  return (
    <div className="cx-in-pg">
      <style>{CSS}</style>

      <div className="cx-in-top">
        <button type="button" onClick={() => go("home")} aria-label="Back"><BackI /></button>
        <h1>{tx("title")}</h1>
        <span />
      </div>

      <section className="cx-in-hero">
        <div className="cx-in-logo"><BrandMark size={40} /></div>
        <h2>{tx("tag")}</h2>
        <p>{tx("about")}</p>
      </section>

      <h3 className="cx-in-h">{tx("why")}</h3>
      <div className="cx-in-grid">
        {FEATURES.map(([k, ic]) => {
          const [h, d] = split(tx(k));
          return (
            <div className="cx-in-card" key={k}>
              <div className="cx-in-ic"><Ico n={ic} /></div>
              <b>{h}</b>
              <span>{d}</span>
            </div>
          );
        })}
      </div>

      <div className="cx-in-list" style={{ marginTop: 12 }}>
        {TRUST.map(([k, ic]) => {
          const [h, d] = split(tx(k));
          return (
            <div className="cx-in-row" key={k}>
              <div className="cx-in-ic"><Ico n={ic} /></div>
              <div>
                <b>{h}</b>
                <span>{d}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cx-in-act">
        <button type="button" className="cx-in-btn" onClick={() => go("options")}>{tx("cta")}</button>
      </div>
    </div>
  );
}

