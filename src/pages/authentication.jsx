import React, { useContext, useEffect, useRef, useState } from "react";
import { LangCtx, API, TOKEN, api, T3 } from "./Home";

/* =====================================================================
   src/pages/authentication.jsx — Identity verification (KYC)
   Backend: POST /kyc/submit (multipart: doc_type, front, back [, name])
            GET  /kyc/status
   ===================================================================== */

const DOC_TYPE = "nid"; /* backend DOC_TYPES: nid | passport | driving */
const MAX_MB = 5; /* backend MAX_BYTES = 5 MB */

const KEYS = [
  "title", "name", "namePh", "upPhoto", "front", "back", "confirm", "eName", "ePhotos", "tooBig",
  "okSub", "stPending", "stVerified", "stRejected", "wait2", "errGeneric", "badType",
];

const RAW = {
  en: ["Identity verification", "Name", "Please enter your real name", "Upload ID photo", "Upload front side of ID", "Upload back side of ID", "Confirm", "Please enter your real name", "Please upload both sides of your ID", "Image is too large (max 5 MB)", "Submitted. Awaiting review", "Your documents are under review", "Your identity is verified", "Verification was rejected. Please submit again", "Please wait...", "Request failed", "Please choose an image file"],
  bn: ["পরিচয় যাচাই", "নাম", "আপনার আসল নাম লিখুন", "আইডি ছবি আপলোড করুন", "আইডির সামনের পাশ আপলোড করুন", "আইডির পেছনের পাশ আপলোড করুন", "নিশ্চিত করুন", "আপনার আসল নাম লিখুন", "আইডির দুই পাশের ছবি আপলোড করুন", "ছবি অনেক বড় (সর্বোচ্চ ৫ MB)", "জমা হয়েছে। যাচাইয়ের অপেক্ষায়", "আপনার ডকুমেন্ট যাচাই চলছে", "আপনার পরিচয় যাচাই হয়েছে", "যাচাই বাতিল হয়েছে। আবার জমা দিন", "অপেক্ষা করুন...", "অনুরোধ ব্যর্থ হয়েছে", "একটি ছবির ফাইল বেছে নিন"],
  hi: ["पहचान सत्यापन", "नाम", "अपना असली नाम दर्ज करें", "आईडी फोटो अपलोड करें", "आईडी का अगला भाग अपलोड करें", "आईडी का पिछला भाग अपलोड करें", "पुष्टि करें", "अपना असली नाम दर्ज करें", "आईडी के दोनों तरफ की फोटो अपलोड करें", "फोटो बहुत बड़ी है (अधिकतम 5 MB)", "जमा हुआ। समीक्षा की प्रतीक्षा", "आपके दस्तावेज़ समीक्षा में हैं", "आपकी पहचान सत्यापित है", "सत्यापन अस्वीकृत हुआ। कृपया फिर जमा करें", "कृपया प्रतीक्षा करें...", "अनुरोध विफल रहा", "कृपया इमेज फ़ाइल चुनें"],
  ur: ["شناخت کی تصدیق", "نام", "اپنا اصل نام درج کریں", "شناختی کارڈ کی تصویر اپ لوڈ کریں", "شناختی کارڈ کا اگلا حصہ اپ لوڈ کریں", "شناختی کارڈ کا پچھلا حصہ اپ لوڈ کریں", "تصدیق کریں", "اپنا اصل نام درج کریں", "شناختی کارڈ کے دونوں طرف کی تصویر اپ لوڈ کریں", "تصویر بہت بڑی ہے (زیادہ سے زیادہ 5 MB)", "جمع ہو گیا۔ جائزے کا انتظار", "آپ کے دستاویزات زیر جائزہ ہیں", "آپ کی شناخت تصدیق شدہ ہے", "تصدیق مسترد ہو گئی۔ دوبارہ جمع کریں", "براہ کرم انتظار کریں...", "درخواست ناکام ہو گئی", "براہ کرم تصویر کی فائل منتخب کریں"],
  ar: ["التحقق من الهوية", "الاسم", "أدخل اسمك الحقيقي", "ارفع صورة الهوية", "ارفع الوجه الأمامي للهوية", "ارفع الوجه الخلفي للهوية", "تأكيد", "أدخل اسمك الحقيقي", "يرجى رفع وجهي الهوية", "الصورة كبيرة جدا (الحد الأقصى 5 MB)", "تم الإرسال. بانتظار المراجعة", "مستنداتك قيد المراجعة", "تم التحقق من هويتك", "تم رفض التحقق. يرجى الإرسال مرة أخرى", "يرجى الانتظار...", "فشل الطلب", "يرجى اختيار ملف صورة"],
  fr: ["Vérification d'identité", "Nom", "Saisissez votre vrai nom", "Téléverser la photo de la pièce d'identité", "Téléverser le recto", "Téléverser le verso", "Confirmer", "Saisissez votre vrai nom", "Veuillez téléverser les deux faces", "Image trop volumineuse (max 5 Mo)", "Envoyé. En attente de vérification", "Vos documents sont en cours d'examen", "Votre identité est vérifiée", "Vérification refusée. Veuillez renvoyer", "Veuillez patienter...", "Échec de la requête", "Veuillez choisir une image"],
  es: ["Verificación de identidad", "Nombre", "Ingrese su nombre real", "Subir foto del documento", "Subir frente del documento", "Subir reverso del documento", "Confirmar", "Ingrese su nombre real", "Suba ambos lados del documento", "Imagen demasiado grande (máx. 5 MB)", "Enviado. Pendiente de revisión", "Sus documentos están en revisión", "Su identidad está verificada", "Verificación rechazada. Envíe de nuevo", "Espere por favor...", "La solicitud falló", "Elija un archivo de imagen"],
  de: ["Identitätsprüfung", "Name", "Geben Sie Ihren echten Namen ein", "Ausweisfoto hochladen", "Vorderseite des Ausweises hochladen", "Rückseite des Ausweises hochladen", "Bestätigen", "Geben Sie Ihren echten Namen ein", "Bitte beide Seiten des Ausweises hochladen", "Bild zu groß (max. 5 MB)", "Gesendet. Warten auf Prüfung", "Ihre Dokumente werden geprüft", "Ihre Identität ist verifiziert", "Verifizierung abgelehnt. Bitte erneut senden", "Bitte warten...", "Anfrage fehlgeschlagen", "Bitte eine Bilddatei wählen"],
  pt: ["Verificação de identidade", "Nome", "Digite seu nome real", "Enviar foto do documento", "Enviar frente do documento", "Enviar verso do documento", "Confirmar", "Digite seu nome real", "Envie os dois lados do documento", "Imagem muito grande (máx. 5 MB)", "Enviado. Aguardando análise", "Seus documentos estão em análise", "Sua identidade foi verificada", "Verificação recusada. Envie novamente", "Aguarde...", "Falha na solicitação", "Escolha um arquivo de imagem"],
  ru: ["Проверка личности", "Имя", "Введите ваше настоящее имя", "Загрузите фото документа", "Загрузить лицевую сторону", "Загрузить оборотную сторону", "Подтвердить", "Введите ваше настоящее имя", "Загрузите обе стороны документа", "Файл слишком большой (макс. 5 МБ)", "Отправлено. Ожидает проверки", "Ваши документы на проверке", "Ваша личность подтверждена", "Проверка отклонена. Отправьте снова", "Подождите...", "Запрос не выполнен", "Выберите файл изображения"],
  tr: ["Kimlik doğrulama", "Ad", "Gerçek adınızı girin", "Kimlik fotoğrafı yükle", "Kimliğin ön yüzünü yükle", "Kimliğin arka yüzünü yükle", "Onayla", "Gerçek adınızı girin", "Kimliğin iki yüzünü de yükleyin", "Görsel çok büyük (en fazla 5 MB)", "Gönderildi. İnceleme bekleniyor", "Belgeleriniz inceleniyor", "Kimliğiniz doğrulandı", "Doğrulama reddedildi. Tekrar gönderin", "Lütfen bekleyin...", "İstek başarısız", "Lütfen bir görsel dosyası seçin"],
  zh: ["实名认证", "姓名", "请输入真实姓名", "上传证件照片", "上传证件正面", "上传证件反面", "确认", "请输入真实姓名", "请上传证件正反面", "图片过大（最大 5 MB）", "已提交，等待审核", "您的资料正在审核中", "您已通过实名认证", "认证被拒绝，请重新提交", "请稍候...", "请求失败", "请选择图片文件"],
  ja: ["本人確認", "氏名", "本名を入力してください", "身分証の写真をアップロード", "身分証の表面をアップロード", "身分証の裏面をアップロード", "確認", "本名を入力してください", "身分証の両面をアップロードしてください", "画像が大きすぎます（最大5MB）", "送信しました。審査をお待ちください", "書類を審査中です", "本人確認が完了しました", "確認が却下されました。再送信してください", "お待ちください...", "リクエストに失敗しました", "画像ファイルを選択してください"],
  id: ["Verifikasi identitas", "Nama", "Masukkan nama asli Anda", "Unggah foto KTP", "Unggah sisi depan KTP", "Unggah sisi belakang KTP", "Konfirmasi", "Masukkan nama asli Anda", "Unggah kedua sisi KTP", "Gambar terlalu besar (maks. 5 MB)", "Terkirim. Menunggu tinjauan", "Dokumen Anda sedang ditinjau", "Identitas Anda telah terverifikasi", "Verifikasi ditolak. Kirim ulang", "Harap tunggu...", "Permintaan gagal", "Pilih file gambar"],
};

