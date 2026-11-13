import React, { useContext, useEffect, useRef, useState } from "react";
import { LangCtx, store, api, Ic, ICON, LangPicker, CSheet } from "./Home";

/* =====================================================================
   Register_Login.jsx
   Login | Register | Forgot Password → Customer Support
   সব ভাষার অনুবাদ এই ফাইলেই আছে (Home.jsx পরিবর্তন লাগবে না)
   ===================================================================== */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- TRANSLATIONS ---------- */

const KEYS = [
  "login", "register", "email", "pwLbl", "pw2Lbl", "acc", "pw", "pw2", "rem", "forgot",
  "welcomeSub", "createAcc", "createSub", "noAcc", "haveAcc", "guest", "csHelp",
  "bEmail", "bPw", "bMatch", "strWeak", "strMid", "strStrong", "wait2",
  "forgotTitle", "forgotSub", "exists", "noUser", "wrongPw", "neterr", "err",
];

const RAW = {
  en: ["Login", "Register", "Email", "Password", "Confirm password", "Please enter your email", "Please enter your password", "Please re-enter your password", "Remember account", "Forgot password?", "Sign in to continue trading", "Create your account", "Register in less than a minute", "Don't have an account?", "Already have an account?", "Continue as guest", "Need help? Contact customer service", "Enter a valid email address", "Password must be at least 6 characters", "Passwords do not match", "Weak", "Medium", "Strong", "Please wait...", "Forgot password", "Please contact customer service to reset your password.", "This email is already registered", "Account not found", "Wrong password", "Network error. Server may be waking up, try again", "Request failed"],
  bn: ["লগইন", "রেজিস্টার", "ইমেইল", "পাসওয়ার্ড", "পাসওয়ার্ড নিশ্চিত করুন", "আপনার ইমেইল লিখুন", "পাসওয়ার্ড লিখুন", "পাসওয়ার্ড আবার লিখুন", "অ্যাকাউন্ট মনে রাখুন", "পাসওয়ার্ড ভুলে গেছেন?", "ট্রেডিং চালিয়ে যেতে লগইন করুন", "অ্যাকাউন্ট খুলুন", "এক মিনিটেরও কমে রেজিস্টার করুন", "অ্যাকাউন্ট নেই?", "আগেই অ্যাকাউন্ট আছে?", "গেস্ট হিসেবে চালিয়ে যান", "সাহায্য লাগবে? কাস্টমার সার্ভিসে যোগাযোগ করুন", "সঠিক ইমেইল দিন", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", "পাসওয়ার্ড মিলছে না", "দুর্বল", "মাঝারি", "শক্তিশালী", "অপেক্ষা করুন...", "পাসওয়ার্ড ভুলে গেছেন", "পাসওয়ার্ড রিসেট করতে কাস্টমার সার্ভিসে যোগাযোগ করুন।", "এই ইমেইল আগেই রেজিস্টার করা", "অ্যাকাউন্ট পাওয়া যায়নি", "পাসওয়ার্ড ভুল", "নেটওয়ার্ক সমস্যা। সার্ভার জেগে উঠছে হতে পারে, আবার চেষ্টা করুন", "অনুরোধ ব্যর্থ হয়েছে"],
  hi: ["लॉगिन", "रजिस्टर", "ईमेल", "पासवर्ड", "पासवर्ड की पुष्टि करें", "अपना ईमेल दर्ज करें", "पासवर्ड दर्ज करें", "पासवर्ड फिर से दर्ज करें", "खाता याद रखें", "पासवर्ड भूल गए?", "ट्रेडिंग जारी रखने के लिए साइन इन करें", "अपना खाता बनाएं", "एक मिनट से कम में रजिस्टर करें", "खाता नहीं है?", "पहले से खाता है?", "अतिथि के रूप में जारी रखें", "मदद चाहिए? ग्राहक सेवा से संपर्क करें", "मान्य ईमेल दर्ज करें", "पासवर्ड कम से कम 6 अक्षर का होना चाहिए", "पासवर्ड मेल नहीं खाते", "कमज़ोर", "मध्यम", "मजबूत", "कृपया प्रतीक्षा करें...", "पासवर्ड भूल गए", "पासवर्ड रीसेट करने के लिए ग्राहक सेवा से संपर्क करें।", "यह ईमेल पहले से पंजीकृत है", "खाता नहीं मिला", "गलत पासवर्ड", "नेटवर्क त्रुटि। सर्वर शुरू हो रहा होगा, दोबारा प्रयास करें", "अनुरोध विफल रहा"],
  ur: ["لاگ ان", "رجسٹر", "ای میل", "پاس ورڈ", "پاس ورڈ کی تصدیق کریں", "اپنا ای میل درج کریں", "پاس ورڈ درج کریں", "پاس ورڈ دوبارہ درج کریں", "اکاؤنٹ یاد رکھیں", "پاس ورڈ بھول گئے؟", "ٹریڈنگ جاری رکھنے کے لیے سائن اِن کریں", "اپنا اکاؤنٹ بنائیں", "ایک منٹ سے کم میں رجسٹر کریں", "اکاؤنٹ نہیں ہے؟", "پہلے سے اکاؤنٹ ہے؟", "مہمان کے طور پر جاری رکھیں", "مدد چاہیے؟ کسٹمر سروس سے رابطہ کریں", "درست ای میل درج کریں", "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے", "پاس ورڈ میل نہیں کھاتے", "کمزور", "درمیانہ", "مضبوط", "براہ کرم انتظار کریں...", "پاس ورڈ بھول گئے", "پاس ورڈ ری سیٹ کرنے کے لیے کسٹمر سروس سے رابطہ کریں۔", "یہ ای میل پہلے سے رجسٹرڈ ہے", "اکاؤنٹ نہیں ملا", "غلط پاس ورڈ", "نیٹ ورک کی خرابی۔ سرور شروع ہو رہا ہو سکتا ہے، دوبارہ کوشش کریں", "درخواست ناکام ہو گئی"],
  ar: ["تسجيل الدخول", "تسجيل", "البريد الإلكتروني", "كلمة المرور", "تأكيد كلمة المرور", "أدخل بريدك الإلكتروني", "أدخل كلمة المرور", "أعد إدخال كلمة المرور", "تذكر الحساب", "نسيت كلمة المرور؟", "سجّل الدخول لمتابعة التداول", "أنشئ حسابك", "سجّل في أقل من دقيقة", "ليس لديك حساب؟", "لديك حساب بالفعل؟", "المتابعة كضيف", "تحتاج مساعدة؟ تواصل مع خدمة العملاء", "أدخل بريدًا إلكترونيًا صالحًا", "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل", "كلمتا المرور غير متطابقتين", "ضعيفة", "متوسطة", "قوية", "يرجى الانتظار...", "نسيت كلمة المرور", "يرجى التواصل مع خدمة العملاء لإعادة تعيين كلمة المرور.", "هذا البريد مسجل بالفعل", "الحساب غير موجود", "كلمة المرور خاطئة", "خطأ في الشبكة. قد يكون الخادم قيد التشغيل، حاول مرة أخرى", "فشل الطلب"],
  fr: ["Connexion", "S'inscrire", "E-mail", "Mot de passe", "Confirmer le mot de passe", "Saisissez votre e-mail", "Saisissez votre mot de passe", "Saisissez à nouveau le mot de passe", "Se souvenir du compte", "Mot de passe oublié ?", "Connectez-vous pour continuer à trader", "Créez votre compte", "Inscrivez-vous en moins d'une minute", "Pas de compte ?", "Déjà un compte ?", "Continuer en tant qu'invité", "Besoin d'aide ? Contactez le service client", "Saisissez une adresse e-mail valide", "Le mot de passe doit contenir au moins 6 caractères", "Les mots de passe ne correspondent pas", "Faible", "Moyen", "Fort", "Veuillez patienter...", "Mot de passe oublié", "Contactez le service client pour réinitialiser votre mot de passe.", "Cet e-mail est déjà enregistré", "Compte introuvable", "Mot de passe incorrect", "Erreur réseau. Le serveur démarre peut-être, réessayez", "Échec de la requête"],
  es: ["Iniciar sesión", "Registrarse", "Correo electrónico", "Contraseña", "Confirmar contraseña", "Ingrese su correo electrónico", "Ingrese su contraseña", "Vuelva a ingresar la contraseña", "Recordar cuenta", "¿Olvidó su contraseña?", "Inicie sesión para seguir operando", "Cree su cuenta", "Regístrese en menos de un minuto", "¿No tiene cuenta?", "¿Ya tiene una cuenta?", "Continuar como invitado", "¿Necesita ayuda? Contacte con atención al cliente", "Ingrese un correo electrónico válido", "La contraseña debe tener al menos 6 caracteres", "Las contraseñas no coinciden", "Débil", "Media", "Fuerte", "Espere por favor...", "Contraseña olvidada", "Contacte con atención al cliente para restablecer su contraseña.", "Este correo ya está registrado", "Cuenta no encontrada", "Contraseña incorrecta", "Error de red. El servidor puede estar iniciando, intente de nuevo", "La solicitud falló"],
  de: ["Anmelden", "Registrieren", "E-Mail", "Passwort", "Passwort bestätigen", "E-Mail eingeben", "Passwort eingeben", "Passwort erneut eingeben", "Konto merken", "Passwort vergessen?", "Melden Sie sich an, um weiter zu handeln", "Konto erstellen", "In weniger als einer Minute registrieren", "Noch kein Konto?", "Bereits ein Konto?", "Als Gast fortfahren", "Hilfe nötig? Kontaktieren Sie den Kundenservice", "Gültige E-Mail-Adresse eingeben", "Das Passwort muss mindestens 6 Zeichen haben", "Passwörter stimmen nicht überein", "Schwach", "Mittel", "Stark", "Bitte warten...", "Passwort vergessen", "Kontaktieren Sie den Kundenservice, um Ihr Passwort zurückzusetzen.", "Diese E-Mail ist bereits registriert", "Konto nicht gefunden", "Falsches Passwort", "Netzwerkfehler. Der Server startet möglicherweise, versuchen Sie es erneut", "Anfrage fehlgeschlagen"],
  pt: ["Entrar", "Registrar", "E-mail", "Senha", "Confirmar senha", "Digite seu e-mail", "Digite sua senha", "Digite a senha novamente", "Lembrar conta", "Esqueceu a senha?", "Entre para continuar negociando", "Crie sua conta", "Registre-se em menos de um minuto", "Não tem uma conta?", "Já tem uma conta?", "Continuar como convidado", "Precisa de ajuda? Fale com o atendimento", "Digite um e-mail válido", "A senha deve ter pelo menos 6 caracteres", "As senhas não coincidem", "Fraca", "Média", "Forte", "Aguarde...", "Esqueci a senha", "Fale com o atendimento para redefinir sua senha.", "Este e-mail já está registrado", "Conta não encontrada", "Senha incorreta", "Erro de rede. O servidor pode estar iniciando, tente novamente", "Falha na solicitação"],
  ru: ["Войти", "Регистрация", "Эл. почта", "Пароль", "Подтвердите пароль", "Введите вашу почту", "Введите пароль", "Повторите пароль", "Запомнить аккаунт", "Забыли пароль?", "Войдите, чтобы продолжить торговлю", "Создайте аккаунт", "Регистрация меньше чем за минуту", "Нет аккаунта?", "Уже есть аккаунт?", "Продолжить как гость", "Нужна помощь? Свяжитесь с поддержкой", "Введите корректный адрес почты", "Пароль должен содержать не менее 6 символов", "Пароли не совпадают", "Слабый", "Средний", "Надёжный", "Подождите...", "Забыли пароль", "Свяжитесь с поддержкой для сброса пароля.", "Эта почта уже зарегистрирована", "Аккаунт не найден", "Неверный пароль", "Ошибка сети. Сервер может запускаться, повторите попытку", "Запрос не выполнен"],
  tr: ["Giriş yap", "Kayıt ol", "E-posta", "Şifre", "Şifreyi onayla", "E-postanızı girin", "Şifrenizi girin", "Şifrenizi tekrar girin", "Hesabı hatırla", "Şifreni mi unuttun?", "İşleme devam etmek için giriş yapın", "Hesabınızı oluşturun", "Bir dakikadan kısa sürede kayıt olun", "Hesabınız yok mu?", "Zaten hesabınız var mı?", "Misafir olarak devam et", "Yardım mı lazım? Müşteri hizmetleriyle iletişime geçin", "Geçerli bir e-posta girin", "Şifre en az 6 karakter olmalı", "Şifreler eşleşmiyor", "Zayıf", "Orta", "Güçlü", "Lütfen bekleyin...", "Şifremi unuttum", "Şifrenizi sıfırlamak için müşteri hizmetleriyle iletişime geçin.", "Bu e-posta zaten kayıtlı", "Hesap bulunamadı", "Yanlış şifre", "Ağ hatası. Sunucu uyanıyor olabilir, tekrar deneyin", "İstek başarısız"],
  zh: ["登录", "注册", "邮箱", "密码", "确认密码", "请输入邮箱", "请输入密码", "请再次输入密码", "记住账号", "忘记密码？", "登录以继续交易", "创建账号", "不到一分钟即可注册", "没有账号？", "已有账号？", "游客模式继续", "需要帮助？联系客服", "请输入有效的邮箱", "密码至少6位", "两次密码不一致", "弱", "中", "强", "请稍候...", "忘记密码", "请联系客服重置密码。", "该邮箱已注册", "账号不存在", "密码错误", "网络错误，服务器可能正在启动，请重试", "请求失败"],
  zhT: ["登入", "註冊", "電子郵件", "密碼", "確認密碼", "請輸入電子郵件", "請輸入密碼", "請再次輸入密碼", "記住帳號", "忘記密碼？", "登入以繼續交易", "建立帳號", "不到一分鐘即可註冊", "沒有帳號？", "已有帳號？", "以訪客身分繼續", "需要協助？聯絡客服", "請輸入有效的電子郵件", "密碼至少6位", "兩次密碼不一致", "弱", "中", "強", "請稍候...", "忘記密碼", "請聯絡客服重設密碼。", "此電子郵件已註冊", "帳號不存在", "密碼錯誤", "網路錯誤，伺服器可能正在啟動，請重試", "請求失敗"],
  ja: ["ログイン", "新規登録", "メール", "パスワード", "パスワード確認", "メールアドレスを入力", "パスワードを入力", "パスワードをもう一度入力", "アカウントを記憶", "パスワードをお忘れですか？", "ログインして取引を続ける", "アカウント作成", "1分以内に登録", "アカウントをお持ちでないですか？", "すでにアカウントをお持ちですか？", "ゲストとして続行", "お困りですか？カスタマーサービスへ", "有効なメールアドレスを入力", "パスワードは6文字以上必要です", "パスワードが一致しません", "弱い", "普通", "強い", "お待ちください...", "パスワードを忘れた", "パスワードのリセットはカスタマーサービスへご連絡ください。", "このメールは既に登録されています", "アカウントが見つかりません", "パスワードが違います", "ネットワークエラー。サーバー起動中の可能性があります。再試行してください", "リクエストに失敗しました"],
  ko: ["로그인", "회원가입", "이메일", "비밀번호", "비밀번호 확인", "이메일을 입력하세요", "비밀번호를 입력하세요", "비밀번호를 다시 입력하세요", "계정 기억하기", "비밀번호를 잊으셨나요?", "로그인하고 거래를 계속하세요", "계정 만들기", "1분 이내에 가입", "계정이 없으신가요?", "이미 계정이 있으신가요?", "게스트로 계속", "도움이 필요하세요? 고객센터에 문의하세요", "올바른 이메일을 입력하세요", "비밀번호는 6자 이상이어야 합니다", "비밀번호가 일치하지 않습니다", "약함", "보통", "강함", "잠시만 기다려 주세요...", "비밀번호 찾기", "비밀번호 재설정은 고객센터에 문의하세요.", "이미 등록된 이메일입니다", "계정을 찾을 수 없습니다", "비밀번호가 틀렸습니다", "네트워크 오류. 서버가 시작 중일 수 있습니다. 다시 시도하세요", "요청 실패"],
  id: ["Masuk", "Daftar", "Email", "Kata sandi", "Konfirmasi kata sandi", "Masukkan email Anda", "Masukkan kata sandi", "Masukkan ulang kata sandi", "Ingat akun", "Lupa kata sandi?", "Masuk untuk melanjutkan trading", "Buat akun Anda", "Daftar dalam kurang dari semenit", "Belum punya akun?", "Sudah punya akun?", "Lanjutkan sebagai tamu", "Butuh bantuan? Hubungi layanan pelanggan", "Masukkan email yang valid", "Kata sandi minimal 6 karakter", "Kata sandi tidak cocok", "Lemah", "Sedang", "Kuat", "Harap tunggu...", "Lupa kata sandi", "Hubungi layanan pelanggan untuk mengatur ulang kata sandi.", "Email ini sudah terdaftar", "Akun tidak ditemukan", "Kata sandi salah", "Kesalahan jaringan. Server mungkin sedang menyala, coba lagi", "Permintaan gagal"],
  ms: ["Log masuk", "Daftar", "E-mel", "Kata laluan", "Sahkan kata laluan", "Masukkan e-mel anda", "Masukkan kata laluan", "Masukkan semula kata laluan", "Ingat akaun", "Lupa kata laluan?", "Log masuk untuk terus berdagang", "Cipta akaun anda", "Daftar dalam masa kurang seminit", "Tiada akaun?", "Sudah ada akaun?", "Teruskan sebagai tetamu", "Perlukan bantuan? Hubungi khidmat pelanggan", "Masukkan e-mel yang sah", "Kata laluan mesti sekurang-kurangnya 6 aksara", "Kata laluan tidak sepadan", "Lemah", "Sederhana", "Kuat", "Sila tunggu...", "Lupa kata laluan", "Hubungi khidmat pelanggan untuk menetapkan semula kata laluan.", "E-mel ini sudah didaftarkan", "Akaun tidak dijumpai", "Kata laluan salah", "Ralat rangkaian. Pelayan mungkin sedang bermula, cuba lagi", "Permintaan gagal"],
  vi: ["Đăng nhập", "Đăng ký", "Email", "Mật khẩu", "Xác nhận mật khẩu", "Nhập email của bạn", "Nhập mật khẩu", "Nhập lại mật khẩu", "Ghi nhớ tài khoản", "Quên mật khẩu?", "Đăng nhập để tiếp tục giao dịch", "Tạo tài khoản", "Đăng ký trong chưa đến một phút", "Chưa có tài khoản?", "Đã có tài khoản?", "Tiếp tục với tư cách khách", "Cần trợ giúp? Liên hệ chăm sóc khách hàng", "Nhập email hợp lệ", "Mật khẩu phải có ít nhất 6 ký tự", "Mật khẩu không khớp", "Yếu", "Trung bình", "Mạnh", "Vui lòng đợi...", "Quên mật khẩu", "Vui lòng liên hệ chăm sóc khách hàng để đặt lại mật khẩu.", "Email này đã được đăng ký", "Không tìm thấy tài khoản", "Sai mật khẩu", "Lỗi mạng. Máy chủ có thể đang khởi động, hãy thử lại", "Yêu cầu thất bại"],
  th: ["เข้าสู่ระบบ", "ลงทะเบียน", "อีเมล", "รหัสผ่าน", "ยืนยันรหัสผ่าน", "กรอกอีเมลของคุณ", "กรอกรหัสผ่าน", "กรอกรหัสผ่านอีกครั้ง", "จดจำบัญชี", "ลืมรหัสผ่าน?", "เข้าสู่ระบบเพื่อเทรดต่อ", "สร้างบัญชีของคุณ", "ลงทะเบียนในเวลาไม่ถึงนาที", "ยังไม่มีบัญชี?", "มีบัญชีอยู่แล้ว?", "ดำเนินการต่อในฐานะผู้เยี่ยมชม", "ต้องการความช่วยเหลือ? ติดต่อฝ่ายบริการลูกค้า", "กรอกอีเมลที่ถูกต้อง", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", "รหัสผ่านไม่ตรงกัน", "อ่อน", "ปานกลาง", "แข็งแรง", "กรุณารอสักครู่...", "ลืมรหัสผ่าน", "โปรดติดต่อฝ่ายบริการลูกค้าเพื่อรีเซ็ตรหัสผ่าน", "อีเมลนี้ลงทะเบียนแล้ว", "ไม่พบบัญชี", "รหัสผ่านไม่ถูกต้อง", "เครือข่ายขัดข้อง เซิร์ฟเวอร์อาจกำลังเริ่มทำงาน ลองอีกครั้ง", "คำขอล้มเหลว"],
  it: ["Accedi", "Registrati", "Email", "Password", "Conferma password", "Inserisci la tua email", "Inserisci la password", "Reinserisci la password", "Ricorda account", "Password dimenticata?", "Accedi per continuare a fare trading", "Crea il tuo account", "Registrati in meno di un minuto", "Non hai un account?", "Hai già un account?", "Continua come ospite", "Serve aiuto? Contatta l'assistenza clienti", "Inserisci un indirizzo email valido", "La password deve avere almeno 6 caratteri", "Le password non coincidono", "Debole", "Media", "Forte", "Attendere...", "Password dimenticata", "Contatta l'assistenza clienti per reimpostare la password.", "Questa email è già registrata", "Account non trovato", "Password errata", "Errore di rete. Il server potrebbe essere in avvio, riprova", "Richiesta non riuscita"],
  el: ["Σύνδεση", "Εγγραφή", "Email", "Κωδικός", "Επιβεβαίωση κωδικού", "Εισάγετε το email σας", "Εισάγετε τον κωδικό σας", "Εισάγετε ξανά τον κωδικό", "Απομνημόνευση λογαριασμού", "Ξεχάσατε τον κωδικό;", "Συνδεθείτε για να συνεχίσετε τις συναλλαγές", "Δημιουργήστε λογαριασμό", "Εγγραφή σε λιγότερο από ένα λεπτό", "Δεν έχετε λογαριασμό;", "Έχετε ήδη λογαριασμό;", "Συνέχεια ως επισκέπτης", "Χρειάζεστε βοήθεια; Επικοινωνήστε με την εξυπηρέτηση", "Εισάγετε έγκυρο email", "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες", "Οι κωδικοί δεν ταιριάζουν", "Αδύναμος", "Μέτριος", "Ισχυρός", "Παρακαλώ περιμένετε...", "Ξεχάσατε τον κωδικό", "Επικοινωνήστε με την εξυπηρέτηση για επαναφορά κωδικού.", "Αυτό το email είναι ήδη καταχωρισμένο", "Ο λογαριασμός δεν βρέθηκε", "Λάθος κωδικός", "Σφάλμα δικτύου. Ο διακομιστής ίσως ξεκινά, δοκιμάστε ξανά", "Το αίτημα απέτυχε"],
  fa: ["ورود", "ثبت‌نام", "ایمیل", "رمز عبور", "تکرار رمز عبور", "ایمیل خود را وارد کنید", "رمز عبور را وارد کنید", "رمز عبور را دوباره وارد کنید", "به خاطر سپردن حساب", "رمز عبور را فراموش کرده‌اید؟", "برای ادامه معامله وارد شوید", "حساب خود را بسازید", "ثبت‌نام در کمتر از یک دقیقه", "حساب ندارید؟", "قبلاً حساب دارید؟", "ادامه به‌عنوان مهمان", "کمک می‌خواهید؟ با پشتیبانی تماس بگیرید", "ایمیل معتبر وارد کنید", "رمز عبور باید حداقل ۶ نویسه باشد", "رمزهای عبور مطابقت ندارند", "ضعیف", "متوسط", "قوی", "لطفاً صبر کنید...", "فراموشی رمز عبور", "برای بازنشانی رمز عبور با پشتیبانی تماس بگیرید.", "این ایمیل قبلاً ثبت شده است", "حساب یافت نشد", "رمز عبور اشتباه است", "خطای شبکه. ممکن است سرور در حال راه‌اندازی باشد، دوباره تلاش کنید", "درخواست ناموفق بود"],
  la: ["Intrare", "Subscribere", "Epistula", "Tessera", "Tesseram confirma", "Epistulam tuam inscribe", "Tesseram inscribe", "Tesseram iterum inscribe", "Rationem memento", "Tesseram oblitus es?", "Intra ut mercaturam continues", "Rationem tuam crea", "Subscribe in minus quam minuto", "Rationem non habes?", "Iam rationem habes?", "Ut hospes perge", "Auxilio eges? Ministerium clientium appella", "Epistulam validam inscribe", "Tessera saltem sex notas habere debet", "Tesserae non congruunt", "Infirma", "Mediocris", "Firma", "Exspecta...", "Tesseram oblitus", "Ministerium clientium appella ut tesseram restituas.", "Haec epistula iam subscripta est", "Ratio non inventa", "Tessera falsa", "Error retis. Servitor forsitan incipit, iterum conare", "Petitio defecit"],
  ro: ["Autentificare", "Înregistrare", "E-mail", "Parolă", "Confirmă parola", "Introdu e-mailul", "Introdu parola", "Reintrodu parola", "Ține minte contul", "Ai uitat parola?", "Autentifică-te pentru a continua tranzacționarea", "Creează-ți contul", "Înregistrează-te în mai puțin de un minut", "Nu ai cont?", "Ai deja un cont?", "Continuă ca oaspete", "Ai nevoie de ajutor? Contactează serviciul clienți", "Introdu un e-mail valid", "Parola trebuie să aibă cel puțin 6 caractere", "Parolele nu se potrivesc", "Slabă", "Medie", "Puternică", "Te rugăm să aștepți...", "Parolă uitată", "Contactează serviciul clienți pentru resetarea parolei.", "Acest e-mail este deja înregistrat", "Contul nu a fost găsit", "Parolă greșită", "Eroare de rețea. Serverul poate porni, încearcă din nou", "Cererea a eșuat"],
  sv: ["Logga in", "Registrera", "E-post", "Lösenord", "Bekräfta lösenord", "Ange din e-post", "Ange ditt lösenord", "Ange lösenordet igen", "Kom ihåg konto", "Glömt lösenord?", "Logga in för att fortsätta handla", "Skapa ditt konto", "Registrera dig på under en minut", "Har du inget konto?", "Har du redan ett konto?", "Fortsätt som gäst", "Behöver du hjälp? Kontakta kundtjänst", "Ange en giltig e-postadress", "Lösenordet måste vara minst 6 tecken", "Lösenorden matchar inte", "Svagt", "Medel", "Starkt", "Vänta...", "Glömt lösenord", "Kontakta kundtjänst för att återställa lösenordet.", "Den här e-postadressen är redan registrerad", "Kontot hittades inte", "Fel lösenord", "Nätverksfel. Servern kanske startar, försök igen", "Begäran misslyckades"],
  ht: ["Konekte", "Enskri", "Imèl", "Modpas", "Konfime modpas", "Antre imèl ou", "Antre modpas ou", "Antre modpas la ankò", "Sonje kont", "Ou bliye modpas?", "Konekte pou kontinye fè komès", "Kreye kont ou", "Enskri nan mwens pase yon minit", "Ou pa gen kont?", "Ou deja gen yon kont?", "Kontinye kòm envite", "Bezwen èd? Kontakte sèvis kliyan", "Antre yon imèl ki valab", "Modpas la dwe gen omwen 6 karaktè", "Modpas yo pa menm", "Fèb", "Mwayen", "Fò", "Tanpri tann...", "Bliye modpas", "Kontakte sèvis kliyan pou reyajiste modpas ou.", "Imèl sa a deja enskri", "Kont pa jwenn", "Move modpas", "Erè rezo. Sèvè a ka ap leve, eseye ankò", "Demann lan echwe"],
};

const AUTH = {};
Object.keys(RAW).forEach((l) => {
  AUTH[l] = {};
  KEYS.forEach((k, i) => {
    if (RAW[l][i] != null) AUTH[l][k] = RAW[l][i];
  });
});

/* অনুবাদ: নিজের তালিকা → ইংরেজি → Home.jsx-এর t() */
const useTr = () => {
  const { lang, t } = useContext(LangCtx);
  return (k) => (AUTH[lang] && AUTH[lang][k]) ?? AUTH.en[k] ?? t(k);
};

/* ---------- PAGE CSS FIXES (নীল বক্স / ফোকাস / autofill) ---------- */

const AUTH_CSS = `
.cx-au,.cx-au *{-webkit-tap-highlight-color:transparent}
.cx-au button,.cx-au label,.cx-au h1,.cx-au p,.cx-au span{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.cx-au input{-webkit-user-select:text;user-select:text}
.cx-au button:focus,.cx-au button:focus-visible,
.cx-au .cx-fw input:focus,.cx-au .cx-fw input:focus-visible{outline:none!important;box-shadow:none}
.cx-au .cx-lgback{background:transparent}
.cx-au .cx-fw{cursor:text}
.cx-au .cx-fw input:-webkit-autofill,
.cx-au .cx-fw input:-webkit-autofill:hover,
.cx-au .cx-fw input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px #fafbfe inset!important;-webkit-text-fill-color:#111!important;transition:background-color 9999s ease-in-out 0s}
.cx.dark .cx-au .cx-fw input:-webkit-autofill,
.cx.dark .cx-au .cx-fw input:-webkit-autofill:hover,
.cx.dark .cx-au .cx-fw input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px #101c30 inset!important;-webkit-text-fill-color:#e8ecf3!important}
.cx-au ::selection{background:rgba(31,122,203,.22)}
`;

/* ---------- ICONS ---------- */

const MailI = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd">
    <path d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm1.6 2L12 12.4 19.4 7z" />
  </svg>
);

const EyeI = ({ off }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d={ICON.eye} />
    {off && (
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
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

function Field({ label, icon, type = "text", value, onChange, onKeyDown, auto, placeholder, err }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const isPw = type === "password";

  return (
    <div className="cx-fd">
      <label onClick={() => ref.current && ref.current.focus()}>{label}</label>

      <div
        className={"cx-fw" + (err ? " err" : "")}
        onClick={() => ref.current && ref.current.focus()}
      >
        <span className="cx-fi">{icon}</span>

        <input
          ref={ref}
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
            onClick={(e) => {
              e.stopPropagation();
              setShow(!show);
            }}
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
/* Support sheet state is owned by the parent page (cs / setCs) */

function Shell({ title, sub, onBack, lang, setLang, children, cs, setCs }) {
  const tr = useTr();

  return (
    <div className="cx-pg cx-au">
      <style>{AUTH_CSS}</style>

      <div className="cx-pt">
        <button type="button" onClick={onBack} aria-label="Back">
          ‹
        </button>

        <div className="cx-pt2">
          {setLang && (
            <div style={{ position: "relative", zIndex: 60 }}>
              <LangPicker lang={lang} setLang={setLang} />
            </div>
          )}

          <button type="button" onClick={() => setCs(true)} aria-label="Customer Support">
            <Ic d={ICON.headset} s={26} />
          </button>
        </div>
      </div>

      <div className="cx-hero">
        <Logo />
        <h1 className="cx-cap">{title}</h1>
        <p>{sub}</p>
      </div>

      <div className="cx-pcard">{children}</div>

      <button type="button" className="cx-pcs" onClick={() => setCs(true)}>
        <Ic d={ICON.headset} s={20} />
        {tr("csHelp")}
      </button>

      <CSheet open={cs} onClose={() => setCs(false)} />
    </div>
  );
}

/* ================= LOGIN PAGE ================= */

export function Login({ onLogin, lang, setLang, go, flash = "" }) {
  const tr = useTr();
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const rem0 = store.get("cx_rem", "");

  const [email, setEmail] = useState(rem0);
  const [pw, setPw] = useState("");
  const [rem, setRem] = useState(!!rem0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: flash, ok: true });
  const [errs, setErrs] = useState({}); /* এখানে শুধু কী (key) থাকে, দেখানোর সময় অনুবাদ হয় */
  const [cs, setCs] = useState(false);

  const mail = email.trim().toLowerCase();

  /* ---------- LOGIN ---------- */

  const login = async () => {
    if (busy) return;

    const e = {};
    if (!EMAIL_RE.test(mail)) e.email = "bEmail";
    if (!pw) e.pw = "pw";

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
        body: { email: mail, password: pw },
      });

      store.set("cx_rem", rem ? mail : "");

      await onLogin(r);
    } catch (er) {
      if (alive.current) setMsg({ k: er.message || "err", ok: false });
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const enter = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <Shell
      title={tr("login")}
      sub={tr("welcomeSub")}
      onBack={() => go("app")}
      lang={lang}
      setLang={setLang}
      cs={cs}
      setCs={setCs}
    >
      <Field
        label={tr("email")}
        icon={<MailI />}
        type="email"
        auto="username"
        placeholder={tr("acc")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        err={errs.email ? tr(errs.email) : ""}
      />

      <Field
        label={tr("pwLbl")}
        icon={<Ic d={ICON.lock} s={20} />}
        type="password"
        auto="current-password"
        placeholder={tr("pw")}
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={enter}
        err={errs.pw ? tr(errs.pw) : ""}
      />

      <div className="cx-prow">
        <label className="cx-rm">
          <input type="checkbox" checked={rem} onChange={(e) => setRem(e.target.checked)} />
          {tr("rem")}
        </label>

        <button type="button" className="cx-plink" onClick={() => setCs(true)}>
          {tr("forgot")}
        </button>
      </div>

      {msg.k && <p className={"cx-msg" + (msg.ok ? "" : " bad")}>{tr(msg.k)}</p>}

      <button
        type="button"
        className="cx-pbtn cx-cap"
        style={{ opacity: busy ? 0.6 : 1 }}
        onClick={login}
        disabled={busy}
      >
        {busy ? tr("wait2") : tr("login")}
      </button>

      <div className="cx-pdiv">
        <span />
      </div>

      <p className="cx-pfoot">
        {tr("noAcc")}{" "}
        <button type="button" className="cx-plink cx-cap" onClick={() => go("register")}>
          {tr("register")}
        </button>
      </p>

      <button type="button" className="cx-pghost" onClick={() => go("app")}>
        {tr("guest")}
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

/* ================= REGISTER / FORGOT PAGE ================= */

export function Register({ mode = "register", onLogin, go, lang, setLang }) {
  const tr = useTr();
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false });
  const [errs, setErrs] = useState({});
  const [cs, setCs] = useState(mode === "forgot");

  const mail = email.trim().toLowerCase();
  const st = strength(pw);

  /* ---------- FORGOT MODE → Customer Support ---------- */

  if (mode === "forgot") {
    return (
      <Shell
        title={tr("forgotTitle")}
        sub={tr("forgotSub")}
        onBack={() => go("login")}
        lang={lang}
        setLang={setLang}
        cs={cs}
        setCs={setCs}
      >
        <button type="button" className="cx-pbtn" onClick={() => setCs(true)}>
          {tr("csHelp")}
        </button>

        <button type="button" className="cx-pghost" onClick={() => go("login")}>
          {tr("login")}
        </button>
      </Shell>
    );
  }

  /* ---------- REGISTER ---------- */

  const run = async () => {
    if (busy) return;

    const e = {};
    if (!EMAIL_RE.test(mail)) e.email = "bEmail";
    if (pw.length < 6) e.pw = "bPw";
    if (pw2 !== pw) e.pw2 = "bMatch";

    setErrs(e);

    if (Object.keys(e).length) {
      setMsg({ k: "", ok: false });
      return;
    }

    setBusy(true);
    setMsg({ k: "wait2", ok: true });

    try {
      const r = await api("/auth/register", {
        method: "POST",
        body: { email: mail, password: pw, password2: pw2 },
      });

      await onLogin(r);
    } catch (er) {
      if (alive.current) setMsg({ k: er.message || "err", ok: false });
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const enter = (e) => {
    if (e.key === "Enter") run();
  };

  return (
    <Shell
      title={tr("createAcc")}
      sub={tr("createSub")}
      onBack={() => go("login")}
      lang={lang}
      setLang={setLang}
      cs={cs}
      setCs={setCs}
    >
      <Field
        label={tr("email")}
        icon={<MailI />}
        type="email"
        auto="username"
        placeholder={tr("acc")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        err={errs.email ? tr(errs.email) : ""}
      />

      <Field
        label={tr("pwLbl")}
        icon={<Ic d={ICON.lock} s={20} />}
        type="password"
        auto="new-password"
        placeholder={tr("pw")}
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        err={errs.pw ? tr(errs.pw) : ""}
      />

      {pw && (
        <div className="cx-str">
          <div>
            {[1, 2, 3].map((n) => (
              <i key={n} className={n <= st ? "on s" + st : ""} />
            ))}
          </div>

          <span className={"s" + st}>{tr(["", "strWeak", "strMid", "strStrong"][st])}</span>
        </div>
      )}

      <Field
        label={tr("pw2Lbl")}
        icon={<Ic d={ICON.lock} s={20} />}
        type="password"
        auto="new-password"
        placeholder={tr("pw2")}
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
        onKeyDown={enter}
        err={errs.pw2 ? tr(errs.pw2) : ""}
      />

      {msg.k && <p className={"cx-msg" + (msg.ok ? "" : " bad")}>{tr(msg.k)}</p>}

      <button
        type="button"
        className="cx-pbtn cx-cap"
        style={{ opacity: busy ? 0.6 : 1 }}
        onClick={run}
        disabled={busy}
      >
        {busy ? tr("wait2") : tr("register")}
      </button>

      <div className="cx-pdiv">
        <span />
      </div>

      <p className="cx-pfoot">
        {tr("haveAcc")}{" "}
        <button type="button" className="cx-plink cx-cap" onClick={() => go("login")}>
          {tr("login")}
        </button>
      </p>
    </Shell>
  );
}

export default Login;
