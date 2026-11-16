import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LangCtx, API, TOKEN, api, T3 } from "./Home";

/* =====================================================================
   src/pages/authentication.jsx — Identity verification (KYC)
   Backend: POST /kyc/submit (multipart: doc_type, name, front, back)
            GET  /kyc/status
            GET  /kyc/file/{doc_id}/{front|back}  (Bearer token লাগে → blob হিসেবে আনা হয়)

   ✔ Night / Light mode: সাইডবারের নাইট মোড সুইচ অনুযায়ী নাইটে নাইট, লাইটে লাইট (অটো-ডিটেক্ট)
   ✔ ভাষা: সব ২৬টি ভাষার অনুবাদ আছে (আগে অনেক ভাষায় English দেখাত)
   ===================================================================== */

const DOC_TYPE = "nid"; /* backend DOC_TYPES: nid | passport | driving */
const MAX_MB = 5; /* backend MAX_BYTES = 5 MB */

/* ---------- মূল টেক্সট (ক্রম নিচের KEYS অনুযায়ী) ---------- */
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
  zhT: ["實名認證", "姓名", "請輸入真實姓名", "上傳證件照片", "上傳證件正面", "上傳證件反面", "確認", "請輸入真實姓名", "請上傳證件正反面", "圖片過大（最大 5 MB）", "已提交，等待審核", "您的資料正在審核中", "您已通過實名認證", "認證被拒絕，請重新提交", "請稍候...", "請求失敗", "請選擇圖片檔案"],
  ja: ["本人確認", "氏名", "本名を入力してください", "身分証の写真をアップロード", "身分証の表面をアップロード", "身分証の裏面をアップロード", "確認", "本名を入力してください", "身分証の両面をアップロードしてください", "画像が大きすぎます（最大5MB）", "送信しました。審査をお待ちください", "書類を審査中です", "本人確認が完了しました", "確認が却下されました。再送信してください", "お待ちください...", "リクエストに失敗しました", "画像ファイルを選択してください"],
  id: ["Verifikasi identitas", "Nama", "Masukkan nama asli Anda", "Unggah foto KTP", "Unggah sisi depan KTP", "Unggah sisi belakang KTP", "Konfirmasi", "Masukkan nama asli Anda", "Unggah kedua sisi KTP", "Gambar terlalu besar (maks. 5 MB)", "Terkirim. Menunggu tinjauan", "Dokumen Anda sedang ditinjau", "Identitas Anda telah terverifikasi", "Verifikasi ditolak. Kirim ulang", "Harap tunggu...", "Permintaan gagal", "Pilih file gambar"],
  ko: ["본인 인증", "이름", "실명을 입력하세요", "신분증 사진 업로드", "신분증 앞면 업로드", "신분증 뒷면 업로드", "확인", "실명을 입력하세요", "신분증 양면 사진을 업로드하세요", "이미지가 너무 큽니다 (최대 5 MB)", "제출되었습니다. 검토 대기 중", "서류를 검토 중입니다", "본인 인증이 완료되었습니다", "인증이 거절되었습니다. 다시 제출하세요", "잠시만 기다려 주세요...", "요청 실패", "이미지 파일을 선택하세요"],
  vi: ["Xác minh danh tính", "Tên", "Nhập tên thật của bạn", "Tải ảnh giấy tờ", "Tải mặt trước giấy tờ", "Tải mặt sau giấy tờ", "Xác nhận", "Nhập tên thật của bạn", "Vui lòng tải lên cả hai mặt giấy tờ", "Ảnh quá lớn (tối đa 5 MB)", "Đã gửi. Đang chờ duyệt", "Giấy tờ của bạn đang được xem xét", "Danh tính của bạn đã được xác minh", "Xác minh bị từ chối. Vui lòng gửi lại", "Vui lòng chờ...", "Yêu cầu thất bại", "Vui lòng chọn tệp ảnh"],
  it: ["Verifica dell'identità", "Nome", "Inserisci il tuo vero nome", "Carica la foto del documento", "Carica il fronte del documento", "Carica il retro del documento", "Conferma", "Inserisci il tuo vero nome", "Carica entrambi i lati del documento", "Immagine troppo grande (max 5 MB)", "Inviato. In attesa di revisione", "I tuoi documenti sono in revisione", "La tua identità è verificata", "Verifica rifiutata. Invia di nuovo", "Attendere...", "Richiesta fallita", "Scegli un file immagine"],
  el: ["Επαλήθευση ταυτότητας", "Όνομα", "Εισάγετε το πραγματικό σας όνομα", "Μεταφόρτωση φωτογραφίας ταυτότητας", "Μεταφόρτωση μπροστινής όψης", "Μεταφόρτωση πίσω όψης", "Επιβεβαίωση", "Εισάγετε το πραγματικό σας όνομα", "Ανεβάστε και τις δύο όψεις της ταυτότητας", "Η εικόνα είναι πολύ μεγάλη (μέγ. 5 MB)", "Υποβλήθηκε. Αναμονή ελέγχου", "Τα έγγραφά σας ελέγχονται", "Η ταυτότητά σας επαληθεύτηκε", "Η επαλήθευση απορρίφθηκε. Υποβάλετε ξανά", "Παρακαλώ περιμένετε...", "Το αίτημα απέτυχε", "Επιλέξτε αρχείο εικόνας"],
  ms: ["Pengesahan identiti", "Nama", "Masukkan nama sebenar anda", "Muat naik foto ID", "Muat naik bahagian depan ID", "Muat naik bahagian belakang ID", "Sahkan", "Masukkan nama sebenar anda", "Sila muat naik kedua-dua belah ID", "Imej terlalu besar (maks. 5 MB)", "Dihantar. Menunggu semakan", "Dokumen anda sedang disemak", "Identiti anda telah disahkan", "Pengesahan ditolak. Sila hantar semula", "Sila tunggu...", "Permintaan gagal", "Sila pilih fail imej"],
  th: ["ยืนยันตัวตน", "ชื่อ", "กรุณาใส่ชื่อจริงของคุณ", "อัปโหลดรูปบัตรประชาชน", "อัปโหลดด้านหน้าบัตร", "อัปโหลดด้านหลังบัตร", "ยืนยัน", "กรุณาใส่ชื่อจริงของคุณ", "กรุณาอัปโหลดบัตรทั้งสองด้าน", "รูปใหญ่เกินไป (สูงสุด 5 MB)", "ส่งแล้ว รอการตรวจสอบ", "เอกสารของคุณอยู่ระหว่างการตรวจสอบ", "ยืนยันตัวตนของคุณแล้ว", "การยืนยันถูกปฏิเสธ กรุณาส่งอีกครั้ง", "กรุณารอสักครู่...", "คำขอล้มเหลว", "กรุณาเลือกไฟล์รูปภาพ"],
  la: ["Verificatio identitatis", "Nomen", "Nomen tuum verum insere", "Imaginem documenti impone", "Faciem anteriorem impone", "Faciem posteriorem impone", "Confirma", "Nomen tuum verum insere", "Utramque faciem documenti impone", "Imago nimis magna est (max. 5 MB)", "Missum. Recognitionem exspectat", "Documenta tua recognoscuntur", "Identitas tua verificata est", "Verificatio repudiata est. Iterum mitte", "Exspecta...", "Petitio defecit", "Imaginis fasciculum elige"],
  ro: ["Verificarea identității", "Nume", "Introduceți numele real", "Încărcați fotografia actului", "Încărcați fața actului", "Încărcați verso-ul actului", "Confirmă", "Introduceți numele real", "Încărcați ambele fețe ale actului", "Imaginea este prea mare (max. 5 MB)", "Trimis. Se așteaptă verificarea", "Documentele dvs. sunt în curs de verificare", "Identitatea dvs. a fost verificată", "Verificarea a fost respinsă. Trimiteți din nou", "Vă rugăm așteptați...", "Cererea a eșuat", "Alegeți un fișier imagine"],
  sv: ["Identitetsverifiering", "Namn", "Ange ditt riktiga namn", "Ladda upp ID-foto", "Ladda upp ID:ts framsida", "Ladda upp ID:ts baksida", "Bekräfta", "Ange ditt riktiga namn", "Ladda upp båda sidor av ID:t", "Bilden är för stor (max 5 MB)", "Skickat. Väntar på granskning", "Dina dokument granskas", "Din identitet är verifierad", "Verifieringen avvisades. Skicka igen", "Vänta...", "Begäran misslyckades", "Välj en bildfil"],
  ht: ["Verifikasyon idantite", "Non", "Antre vrè non ou", "Voye foto kat idantite", "Voye devan kat la", "Voye dèyè kat la", "Konfime", "Antre vrè non ou", "Tanpri voye de bò kat la", "Imaj la two gwo (maks. 5 MB)", "Voye. Ap tann revizyon", "Dokiman ou yo ap revize", "Idantite ou verifye", "Verifikasyon an rejte. Tanpri voye ankò", "Tanpri tann...", "Demann echwe", "Tanpri chwazi yon fichye imaj"],
  fa: ["تأیید هویت", "نام", "نام واقعی خود را وارد کنید", "بارگذاری تصویر مدرک شناسایی", "بارگذاری روی مدرک", "بارگذاری پشت مدرک", "تأیید", "نام واقعی خود را وارد کنید", "لطفاً هر دو طرف مدرک را بارگذاری کنید", "تصویر خیلی بزرگ است (حداکثر ۵ مگابایت)", "ارسال شد. در انتظار بررسی", "مدارک شما در حال بررسی است", "هویت شما تأیید شد", "تأیید رد شد. لطفاً دوباره ارسال کنید", "لطفاً صبر کنید...", "درخواست ناموفق بود", "لطفاً یک فایل تصویر انتخاب کنید"],
};