const AUTH = {};
Object.keys(RAW).forEach((l) => {
  AUTH[l] = {};
  KEYS.forEach((k, i) => { if (RAW[l][i] != null) AUTH[l][k] = RAW[l][i]; });
});


/* ব্যাকএন্ডের error code (kyc.py) */
const EXTRA = {
  en: { docType: "Invalid document type", kycLocked: "Your verification is already submitted or approved", fileBig: "Image is too large (max 5 MB)", fileType: "Only JPG or PNG images are allowed", notFound: "Not found", forbidden: "Not allowed" },
  bn: { docType: "ডকুমেন্টের ধরন সঠিক নয়", kycLocked: "আপনার যাচাই আগেই জমা হয়েছে বা অনুমোদিত", fileBig: "ছবি অনেক বড় (সর্বোচ্চ ৫ MB)", fileType: "শুধু JPG বা PNG ছবি দেওয়া যাবে", notFound: "পাওয়া যায়নি", forbidden: "অনুমতি নেই" },
};
Object.keys(EXTRA).forEach((l) => Object.assign(AUTH[l], EXTRA[l]));

/* অনুবাদ খোঁজার ক্রম: AUTH[lang] → AUTH.en → T3[lang] → T3.en → t(k) */
const useTr = () => {
  const { lang, t } = useContext(LangCtx);
  return (k) =>
    (AUTH[lang] && AUTH[lang][k]) ??
    AUTH.en[k] ??
    (T3[lang] && T3[lang][k]) ??
    (T3.en && T3.en[k]) ??
    t(k);
};

/* অনুবাদ আছে কি না (ব্যাকএন্ডের অচেনা error code হলে errGeneric দেখাতে) */
const known = (k) => !!(AUTH.en[k] || (T3.en && T3.en[k]));

/* verify_status → none | wait | ok | bad */
const kind = (s) => {
  const v = String(s ?? "").trim();
  if (!v || /^(none|unverified|not|null|0)/i.test(v)) return "none";
  if (/reject|fail|den|refus/i.test(v)) return "bad";
  if (/approv|verif|success|pass|done|certif/i.test(v)) return "ok";
  if (/pend|review|wait|submit|process/i.test(v)) return "wait";
  return "none";
};

/* ছবি → JPEG (সর্বোচ্চ 1600px) — webp/png/বড় ছবির কারণে 400 এড়াতে */
const toJpeg = (file, max = 1600, q = 0.85) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth, h = img.naturalHeight;
        const sc = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * sc); h = Math.round(h * sc);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        c.toBlob((b) => {
          URL.revokeObjectURL(url);
          if (!b) return reject(new Error("badType"));
          resolve(new File([b], "id.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", q);
      } catch (e) { URL.revokeObjectURL(url); reject(new Error("badType")); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("badType")); };
    img.src = url;
  });

const CamI = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 2L7.2 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.2L15 2zm3 15a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);