/* ---------- ব্যাকএন্ডের error code + ডকুমেন্ট সেকশনের টেক্সট ---------- */
const EXTRA_KEYS = ["docType", "kycLocked", "fileBig", "fileType", "notFound", "forbidden", "yourDocs", "reason"];

const EXTRA_RAW = {
  en: ["Invalid document type", "Your verification is already submitted or approved", "Image is too large (max 5 MB)", "Only JPG or PNG images are allowed", "Not found", "Not allowed", "Your submitted documents", "Reason"],
  bn: ["ডকুমেন্টের ধরন সঠিক নয়", "আপনার যাচাই আগেই জমা হয়েছে বা অনুমোদিত", "ছবি অনেক বড় (সর্বোচ্চ ৫ MB)", "শুধু JPG বা PNG ছবি দেওয়া যাবে", "পাওয়া যায়নি", "অনুমতি নেই", "আপনার জমা দেওয়া ডকুমেন্ট", "কারণ"],
  hi: ["दस्तावेज़ का प्रकार गलत है", "आपका सत्यापन पहले ही जमा या स्वीकृत हो चुका है", "फोटो बहुत बड़ी है (अधिकतम 5 MB)", "केवल JPG या PNG फ़ोटो मान्य हैं", "नहीं मिला", "अनुमति नहीं है", "आपके जमा किए दस्तावेज़", "कारण"],
  ur: ["دستاویز کی قسم درست نہیں", "آپ کی تصدیق پہلے ہی جمع یا منظور ہو چکی ہے", "تصویر بہت بڑی ہے (زیادہ سے زیادہ 5 MB)", "صرف JPG یا PNG تصاویر قابل قبول ہیں", "نہیں ملا", "اجازت نہیں", "آپ کے جمع کردہ دستاویزات", "وجہ"],
  ar: ["نوع المستند غير صالح", "تم إرسال التحقق أو الموافقة عليه مسبقا", "الصورة كبيرة جدا (الحد الأقصى 5 MB)", "يسمح فقط بصور JPG أو PNG", "غير موجود", "غير مسموح", "المستندات التي أرسلتها", "السبب"],
  fr: ["Type de document invalide", "Votre vérification est déjà soumise ou approuvée", "Image trop volumineuse (max 5 Mo)", "Seules les images JPG ou PNG sont acceptées", "Introuvable", "Non autorisé", "Vos documents soumis", "Motif"],
  es: ["Tipo de documento no válido", "Su verificación ya fue enviada o aprobada", "Imagen demasiado grande (máx. 5 MB)", "Solo se permiten imágenes JPG o PNG", "No encontrado", "No permitido", "Sus documentos enviados", "Motivo"],
  de: ["Ungültiger Dokumenttyp", "Ihre Verifizierung wurde bereits eingereicht oder genehmigt", "Bild zu groß (max. 5 MB)", "Nur JPG- oder PNG-Bilder sind erlaubt", "Nicht gefunden", "Nicht erlaubt", "Ihre eingereichten Dokumente", "Grund"],
  pt: ["Tipo de documento inválido", "Sua verificação já foi enviada ou aprovada", "Imagem muito grande (máx. 5 MB)", "Apenas imagens JPG ou PNG são permitidas", "Não encontrado", "Não permitido", "Seus documentos enviados", "Motivo"],
  ru: ["Недопустимый тип документа", "Ваша проверка уже отправлена или одобрена", "Файл слишком большой (макс. 5 МБ)", "Допускаются только изображения JPG или PNG", "Не найдено", "Не разрешено", "Ваши отправленные документы", "Причина"],
  tr: ["Geçersiz belge türü", "Doğrulamanız zaten gönderildi veya onaylandı", "Görsel çok büyük (en fazla 5 MB)", "Yalnızca JPG veya PNG görsellere izin verilir", "Bulunamadı", "İzin verilmiyor", "Gönderdiğiniz belgeler", "Neden"],
  zh: ["证件类型无效", "您的认证已提交或已通过", "图片过大（最大 5 MB）", "仅支持 JPG 或 PNG 图片", "未找到", "无权限", "您已提交的资料", "原因"],
  zhT: ["證件類型無效", "您的認證已提交或已通過", "圖片過大（最大 5 MB）", "僅支援 JPG 或 PNG 圖片", "未找到", "無權限", "您已提交的資料", "原因"],
  ja: ["書類の種類が無効です", "本人確認はすでに提出済みまたは承認済みです", "画像が大きすぎます（最大5MB）", "JPGまたはPNG画像のみ使用できます", "見つかりません", "許可されていません", "提出済みの書類", "理由"],
  id: ["Jenis dokumen tidak valid", "Verifikasi Anda sudah dikirim atau disetujui", "Gambar terlalu besar (maks. 5 MB)", "Hanya gambar JPG atau PNG yang diizinkan", "Tidak ditemukan", "Tidak diizinkan", "Dokumen yang Anda kirim", "Alasan"],
  ko: ["문서 유형이 올바르지 않습니다", "인증이 이미 제출되었거나 승인되었습니다", "이미지가 너무 큽니다 (최대 5 MB)", "JPG 또는 PNG 이미지만 허용됩니다", "찾을 수 없음", "허용되지 않음", "제출한 서류", "사유"],
  vi: ["Loại giấy tờ không hợp lệ", "Xác minh của bạn đã được gửi hoặc phê duyệt", "Ảnh quá lớn (tối đa 5 MB)", "Chỉ cho phép ảnh JPG hoặc PNG", "Không tìm thấy", "Không được phép", "Giấy tờ bạn đã gửi", "Lý do"],
  it: ["Tipo di documento non valido", "La tua verifica è già stata inviata o approvata", "Immagine troppo grande (max 5 MB)", "Sono consentite solo immagini JPG o PNG", "Non trovato", "Non consentito", "I tuoi documenti inviati", "Motivo"],
  el: ["Μη έγκυρος τύπος εγγράφου", "Η επαλήθευσή σας έχει ήδη υποβληθεί ή εγκριθεί", "Η εικόνα είναι πολύ μεγάλη (μέγ. 5 MB)", "Επιτρέπονται μόνο εικόνες JPG ή PNG", "Δεν βρέθηκε", "Δεν επιτρέπεται", "Τα έγγραφα που υποβάλατε", "Λόγος"],
  ms: ["Jenis dokumen tidak sah", "Pengesahan anda telah dihantar atau diluluskan", "Imej terlalu besar (maks. 5 MB)", "Hanya imej JPG atau PNG dibenarkan", "Tidak ditemui", "Tidak dibenarkan", "Dokumen yang anda hantar", "Sebab"],
  th: ["ประเภทเอกสารไม่ถูกต้อง", "การยืนยันของคุณถูกส่งหรืออนุมัติแล้ว", "รูปใหญ่เกินไป (สูงสุด 5 MB)", "อนุญาตเฉพาะรูป JPG หรือ PNG", "ไม่พบ", "ไม่ได้รับอนุญาต", "เอกสารที่คุณส่งแล้ว", "เหตุผล"],
  la: ["Genus documenti non validum", "Verificatio tua iam missa vel approbata est", "Imago nimis magna (max. 5 MB)", "Solae imagines JPG vel PNG permittuntur", "Non inventum", "Non permissum", "Documenta a te missa", "Causa"],
  ro: ["Tip de document invalid", "Verificarea dvs. a fost deja trimisă sau aprobată", "Imaginea este prea mare (max. 5 MB)", "Sunt permise doar imagini JPG sau PNG", "Negăsit", "Nepermis", "Documentele trimise de dvs.", "Motiv"],
  sv: ["Ogiltig dokumenttyp", "Din verifiering är redan skickad eller godkänd", "Bilden är för stor (max 5 MB)", "Endast JPG- eller PNG-bilder tillåts", "Hittades inte", "Inte tillåtet", "Dina inskickade dokument", "Orsak"],
  ht: ["Tip dokiman pa valid", "Verifikasyon ou an deja voye oswa apwouve", "Imaj la two gwo (maks. 5 MB)", "Sèlman imaj JPG oswa PNG pèmèt", "Pa jwenn", "Pa pèmèt", "Dokiman ou te voye yo", "Rezon"],
  fa: ["نوع مدرک نامعتبر است", "تأیید هویت شما قبلاً ارسال یا تأیید شده است", "تصویر خیلی بزرگ است (حداکثر ۵ مگابایت)", "فقط تصاویر JPG یا PNG مجاز است", "یافت نشد", "مجاز نیست", "مدارک ارسال‌شده شما", "دلیل"],
};

/* ---------- RAW + EXTRA_RAW → AUTH[lang][key] ---------- */
const AUTH = {};
Object.keys(RAW).forEach((l) => {
  AUTH[l] = {};
  KEYS.forEach((k, i) => { if (RAW[l][i] != null) AUTH[l][k] = RAW[l][i]; });
  const ex = EXTRA_RAW[l] || EXTRA_RAW.en;
  EXTRA_KEYS.forEach((k, i) => { if (ex[i] != null) AUTH[l][k] = ex[i]; });
});

const LANG_FALLBACK = { zhT: "zh" };

/* অনুবাদ খোঁজার ক্রম: AUTH[lang] → AUTH[fallback] → AUTH.en → T3[lang] → T3.en → t(k) */
const useTr = () => {
  const { lang, t } = useContext(LangCtx);
  const fb = LANG_FALLBACK[lang];
  return (k) =>
    (AUTH[lang] && AUTH[lang][k]) ??
    (fb && AUTH[fb] && AUTH[fb][k]) ??
    AUTH.en[k] ??
    (T3 && T3[lang] && T3[lang][k]) ??
    (T3 && T3.en && T3.en[k]) ??
    t(k);
};

/* অনুবাদ আছে কি না (ব্যাকএন্ডের অচেনা error code হলে errGeneric দেখাতে) */
const known = (k) => !!(AUTH.en[k] || (T3 && T3.en && T3.en[k]));

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
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 2L7.2 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.2L15 2zm3 15a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);