const CSS = `
.cx-kc{background:#0b1520;color:#fff;min-height:100vh}
.cx-kc,.cx-kc *{-webkit-tap-highlight-color:transparent}
.cx-kc-top{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;height:46px;background:#0f2030;border-bottom:1px solid #3a4b5e}
.cx-kc-top h1{margin:0;font-size:17px;font-weight:400;text-align:center;color:#fff}
.cx-kc-top button{font-size:30px;line-height:1;height:46px;display:grid;place-items:center;text-align:center!important;color:#fff}
.cx[dir=rtl] .cx-kc-top button{transform:scaleX(-1)}
.cx-kc-name{display:flex;align-items:center;gap:30px;margin:0;padding:0 16px;height:46px;background:#0f2030}
.cx-kc-name label{font-size:14px;font-weight:600;min-width:56px}
.cx-kc-name input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#fff;font-size:14px}
.cx-kc-name input::placeholder{color:#b9c1cd}
.cx-kc-line{height:1px;background:#3a4b5e;margin:0 16px}
.cx-kc-sec{padding:10px 16px 0;font-size:14px;color:#fff}
.cx-kc-ups{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px}
.cx-kc-up{display:flex;flex-direction:column;align-items:center;text-align:center!important;padding:0;cursor:pointer}
.cx-kc-box{width:100%;height:190px;display:grid;place-items:center;color:#fff;overflow:hidden;border-radius:8px}
.cx-kc-box img{width:100%;height:100%;object-fit:cover;display:block}
.cx-kc-box.has{border:1px solid #2a3a50;background:#101c2d}
.cx-kc-lb{font-size:14px;color:#fff;margin:6px 0 4px;padding:0 4px}
.cx-kc-up input{display:none}
.cx-kc-btn{display:block;width:calc(100% - 32px);margin:14px 16px 0;height:44px;border-radius:8px;background:#1a82d6!important;color:#fff!important;font-size:14px;text-align:center!important}
.cx-kc-btn:disabled{opacity:.6}
.cx-kc-msg{margin:12px 16px 0;padding:10px 12px;border-radius:6px;font-size:14px;background:#17304f;color:#8fc4ff}
.cx-kc-msg.bad{background:#3b1a20;color:#ff8a95}
.cx-kc-msg.ok{background:#0f3a2c;color:#4be0a8}
@media(min-width:768px){
.cx-kc-box{height:220px}
}
`;