const BackI = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

/* ---------- থিম (Night / Light) ----------
   অ্যাপের আসল ব্যাকগ্রাউন্ড দেখে থিম ঠিক করা হয়, আর থিম বদলালে (সাইডবারের নাইট মোড সুইচ)
   নিজে থেকেই আপডেট হয় — তাই সাইডবারের মতোই নাইটে নাইট, লাইটে লাইট। */
const parseColor = (s) => {
  const n = String(s || "").match(/[\d.]+/g);
  if (!n || n.length < 3) return null;
  return { r: +n[0], g: +n[1], b: +n[2], a: n.length > 3 ? +n[3] : 1 };
};

const detectDark = (el) => {
  try {
    let n = el && el.parentElement;
    while (n && n.nodeType === 1) {
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b < 140;
      n = n.parentElement;
    }
  } catch {}
  return !!(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
};

const useTheme = (ref, forced) => {
  const [dark, setDark] = useState(true);
  useLayoutEffect(() => {
    if (typeof forced === "boolean") { setDark(forced); return undefined; }
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const d = detectDark(ref.current);
        setDark((p) => (p === d ? p : d));
      });
    };
    setDark(detectDark(ref.current));

    /* প্রতিটি parent-এর class/style বদলালে আবার চেক (subtree নয়, তাই হালকা) */
    const mo = new MutationObserver(run);
    const opts = { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-bs-theme"] };
    let n = ref.current && ref.current.parentElement;
    while (n) { mo.observe(n, opts); n = n.parentElement; }

    const mq = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    if (mq && mq.addEventListener) mq.addEventListener("change", run);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      if (mq && mq.removeEventListener) mq.removeEventListener("change", run);
    };
  }, [forced]); // eslint-disable-line
  return dark;
};

/* ---------- CSS ----------
   রং এখন CSS variable — data-th="dark" | "light" অনুযায়ী বদলায়।
   অ্যাপের গ্লোবাল button/input স্টাইল যেন ভাঙতে না পারে, তাই দরকারি জায়গায় !important। */
const CSS = `
.cx-kc{--fg:#e8edf5;--fg2:rgba(232,237,245,.72);--ph:rgba(232,237,245,.42);
  --sf:rgba(255,255,255,.06);--sf2:rgba(255,255,255,.10);--bd:rgba(255,255,255,.18);--bd2:rgba(255,255,255,.30);
  --acc:#4b8bf5;--accbg:rgba(75,139,245,.10);
  --ok:#4be0a8;--okbg:rgba(47,211,155,.14);--okbd:rgba(47,211,155,.35);
  --bad:#ff8a95;--badbg:rgba(240,97,109,.14);--badbd:rgba(240,97,109,.38);
  --inf:#8fc4ff;--infbg:rgba(75,139,245,.16);--infbd:rgba(75,139,245,.38)}
.cx-kc[data-th="light"]{--fg:#1a2230;--fg2:rgba(26,34,48,.68);--ph:rgba(26,34,48,.40);
  --sf:rgba(0,0,0,.04);--sf2:rgba(0,0,0,.07);--bd:rgba(0,0,0,.14);--bd2:rgba(0,0,0,.26);
  --ok:#15803d;--okbg:rgba(21,128,61,.10);--okbd:rgba(21,128,61,.30);
  --bad:#c62828;--badbg:rgba(198,40,40,.08);--badbd:rgba(198,40,40,.30);
  --inf:#1d4ed8;--infbg:rgba(29,78,216,.08);--infbd:rgba(29,78,216,.28)}

.cx-kc{color:var(--fg);min-height:100vh;padding-bottom:32px;box-sizing:border-box}
.cx-kc,.cx-kc *{-webkit-tap-highlight-color:transparent}

/* Top bar */
.cx-kc .cx-kc-top{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;height:50px;
  background:var(--sf);border-bottom:1px solid var(--bd)}
.cx-kc .cx-kc-top h1{margin:0;font-size:16px;font-weight:600;text-align:center;color:var(--fg)!important}
.cx-kc .cx-kc-top button{height:50px;display:grid;place-items:center;background:none!important;border:0!important;
  color:var(--fg)!important;cursor:pointer;padding:0;text-align:center!important}
.cx[dir=rtl] .cx-kc-top button{transform:scaleX(-1)}

/* Name field — একটাই পরিষ্কার বর্ডার (ভেতরের input-এর আলাদা নীল বক্স নেই) */
.cx-kc .cx-kc-name{display:flex;align-items:center;gap:16px;margin:16px 16px 0;padding:0 14px;height:52px;box-sizing:border-box;
  background:var(--sf);border:1px solid var(--bd);border-radius:12px;transition:border-color .15s,box-shadow .15s}
.cx-kc .cx-kc-name:focus-within{border-color:var(--acc);box-shadow:0 0 0 3px rgba(75,139,245,.14)}
.cx-kc .cx-kc-name label{font-size:13.5px;font-weight:600;min-width:52px;color:var(--fg)}
.cx-kc .cx-kc-name input,
.cx-kc .cx-kc-name input:focus,
.cx-kc .cx-kc-name input:active{flex:1;min-width:0;width:100%;height:100%;margin:0;padding:0;box-sizing:border-box;
  border:0!important;outline:0!important;box-shadow:none!important;border-radius:0!important;
  background:transparent!important;color:var(--fg)!important;font-size:14px;-webkit-appearance:none;appearance:none}
.cx-kc .cx-kc-name input::placeholder{color:var(--ph)!important;opacity:1}

/* Sections */
.cx-kc .cx-kc-sec{padding:20px 16px 0;font-size:14px;font-weight:600;color:var(--fg)}
.cx-kc .cx-kc-ups{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px}
.cx-kc .cx-kc-up{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0;cursor:pointer}
.cx-kc .cx-kc-docs .cx-kc-up{cursor:default}
.cx-kc .cx-kc-box{width:100%;height:190px;display:grid;place-items:center;color:var(--fg2);overflow:hidden;border-radius:12px;
  background:var(--sf);border:1.5px dashed var(--bd2);transition:border-color .15s,background .15s}
.cx-kc .cx-kc-up:hover .cx-kc-box{border-color:var(--acc);background:var(--accbg)}
.cx-kc .cx-kc-docs .cx-kc-up:hover .cx-kc-box{border-color:var(--bd2);background:var(--sf)}
.cx-kc .cx-kc-box.has{border:1px solid var(--bd2);background:var(--sf2)}
.cx-kc .cx-kc-box img{width:100%;height:100%;object-fit:cover;display:block}
.cx-kc .cx-kc-lb{font-size:13px;font-weight:500;color:var(--fg2);margin:8px 0 2px;padding:0 4px}
.cx-kc .cx-kc-up input{display:none}

/* Confirm button — মাঝখানে, গ্র্যাডিয়েন্ট পিল (গ্লোবাল button স্টাইল override করা হয়েছে) */
.cx-kc .cx-kc-act{display:flex!important;justify-content:center!important;align-items:center;padding:0 16px;margin-top:28px}
.cx-kc .cx-kc-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px;
  width:auto!important;min-width:min(240px,100%);max-width:100%;height:48px;margin:0!important;padding:0 44px!important;
  border:0!important;border-radius:999px!important;
  background:linear-gradient(135deg,#2f80ed 0%,#5b6cff 100%)!important;color:#fff!important;
  font-size:15px!important;font-weight:600!important;letter-spacing:.3px;text-align:center!important;cursor:pointer;
  box-shadow:0 8px 22px rgba(75,110,245,.35);transition:transform .15s,box-shadow .15s,opacity .15s}
.cx-kc .cx-kc-btn:hover:not(:disabled){box-shadow:0 12px 28px rgba(75,110,245,.45);transform:translateY(-1px)}
.cx-kc .cx-kc-btn:active:not(:disabled){transform:scale(.97)}
.cx-kc .cx-kc-btn:disabled{opacity:.6;cursor:default;box-shadow:none}
.cx-kc .cx-kc-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;
  animation:cxkcspin .7s linear infinite}
@keyframes cxkcspin{to{transform:rotate(360deg)}}

/* Messages */
.cx-kc .cx-kc-msg{margin:12px 16px 0;padding:10px 12px;border-radius:10px;font-size:13.5px;line-height:1.45;
  background:var(--infbg);color:var(--inf);border:1px solid var(--infbd)}
.cx-kc .cx-kc-msg.bad{background:var(--badbg);color:var(--bad);border-color:var(--badbd)}
.cx-kc .cx-kc-msg.ok{background:var(--okbg);color:var(--ok);border-color:var(--okbd)}

@media(min-width:768px){
.cx-kc .cx-kc-box{height:220px}
}
`;