export default function Authentication({ W, go }) {
  const tr = useTr();
  const alive = useRef(true);
  const [name, setName] = useState("");
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [pf, setPf] = useState("");
  const [pb, setPb] = useState("");
  const [busy, setBusy] = useState(false);
  /* msg.s: "ok" (সবুজ) | "info" (নীল) | "bad" (লাল) */
  const [msg, setMsg] = useState({ k: "", s: "bad" });
  const [st, setSt] = useState("none");

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const loadStatus = async () => {
    try {
      const j = await api("/kyc/status");
      if (alive.current) setSt(kind(j && j.verify_status));
    } catch {}
  };
  useEffect(() => { if (!W.guest) loadStatus(); }, []); // eslint-disable-line

  /* preview URL cleanup */
  useEffect(() => {
    if (!front) { setPf(""); return; }
    const u = URL.createObjectURL(front);
    setPf(u);
    return () => URL.revokeObjectURL(u);
  }, [front]);
  useEffect(() => {
    if (!back) { setPb(""); return; }
    const u = URL.createObjectURL(back);
    setPb(u);
    return () => URL.revokeObjectURL(u);
  }, [back]);

  const pick = (set) => async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (f.type && !f.type.startsWith("image/")) return setMsg({ k: "badType", s: "bad" });
    try {
      const j = await toJpeg(f);
      if (j.size > MAX_MB * 1024 * 1024) return setMsg({ k: "tooBig", s: "bad" });
      setMsg({ k: "", s: "bad" });
      set(j);
    } catch {
      setMsg({ k: "badType", s: "bad" });
    }
  };

  const submit = async () => {
    if (busy) return;
    if (W.guest) return W.needLogin();
    if (!name.trim()) return setMsg({ k: "eName", s: "bad" });
    if (!front || !back) return setMsg({ k: "ePhotos", s: "bad" });
    setBusy(true);
    setMsg({ k: "wait2", s: "info" });
    try {
      const fd = new FormData();
      fd.append("doc_type", DOC_TYPE);
      fd.append("name", name.trim()); /* ব্যাকএন্ড এখন ignore করে; Form("name") যোগ করলে সেভ হবে */
      fd.append("front", front, "front.jpg");
      fd.append("back", back, "back.jpg");
      let r;
      try {
        r = await fetch(API + "/kyc/submit", {
          method: "POST",
          headers: TOKEN ? { Authorization: "Bearer " + TOKEN } : {},
          body: fd,
        });
      } catch { throw new Error("neterr"); }
      let j = null;
      try { j = await r.json(); } catch {}
      if (!r.ok) {
        if (r.status === 401) throw new Error("unauthorized");
        const d = j && j.detail;
        throw new Error(typeof d === "string" ? d : "errGeneric");
      }
      if (alive.current) {
        setMsg({ k: "okSub", s: "ok" });
        setSt("wait");
        setFront(null);
        setBack(null);
      }
      loadStatus();
    } catch (e) {
      const code = e && e.message;
      console.log("KYC error:", code);
      if (alive.current) setMsg({ k: known(code) ? code : "errGeneric", s: "bad", raw: known(code) ? "" : code });
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const locked = st === "wait" || st === "ok";

  return (
    <div className="cx-kc">
      <style>{CSS}</style>
      <div className="cx-kc-top">
        <button type="button" onClick={() => go("home")} aria-label="Back">‹</button>
        <h1>{tr("title")}</h1>
        <span />
      </div>

      {st === "wait" && <p className="cx-kc-msg">{tr("stPending")}</p>}
      {st === "ok" && <p className="cx-kc-msg ok">{tr("stVerified")}</p>}
      {st === "bad" && <p className="cx-kc-msg bad">{tr("stRejected")}</p>}

      {!locked && (
        <>
          <div className="cx-kc-name">
            <label>{tr("name")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr("namePh")}
              autoComplete="name"
            />
          </div>
          <div className="cx-kc-line" />
          <div className="cx-kc-sec">{tr("upPhoto")}</div>
          <div style={{ height: 8 }} />
          <div className="cx-kc-ups">
            <label className="cx-kc-up">
              <div className={"cx-kc-box" + (pf ? " has" : "")}>{pf ? <img src={pf} alt="" /> : <CamI />}</div>
              <span className="cx-kc-lb">{tr("front")}</span>
              <input type="file" accept="image/*" onChange={pick(setFront)} />
            </label>
            <label className="cx-kc-up">
              <div className={"cx-kc-box" + (pb ? " has" : "")}>{pb ? <img src={pb} alt="" /> : <CamI />}</div>
              <span className="cx-kc-lb">{tr("back")}</span>
              <input type="file" accept="image/*" onChange={pick(setBack)} />
            </label>
          </div>

          {msg.k && (
            <p className={"cx-kc-msg" + (msg.s === "ok" ? " ok" : msg.s === "bad" ? " bad" : "")}>
              {tr(msg.k)}{msg.raw ? " (" + msg.raw + ")" : ""}
            </p>
          )}

          <button type="button" className="cx-kc-btn" onClick={submit} disabled={busy}>
            {busy ? tr("wait2") : tr("confirm")}
          </button>
        </>
      )}
    </div>
  );
}