export default function Authentication({ W, go }) {
  const tr = useTr();
  const alive = useRef(true);
  const rootRef = useRef(null);
  const dark = useTheme(rootRef, W && typeof W.dark === "boolean" ? W.dark : undefined);
  const [name, setName] = useState("");
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [pf, setPf] = useState("");
  const [pb, setPb] = useState("");
  const [busy, setBusy] = useState(false);
  /* msg.s: "ok" (সবুজ) | "info" (নীল) | "bad" (লাল) */
  const [msg, setMsg] = useState({ k: "", s: "bad" });
  const [st, setSt] = useState("none");
  const [doc, setDoc] = useState(null);
  const [df, setDf] = useState("");
  const [db, setDb] = useState("");

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const loadStatus = async () => {
    try {
      const j = await api("/kyc/status");
      if (alive.current) { setSt(kind(j && j.verify_status)); setDoc((j && j.document) || null); }
    } catch {}
  };
  useEffect(() => { if (!W.guest) loadStatus(); }, []); // eslint-disable-line

  /* জমা দেওয়া ডকুমেন্টের ছবি (Bearer token লাগে, তাই blob হিসেবে আনা) */
  useEffect(() => {
    const id = doc && doc.id;
    if (!id) { setDf(""); setDb(""); return; }
    let dead = false;
    const urls = [];
    const get = async (side, set) => {
      try {
        const r = await fetch(API + "/kyc/file/" + id + "/" + side, { headers: TOKEN ? { Authorization: "Bearer " + TOKEN } : {} });
        if (!r.ok) return;
        const u = URL.createObjectURL(await r.blob());
        if (dead) { URL.revokeObjectURL(u); return; }
        urls.push(u);
        set(u);
      } catch {}
    };
    get("front", setDf);
    get("back", setDb);
    return () => { dead = true; urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [doc && doc.id]); // eslint-disable-line

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
      fd.append("name", name.trim());
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
    <div className="cx-kc" ref={rootRef} data-th={dark ? "dark" : "light"}>
      <style>{CSS}</style>
      <div className="cx-kc-top">
        <button type="button" onClick={() => go("home")} aria-label="Back"><BackI /></button>
        <h1>{tr("title")}</h1>
        <span />
      </div>

      {st === "wait" && <p className="cx-kc-msg">{tr("stPending")}</p>}
      {st === "ok" && <p className="cx-kc-msg ok">{tr("stVerified")}</p>}
      {st === "bad" && <p className="cx-kc-msg bad">{tr("stRejected")}</p>}

      {st === "bad" && doc && doc.reject_reason && (
        <p className="cx-kc-msg bad">{tr("reason")}: {doc.reject_reason}</p>
      )}

      {doc && (df || db) && (
        <div className="cx-kc-docs">
          <div className="cx-kc-sec">
            {tr("yourDocs")}{doc.full_name ? " — " + doc.full_name : ""}
          </div>
          <div style={{ height: 8 }} />
          <div className="cx-kc-ups">
            <div className="cx-kc-up">
              <div className={"cx-kc-box" + (df ? " has" : "")}>{df ? <img src={df} alt="" /> : <CamI />}</div>
              <span className="cx-kc-lb">{tr("front")}</span>
            </div>
            <div className="cx-kc-up">
              <div className={"cx-kc-box" + (db ? " has" : "")}>{db ? <img src={db} alt="" /> : <CamI />}</div>
              <span className="cx-kc-lb">{tr("back")}</span>
            </div>
          </div>
        </div>
      )}

      {!locked && (
        <>
          <div className="cx-kc-name">
            <label>{tr("name")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr("namePh")}
              autoComplete="name"
              maxLength={120}
            />
          </div>
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

          <div className="cx-kc-act">
            <button type="button" className="cx-kc-btn" onClick={submit} disabled={busy}>
              {busy && <span className="cx-kc-spin" />}
              {busy ? tr("wait2") : tr("confirm")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
