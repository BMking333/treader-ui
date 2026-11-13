import React, { createContext, useContext, useEffect, useState } from "react";

/* ====== BACKEND URL (এখানে বদলান) ====== */
export const API = "https://tread-d84x.onrender.com";

export const BLUE = "#1f7acb", GREEN = "#00c087", RED = "#d84d5a";
export const CUP = "#0ecb81", CDN = "#f6465d";
export const COINS = ["BTC", "ETH", "DOGE", "BCH", "LTC", "TRX", "SHIB", "ADA", "BSV", "ICP", "XRP", "ETC"];
export const COL = { BTC: "#f7931a", ETH: "#627eea", DOGE: "#c2a633", BCH: "#8dc351", LTC: "#345d9d", TRX: "#eb0029", SHIB: "#e42d04", ADA: "#2563eb", BSV: "#eab300", ICP: "#7b3fe4", XRP: "#111", ETC: "#328332", USDT: "#26a17b", USDC: "#2775ca" };
export const FALL = { BTC: [73618.71, -0.27, 1.4e8], ETH: [2046.75, -1.04, 9e7], DOGE: [0.067128, -1.58, 1e7], BCH: [228.86, -0.97, 16285], LTC: [49.77, -2.43, 164530], TRX: [0.317486, -0.04, 1.7e7], SHIB: [0.00000434, -2.91, 6.9e9], ADA: [0.172924, -1.28, 3.3e7], BSV: [15.8364, -2.52, 177887], ICP: [2.57, 0, 2008], XRP: [1.04406, -1.48, 2.7e7], ETC: [6.6095, -1.69, 124280] };
export const MARKETS = ["USDT", "TRX", "BTC", "ETH", "USDD", "USDC", "NFT"];
export const QTY = [10, 1000, 10000, 1000000], SECS = [20, 30, 70, 90, 180], YIELD = 0.2;
export const ASSET_COINS = ["USDT", "USDC", "ETH", "BTC"];

/* ---------------- Languages ---------------- */
export const LANGS = [
  ["pt", "Português", "🇵🇹"], ["en", "English", "🇺🇸"], ["ar", "عربي", "🇦🇪"], ["fr", "Français", "🇫🇷"],
  ["it", "italiano", "🇮🇹"], ["ja", "日本語", "🇯🇵"], ["ko", "한국인", "🇰🇷"], ["de", "Deutsch", "🇩🇪"],
  ["ru", "Русский", "🇷🇺"], ["vi", "Tiếng Việt", "🇻🇳"], ["tr", "Türkçe", "🇹🇷"], ["es", "español", "🇪🇸"],
  ["fa", "فارسی", "🇮🇷"], ["id", "Indonesia", "🇮🇩"], ["el", "Ελληνικά", "🇬🇷"], ["ms", "Melayu", "🇲🇾"],
  ["th", "แบบไทย", "🇹🇭"], ["la", "Latinus", "🇻🇦"], ["hi", "हिंदी", "🇮🇳"], ["bn", "বাংলা", "🇧🇩"],
  ["ur", "اردو", "🇵🇰"], ["zhT", "繁体中文", "🇭🇰"], ["zh", "简体中文", "🇨🇳"], ["ro", "România", "🇷🇴"],
  ["sv", "Svenska", "🇸🇪"], ["ht", "Creole", "🇸🇨"],
];
export const RTL = ["ar", "fa", "ur"];

export const T = {
  en: { home: "Home", market: "Market", trade: "Trade", options: "Options", assets: "Assets", rech: "Recharge", wd: "Withdraw", cs: "Customer service", swap: "Flash swap", loan: "Boost loan", tf: "Transfer", chg: "Chg%", name: "Name", lp: "Latest price", nodata: "No data", buy: "Buy", sell: "Sell", limit: "Limit price", price: "Price", qty: "Quantity", avail: "Available", amt: "Trade amount", eAmt: "Enter trade amount", eQty: "Enter quantity", iU: "Insufficient USDT balance", iC: "Insufficient", ok: "Order filled (demo)", entrust: "Current entrust", all: "All", spot: "Spot trading", pos: "Positions", hi: "High", lo: "Low", vol: "24H volume", bl: "Buy Long", ss: "Sell Short", time: "Time", mode: "Transaction mode", oq: "Opening quantity", ot: "Opening time", bal: "Account balance", yld: "Estimated Yield", openMsg: "Position opened (demo)", badQ: "Opening quantity: 10.00 - 1000000.00", iB: "Insufficient balance", ta: "Total assets", funds: "Funds", quant: "Quant trading", conv: "converted", frozen: "Frozen", cv: "Converted($)", top: "Demo top-up", add: "Add", ua: "USDT amount", closed: "{n} position(s) closed · {w} win, {l} loss (demo)" },
  bn: { home: "হোম", market: "মার্কেট", trade: "ট্রেড", options: "অপশন", assets: "অ্যাসেট", rech: "রিচার্জ", wd: "উইথড্র", cs: "কাস্টমার সার্ভিস", swap: "ফ্ল্যাশ সোয়াপ", loan: "বুস্ট লোন", tf: "ট্রান্সফার", chg: "পরিবর্তন%", name: "নাম", lp: "সর্বশেষ দাম", nodata: "কোনো ডেটা নেই", buy: "কিনুন", sell: "বিক্রি", limit: "লিমিট প্রাইস", price: "দাম", qty: "পরিমাণ", avail: "উপলব্ধ", amt: "ট্রেড অ্যামাউন্ট", eAmt: "ট্রেড অ্যামাউন্ট দিন", eQty: "পরিমাণ দিন", iU: "USDT ব্যালেন্স অপর্যাপ্ত", iC: "অপর্যাপ্ত", ok: "অর্ডার সম্পন্ন (ডেমো)", entrust: "বর্তমান অর্ডার", all: "সব", spot: "স্পট ট্রেডিং", pos: "পজিশন", hi: "সর্বোচ্চ", lo: "সর্বনিম্ন", vol: "২৪ ঘণ্টার ভলিউম", bl: "বাই লং", ss: "সেল শর্ট", time: "সময়", mode: "লেনদেন মোড", oq: "ওপেনিং পরিমাণ", ot: "ওপেনিং সময়", bal: "অ্যাকাউন্ট ব্যালেন্স", yld: "আনুমানিক ইল্ড", openMsg: "পজিশন খোলা হয়েছে (ডেমো)", badQ: "ওপেনিং পরিমাণ: 10.00 - 1000000.00", iB: "ব্যালেন্স অপর্যাপ্ত", ta: "মোট অ্যাসেট", funds: "ফান্ডস", quant: "কোয়ান্ট ট্রেডিং", conv: "রূপান্তরিত", frozen: "ফ্রোজেন", cv: "রূপান্তরিত($)", top: "ডেমো টপ-আপ", add: "যোগ করুন", ua: "USDT পরিমাণ", closed: "{n}টি পজিশন বন্ধ · {w} জয়, {l} হার (ডেমো)" },
  hi: { home: "होम", market: "बाज़ार", trade: "ट्रेड", options: "ऑप्शन", assets: "एसेट्स", rech: "रिचार्ज", wd: "निकासी", cs: "ग्राहक सेवा", swap: "फ्लैश स्वैप", loan: "बूस्ट लोन", tf: "ट्रांसफर", chg: "बदलाव%", name: "नाम", lp: "ताज़ा कीमत", nodata: "कोई डेटा नहीं", buy: "खरीदें", sell: "बेचें", limit: "लिमिट कीमत", price: "कीमत", qty: "मात्रा", avail: "उपलब्ध", amt: "ट्रेड राशि", eAmt: "ट्रेड राशि दर्ज करें", eQty: "मात्रा दर्ज करें", iU: "USDT बैलेंस अपर्याप्त", iC: "अपर्याप्त", ok: "ऑर्डर पूरा (डेमो)", entrust: "वर्तमान ऑर्डर", all: "सभी", spot: "स्पॉट ट्रेडिंग", pos: "पोज़िशन", hi: "उच्चतम", lo: "न्यूनतम", vol: "24 घंटे वॉल्यूम", bl: "बाय लॉन्ग", ss: "सेल शॉर्ट", time: "समय", mode: "लेनदेन मोड", oq: "ओपनिंग मात्रा", ot: "ओपनिंग समय", bal: "खाता बैलेंस", yld: "अनुमानित यील्ड", openMsg: "पोज़िशन खुली (डेमो)", badQ: "ओपनिंग मात्रा: 10.00 - 1000000.00", iB: "बैलेंस अपर्याप्त", ta: "कुल एसेट्स", funds: "फंड्स", quant: "क्वांट ट्रेडिंग", conv: "परिवर्तित", frozen: "फ्रोज़न", cv: "परिवर्तित($)", top: "डेमो टॉप-अप", add: "जोड़ें", ua: "USDT राशि", closed: "{n} पोज़िशन बंद · {w} जीत, {l} हार (डेमो)" },
  ur: { home: "ہوم", market: "مارکیٹ", trade: "ٹریڈ", options: "آپشنز", assets: "اثاثے", rech: "ریچارج", wd: "نکالیں", cs: "کسٹمر سروس", swap: "فلیش سوئپ", loan: "بوسٹ لون", tf: "ٹرانسفر", chg: "تبدیلی%", name: "نام", lp: "تازہ قیمت", nodata: "کوئی ڈیٹا نہیں", buy: "خریدیں", sell: "بیچیں", limit: "لمٹ قیمت", price: "قیمت", qty: "مقدار", avail: "دستیاب", amt: "ٹریڈ رقم", eAmt: "ٹریڈ رقم درج کریں", eQty: "مقدار درج کریں", iU: "USDT بیلنس ناکافی", iC: "ناکافی", ok: "آرڈر مکمل (ڈیمو)", entrust: "موجودہ آرڈر", all: "سب", spot: "اسپاٹ ٹریڈنگ", pos: "پوزیشنز", hi: "بلند", lo: "کم", vol: "24 گھنٹے حجم", bl: "بائے لانگ", ss: "سیل شارٹ", time: "وقت", mode: "لین دین موڈ", oq: "اوپننگ مقدار", ot: "اوپننگ وقت", bal: "اکاؤنٹ بیلنس", yld: "متوقع منافع", openMsg: "پوزیشن کھل گئی (ڈیمو)", badQ: "اوپننگ مقدار: 10.00 - 1000000.00", iB: "بیلنس ناکافی", ta: "کل اثاثے", funds: "فنڈز", quant: "کوانٹ ٹریڈنگ", conv: "تبدیل شدہ", frozen: "منجمد", cv: "تبدیل شدہ($)", top: "ڈیمو ٹاپ اپ", add: "شامل کریں", ua: "USDT رقم", closed: "{n} پوزیشن بند · {w} جیت، {l} ہار (ڈیمو)" },
  ar: { home: "الرئيسية", market: "السوق", trade: "تداول", options: "الخيارات", assets: "الأصول", rech: "شحن", wd: "سحب", cs: "خدمة العملاء", swap: "تبديل سريع", loan: "قرض معزز", tf: "تحويل", chg: "التغير%", name: "الاسم", lp: "آخر سعر", nodata: "لا توجد بيانات", buy: "شراء", sell: "بيع", limit: "سعر محدد", price: "السعر", qty: "الكمية", avail: "المتاح", amt: "مبلغ التداول", eAmt: "أدخل مبلغ التداول", eQty: "أدخل الكمية", iU: "رصيد USDT غير كاف", iC: "غير كاف", ok: "تم تنفيذ الأمر (تجريبي)", entrust: "الأوامر الحالية", all: "الكل", spot: "التداول الفوري", pos: "المراكز", hi: "الأعلى", lo: "الأدنى", vol: "حجم 24 ساعة", bl: "شراء طويل", ss: "بيع قصير", time: "الوقت", mode: "نمط المعاملة", oq: "كمية الفتح", ot: "وقت الفتح", bal: "رصيد الحساب", yld: "العائد المقدر", openMsg: "تم فتح المركز (تجريبي)", badQ: "كمية الفتح: 10.00 - 1000000.00", iB: "الرصيد غير كاف", ta: "إجمالي الأصول", funds: "الأموال", quant: "التداول الكمي", conv: "المحول", frozen: "مجمد", cv: "المحول($)", top: "شحن تجريبي", add: "إضافة", ua: "مبلغ USDT", closed: "تم إغلاق {n} مركز · {w} ربح، {l} خسارة (تجريبي)" },
  fr: { home: "Accueil", market: "Marché", trade: "Trader", options: "Options", assets: "Actifs", rech: "Recharger", wd: "Retirer", cs: "Service client", swap: "Échange flash", loan: "Prêt boost", tf: "Transfert", chg: "Var%", name: "Nom", lp: "Dernier prix", nodata: "Aucune donnée", buy: "Acheter", sell: "Vendre", limit: "Prix limite", price: "Prix", qty: "Quantité", avail: "Disponible", amt: "Montant", eAmt: "Entrez le montant", eQty: "Entrez la quantité", iU: "Solde USDT insuffisant", iC: "Insuffisant", ok: "Ordre exécuté (démo)", entrust: "Ordre en cours", all: "Tout", spot: "Trading spot", pos: "Positions", hi: "Haut", lo: "Bas", vol: "Volume 24H", bl: "Acheter Long", ss: "Vendre Short", time: "Durée", mode: "Mode de transaction", oq: "Quantité d'ouverture", ot: "Durée d'ouverture", bal: "Solde du compte", yld: "Rendement estimé", openMsg: "Position ouverte (démo)", badQ: "Quantité d'ouverture : 10.00 - 1000000.00", iB: "Solde insuffisant", ta: "Total des actifs", funds: "Fonds", quant: "Trading quantitatif", conv: "converti", frozen: "Gelé", cv: "Converti($)", top: "Recharge démo", add: "Ajouter", ua: "Montant USDT", closed: "{n} position(s) fermée(s) · {w} gain, {l} perte (démo)" },
  es: { home: "Inicio", market: "Mercado", trade: "Operar", options: "Opciones", assets: "Activos", rech: "Recargar", wd: "Retirar", cs: "Atención al cliente", swap: "Swap rápido", loan: "Préstamo boost", tf: "Transferir", chg: "Var%", name: "Nombre", lp: "Último precio", nodata: "Sin datos", buy: "Comprar", sell: "Vender", limit: "Precio límite", price: "Precio", qty: "Cantidad", avail: "Disponible", amt: "Monto", eAmt: "Ingrese el monto", eQty: "Ingrese la cantidad", iU: "Saldo USDT insuficiente", iC: "Insuficiente", ok: "Orden ejecutada (demo)", entrust: "Orden actual", all: "Todo", spot: "Trading spot", pos: "Posiciones", hi: "Máx", lo: "Mín", vol: "Volumen 24H", bl: "Comprar Long", ss: "Vender Short", time: "Tiempo", mode: "Modo de transacción", oq: "Cantidad de apertura", ot: "Tiempo de apertura", bal: "Saldo de cuenta", yld: "Rendimiento estimado", openMsg: "Posición abierta (demo)", badQ: "Cantidad de apertura: 10.00 - 1000000.00", iB: "Saldo insuficiente", ta: "Activos totales", funds: "Fondos", quant: "Trading cuantitativo", conv: "convertido", frozen: "Congelado", cv: "Convertido($)", top: "Recarga demo", add: "Añadir", ua: "Monto USDT", closed: "{n} posición(es) cerrada(s) · {w} ganada, {l} perdida (demo)" },
  de: { home: "Start", market: "Markt", trade: "Handel", options: "Optionen", assets: "Vermögen", rech: "Aufladen", wd: "Auszahlen", cs: "Kundenservice", swap: "Flash-Swap", loan: "Boost-Kredit", tf: "Überweisen", chg: "Änd.%", name: "Name", lp: "Letzter Preis", nodata: "Keine Daten", buy: "Kaufen", sell: "Verkaufen", limit: "Limitpreis", price: "Preis", qty: "Menge", avail: "Verfügbar", amt: "Handelsbetrag", eAmt: "Betrag eingeben", eQty: "Menge eingeben", iU: "USDT-Guthaben unzureichend", iC: "Unzureichend", ok: "Order ausgeführt (Demo)", entrust: "Aktuelle Order", all: "Alle", spot: "Spot-Handel", pos: "Positionen", hi: "Hoch", lo: "Tief", vol: "24H-Volumen", bl: "Long kaufen", ss: "Short verkaufen", time: "Zeit", mode: "Transaktionsmodus", oq: "Eröffnungsmenge", ot: "Eröffnungszeit", bal: "Kontostand", yld: "Geschätzte Rendite", openMsg: "Position eröffnet (Demo)", badQ: "Eröffnungsmenge: 10.00 - 1000000.00", iB: "Guthaben unzureichend", ta: "Gesamtvermögen", funds: "Guthaben", quant: "Quant-Handel", conv: "umgerechnet", frozen: "Gesperrt", cv: "Umgerechnet($)", top: "Demo-Aufladung", add: "Hinzufügen", ua: "USDT-Betrag", closed: "{n} Position(en) geschlossen · {w} Gewinn, {l} Verlust (Demo)" },
  pt: { home: "Início", market: "Mercado", trade: "Negociar", options: "Opções", assets: "Ativos", rech: "Recarregar", wd: "Sacar", cs: "Atendimento", swap: "Troca rápida", loan: "Empréstimo boost", tf: "Transferir", chg: "Var%", name: "Nome", lp: "Último preço", nodata: "Sem dados", buy: "Comprar", sell: "Vender", limit: "Preço limite", price: "Preço", qty: "Quantidade", avail: "Disponível", amt: "Valor", eAmt: "Digite o valor", eQty: "Digite a quantidade", iU: "Saldo USDT insuficiente", iC: "Insuficiente", ok: "Ordem executada (demo)", entrust: "Ordem atual", all: "Todos", spot: "Negociação spot", pos: "Posições", hi: "Máx", lo: "Mín", vol: "Volume 24H", bl: "Comprar Long", ss: "Vender Short", time: "Tempo", mode: "Modo de transação", oq: "Quantidade de abertura", ot: "Tempo de abertura", bal: "Saldo da conta", yld: "Rendimento estimado", openMsg: "Posição aberta (demo)", badQ: "Quantidade de abertura: 10.00 - 1000000.00", iB: "Saldo insuficiente", ta: "Ativos totais", funds: "Fundos", quant: "Negociação quant", conv: "convertido", frozen: "Congelado", cv: "Convertido($)", top: "Recarga demo", add: "Adicionar", ua: "Valor USDT", closed: "{n} posição(ões) fechada(s) · {w} ganho, {l} perda (demo)" },
  ru: { home: "Главная", market: "Рынок", trade: "Торговля", options: "Опционы", assets: "Активы", rech: "Пополнить", wd: "Вывод", cs: "Поддержка", swap: "Быстрый обмен", loan: "Буст-кредит", tf: "Перевод", chg: "Изм.%", name: "Название", lp: "Посл. цена", nodata: "Нет данных", buy: "Купить", sell: "Продать", limit: "Лимитная цена", price: "Цена", qty: "Количество", avail: "Доступно", amt: "Сумма сделки", eAmt: "Введите сумму", eQty: "Введите количество", iU: "Недостаточно USDT", iC: "Недостаточно", ok: "Ордер исполнен (демо)", entrust: "Текущий ордер", all: "Все", spot: "Спот-торговля", pos: "Позиции", hi: "Макс", lo: "Мин", vol: "Объём 24Ч", bl: "Купить Long", ss: "Продать Short", time: "Время", mode: "Режим сделки", oq: "Объём открытия", ot: "Время открытия", bal: "Баланс счёта", yld: "Ожидаемая доходность", openMsg: "Позиция открыта (демо)", badQ: "Объём открытия: 10.00 - 1000000.00", iB: "Недостаточно средств", ta: "Всего активов", funds: "Средства", quant: "Квант-торговля", conv: "пересчитано", frozen: "Заморожено", cv: "Пересчитано($)", top: "Демо-пополнение", add: "Добавить", ua: "Сумма USDT", closed: "Закрыто позиций: {n} · {w} выигрыш, {l} проигрыш (демо)" },
  tr: { home: "Ana Sayfa", market: "Piyasa", trade: "İşlem", options: "Opsiyonlar", assets: "Varlıklar", rech: "Yükle", wd: "Çek", cs: "Müşteri hizmetleri", swap: "Hızlı takas", loan: "Boost kredi", tf: "Transfer", chg: "Değ.%", name: "Ad", lp: "Son fiyat", nodata: "Veri yok", buy: "Al", sell: "Sat", limit: "Limit fiyat", price: "Fiyat", qty: "Miktar", avail: "Kullanılabilir", amt: "İşlem tutarı", eAmt: "Tutar girin", eQty: "Miktar girin", iU: "USDT bakiyesi yetersiz", iC: "Yetersiz", ok: "Emir gerçekleşti (demo)", entrust: "Mevcut emir", all: "Tümü", spot: "Spot işlem", pos: "Pozisyonlar", hi: "Yüksek", lo: "Düşük", vol: "24S hacim", bl: "Long Al", ss: "Short Sat", time: "Süre", mode: "İşlem modu", oq: "Açılış miktarı", ot: "Açılış süresi", bal: "Hesap bakiyesi", yld: "Tahmini getiri", openMsg: "Pozisyon açıldı (demo)", badQ: "Açılış miktarı: 10.00 - 1000000.00", iB: "Bakiye yetersiz", ta: "Toplam varlık", funds: "Fonlar", quant: "Kuant işlem", conv: "dönüştürülen", frozen: "Dondurulmuş", cv: "Dönüştürülen($)", top: "Demo yükleme", add: "Ekle", ua: "USDT tutarı", closed: "{n} pozisyon kapandı · {w} kazanç, {l} kayıp (demo)" },
  zh: { home: "首页", market: "行情", trade: "交易", options: "期权", assets: "资产", rech: "充值", wd: "提现", cs: "客服", swap: "闪兑", loan: "助力贷", tf: "划转", chg: "涨跌幅", name: "名称", lp: "最新价", nodata: "暂无数据", buy: "买入", sell: "卖出", limit: "限价", price: "价格", qty: "数量", avail: "可用", amt: "交易额", eAmt: "请输入交易额", eQty: "请输入数量", iU: "USDT 余额不足", iC: "不足", ok: "委托成交（演示）", entrust: "当前委托", all: "全部", spot: "现货交易", pos: "持仓", hi: "最高", lo: "最低", vol: "24H成交量", bl: "买涨", ss: "买跌", time: "时间", mode: "交易模式", oq: "开仓数量", ot: "开仓时间", bal: "账户余额", yld: "预计收益", openMsg: "开仓成功（演示）", badQ: "开仓数量：10.00 - 1000000.00", iB: "余额不足", ta: "总资产", funds: "资金", quant: "量化交易", conv: "折合", frozen: "冻结", cv: "折合($)", top: "演示充值", add: "添加", ua: "USDT 数量", closed: "{n} 个持仓已平仓 · 盈 {w}，亏 {l}（演示）" },
  ja: { home: "ホーム", market: "マーケット", trade: "取引", options: "オプション", assets: "資産", rech: "入金", wd: "出金", cs: "カスタマーサービス", swap: "フラッシュスワップ", loan: "ブーストローン", tf: "振替", chg: "変動%", name: "名称", lp: "最新価格", nodata: "データなし", buy: "買い", sell: "売り", limit: "指値", price: "価格", qty: "数量", avail: "利用可能", amt: "取引額", eAmt: "取引額を入力", eQty: "数量を入力", iU: "USDT残高不足", iC: "不足", ok: "注文約定（デモ）", entrust: "現在の注文", all: "すべて", spot: "現物取引", pos: "ポジション", hi: "高値", lo: "安値", vol: "24H出来高", bl: "買いロング", ss: "売りショート", time: "時間", mode: "取引モード", oq: "建玉数量", ot: "建玉時間", bal: "口座残高", yld: "想定利回り", openMsg: "ポジションを開きました（デモ）", badQ: "建玉数量：10.00 - 1000000.00", iB: "残高不足", ta: "総資産", funds: "資金", quant: "クオンツ取引", conv: "換算", frozen: "凍結", cv: "換算($)", top: "デモチャージ", add: "追加", ua: "USDT数量", closed: "{n}件決済 · 勝ち{w}、負け{l}（デモ）" },
  id: { home: "Beranda", market: "Pasar", trade: "Trading", options: "Opsi", assets: "Aset", rech: "Isi saldo", wd: "Tarik", cs: "Layanan pelanggan", swap: "Tukar cepat", loan: "Pinjaman boost", tf: "Transfer", chg: "Ubah%", name: "Nama", lp: "Harga terakhir", nodata: "Tidak ada data", buy: "Beli", sell: "Jual", limit: "Harga limit", price: "Harga", qty: "Jumlah", avail: "Tersedia", amt: "Nilai trading", eAmt: "Masukkan nilai", eQty: "Masukkan jumlah", iU: "Saldo USDT tidak cukup", iC: "Tidak cukup", ok: "Order terisi (demo)", entrust: "Order saat ini", all: "Semua", spot: "Trading spot", pos: "Posisi", hi: "Tertinggi", lo: "Terendah", vol: "Volume 24J", bl: "Beli Long", ss: "Jual Short", time: "Waktu", mode: "Mode transaksi", oq: "Jumlah pembukaan", ot: "Waktu pembukaan", bal: "Saldo akun", yld: "Perkiraan imbal hasil", openMsg: "Posisi dibuka (demo)", badQ: "Jumlah pembukaan: 10.00 - 1000000.00", iB: "Saldo tidak cukup", ta: "Total aset", funds: "Dana", quant: "Trading kuantitatif", conv: "dikonversi", frozen: "Dibekukan", cv: "Dikonversi($)", top: "Isi saldo demo", add: "Tambah", ua: "Jumlah USDT", closed: "{n} posisi ditutup · {w} menang, {l} kalah (demo)" },
};

/* ---------------- Side-menu + Options extra texts ---------------- */
export const T2 = {
  en: { rep: "Reputation score", auth: "Authentication", wait: "Awaiting certification", bind: "Bind withdrawal address", share: "My sharing link", smsg: "System message", night: "Night mode", sec: "Security", notset: "Not set", web: "Website Introduction", logout: "Log out", copied: "Sharing link copied", nomsg: "No new messages", demo: "Demo only", out: "Logged out (demo)", pl: "Position list", orec: "Order records", kl: "K-line", pp: "Purchase price", fp: "Filled price", pnl: "Profit/Loss", norec: "No records for now", ind: "Indicators" },
  bn: { rep: "রেপুটেশন স্কোর", auth: "ভেরিফিকেশন", wait: "যাচাইয়ের অপেক্ষায়", bind: "উইথড্র অ্যাড্রেস যুক্ত করুন", share: "আমার শেয়ারিং লিংক", smsg: "সিস্টেম মেসেজ", night: "নাইট মোড", sec: "সিকিউরিটি", notset: "সেট করা নেই", web: "ওয়েবসাইট পরিচিতি", logout: "লগ আউট", copied: "শেয়ারিং লিংক কপি হয়েছে", nomsg: "নতুন মেসেজ নেই", demo: "শুধু ডেমো", out: "লগ আউট হয়েছে (ডেমো)", pl: "পজিশন তালিকা", orec: "অর্ডার রেকর্ড", kl: "কে-লাইন", pp: "ক্রয়মূল্য", fp: "ফিলড প্রাইস", pnl: "লাভ/ক্ষতি", norec: "এখনো কোনো রেকর্ড নেই", ind: "ইন্ডিকেটর" },
  hi: { rep: "प्रतिष्ठा स्कोर", auth: "प्रमाणीकरण", wait: "प्रमाणन की प्रतीक्षा", bind: "निकासी पता जोड़ें", share: "मेरा शेयर लिंक", smsg: "सिस्टम संदेश", night: "नाइट मोड", sec: "सुरक्षा", notset: "सेट नहीं", web: "वेबसाइट परिचय", logout: "लॉग आउट", copied: "शेयर लिंक कॉपी हुआ", nomsg: "कोई नया संदेश नहीं", demo: "केवल डेमो", out: "लॉग आउट (डेमो)", pl: "पोज़िशन सूची", orec: "ऑर्डर रिकॉर्ड", kl: "के-लाइन", pp: "खरीद मूल्य", fp: "भरा गया मूल्य", pnl: "लाभ/हानि", norec: "अभी कोई रिकॉर्ड नहीं", ind: "इंडिकेटर" },
  ur: { rep: "ساکھ اسکور", auth: "تصدیق", wait: "تصدیق کا انتظار", bind: "نکالنے کا پتہ جوڑیں", share: "میرا شیئرنگ لنک", smsg: "سسٹم پیغام", night: "نائٹ موڈ", sec: "سیکیورٹی", notset: "سیٹ نہیں", web: "ویب سائٹ تعارف", logout: "لاگ آؤٹ", copied: "شیئرنگ لنک کاپی ہو گیا", nomsg: "کوئی نیا پیغام نہیں", demo: "صرف ڈیمو", out: "لاگ آؤٹ (ڈیمو)", pl: "پوزیشن فہرست", orec: "آرڈر ریکارڈ", kl: "کے لائن", pp: "خرید قیمت", fp: "بھری گئی قیمت", pnl: "نفع/نقصان", norec: "ابھی کوئی ریکارڈ نہیں", ind: "انڈیکیٹرز" },
  ar: { rep: "نقاط السمعة", auth: "التوثيق", wait: "بانتظار التوثيق", bind: "ربط عنوان السحب", share: "رابط المشاركة", smsg: "رسالة النظام", night: "الوضع الليلي", sec: "الأمان", notset: "غير مضبوط", web: "نبذة عن الموقع", logout: "تسجيل الخروج", copied: "تم نسخ رابط المشاركة", nomsg: "لا رسائل جديدة", demo: "تجريبي فقط", out: "تم تسجيل الخروج (تجريبي)", pl: "قائمة المراكز", orec: "سجل الأوامر", kl: "الشموع", pp: "سعر الشراء", fp: "سعر التنفيذ", pnl: "الربح/الخسارة", norec: "لا سجلات حاليا", ind: "المؤشرات" },
  es: { rep: "Puntuación de reputación", auth: "Autenticación", wait: "Pendiente de certificación", bind: "Vincular dirección de retiro", share: "Mi enlace para compartir", smsg: "Mensaje del sistema", night: "Modo noche", sec: "Seguridad", notset: "Sin configurar", web: "Presentación del sitio", logout: "Cerrar sesión", copied: "Enlace copiado", nomsg: "Sin mensajes nuevos", demo: "Solo demo", out: "Sesión cerrada (demo)", pl: "Lista de posiciones", orec: "Registro de órdenes", kl: "Velas", pp: "Precio de compra", fp: "Precio ejecutado", pnl: "Ganancia/Pérdida", norec: "Sin registros", ind: "Indicadores" },
  fr: { rep: "Score de réputation", auth: "Authentification", wait: "En attente de certification", bind: "Lier l'adresse de retrait", share: "Mon lien de partage", smsg: "Message système", night: "Mode nuit", sec: "Sécurité", notset: "Non défini", web: "Présentation du site", logout: "Déconnexion", copied: "Lien copié", nomsg: "Aucun nouveau message", demo: "Démo uniquement", out: "Déconnecté (démo)", pl: "Liste des positions", orec: "Historique des ordres", kl: "Bougies", pp: "Prix d'achat", fp: "Prix exécuté", pnl: "Gain/Perte", norec: "Aucun enregistrement", ind: "Indicateurs" },
  de: { rep: "Reputationswert", auth: "Authentifizierung", wait: "Zertifizierung ausstehend", bind: "Auszahlungsadresse binden", share: "Mein Freigabelink", smsg: "Systemnachricht", night: "Nachtmodus", sec: "Sicherheit", notset: "Nicht gesetzt", web: "Webseiten-Vorstellung", logout: "Abmelden", copied: "Link kopiert", nomsg: "Keine neuen Nachrichten", demo: "Nur Demo", out: "Abgemeldet (Demo)", pl: "Positionsliste", orec: "Orderverlauf", kl: "K-Linie", pp: "Kaufpreis", fp: "Ausführungspreis", pnl: "Gewinn/Verlust", norec: "Keine Einträge", ind: "Indikatoren" },
  pt: { rep: "Pontuação de reputação", auth: "Autenticação", wait: "Aguardando certificação", bind: "Vincular endereço de saque", share: "Meu link de compartilhamento", smsg: "Mensagem do sistema", night: "Modo noturno", sec: "Segurança", notset: "Não definido", web: "Apresentação do site", logout: "Sair", copied: "Link copiado", nomsg: "Sem novas mensagens", demo: "Somente demo", out: "Sessão encerrada (demo)", pl: "Lista de posições", orec: "Registro de ordens", kl: "Candles", pp: "Preço de compra", fp: "Preço executado", pnl: "Lucro/Perda", norec: "Sem registros", ind: "Indicadores" },
  ru: { rep: "Рейтинг репутации", auth: "Аутентификация", wait: "Ожидает проверки", bind: "Привязать адрес вывода", share: "Моя ссылка", smsg: "Системное сообщение", night: "Ночной режим", sec: "Безопасность", notset: "Не задано", web: "О сайте", logout: "Выйти", copied: "Ссылка скопирована", nomsg: "Нет новых сообщений", demo: "Только демо", out: "Вы вышли (демо)", pl: "Список позиций", orec: "История ордеров", kl: "График", pp: "Цена покупки", fp: "Цена исполнения", pnl: "Прибыль/Убыток", norec: "Записей нет", ind: "Индикаторы" },
  tr: { rep: "İtibar puanı", auth: "Kimlik doğrulama", wait: "Onay bekleniyor", bind: "Çekim adresi bağla", share: "Paylaşım bağlantım", smsg: "Sistem mesajı", night: "Gece modu", sec: "Güvenlik", notset: "Ayarlanmadı", web: "Web sitesi tanıtımı", logout: "Çıkış yap", copied: "Bağlantı kopyalandı", nomsg: "Yeni mesaj yok", demo: "Yalnızca demo", out: "Çıkış yapıldı (demo)", pl: "Pozisyon listesi", orec: "Emir kayıtları", kl: "Mum grafiği", pp: "Alış fiyatı", fp: "Gerçekleşen fiyat", pnl: "Kâr/Zarar", norec: "Kayıt yok", ind: "Göstergeler" },
  zh: { rep: "信誉分", auth: "实名认证", wait: "待认证", bind: "绑定提现地址", share: "我的分享链接", smsg: "系统消息", night: "夜间模式", sec: "安全设置", notset: "未设置", web: "网站介绍", logout: "退出登录", copied: "分享链接已复制", nomsg: "暂无新消息", demo: "仅演示", out: "已退出（演示）", pl: "持仓列表", orec: "委托记录", kl: "K线", pp: "买入价", fp: "成交价", pnl: "盈亏", norec: "暂无记录", ind: "指标" },
  ja: { rep: "信用スコア", auth: "認証", wait: "認証待ち", bind: "出金アドレスを登録", share: "共有リンク", smsg: "システムメッセージ", night: "ナイトモード", sec: "セキュリティ", notset: "未設定", web: "サイト紹介", logout: "ログアウト", copied: "リンクをコピーしました", nomsg: "新着メッセージなし", demo: "デモのみ", out: "ログアウトしました（デモ）", pl: "ポジション一覧", orec: "注文履歴", kl: "ローソク足", pp: "購入価格", fp: "約定価格", pnl: "損益", norec: "記録なし", ind: "インジケーター" },
  id: { rep: "Skor reputasi", auth: "Autentikasi", wait: "Menunggu sertifikasi", bind: "Ikat alamat penarikan", share: "Tautan bagikan saya", smsg: "Pesan sistem", night: "Mode malam", sec: "Keamanan", notset: "Belum diatur", web: "Pengenalan situs", logout: "Keluar", copied: "Tautan disalin", nomsg: "Tidak ada pesan baru", demo: "Hanya demo", out: "Telah keluar (demo)", pl: "Daftar posisi", orec: "Catatan order", kl: "K-line", pp: "Harga beli", fp: "Harga terisi", pnl: "Untung/Rugi", norec: "Belum ada catatan", ind: "Indikator" },
};

/* ---------------- Auth / Deposit / Withdraw / API error texts ---------------- */
export const T3 = {
  en: { login: "login", register: "register", acc: "Please enter your email", pw: "Please enter your password", pw2: "Please re-enter your password", forgot: "Forgot password", rem: "Remember account", email: "Email", bEmail: "Enter a valid email address", bPw: "Password must be at least 6 characters", bMatch: "Passwords do not match", exists: "This email is already registered", noUser: "Account not found", wrongPw: "Wrong password", reset: "Reset password", newPw: "Please enter a new password", resetOk: "Password updated, please log in", dep: "Deposit", coin: "Coin", net: "Network", addr: "Withdrawal address", eAddr: "Enter withdrawal address", bAddr: "Invalid withdrawal address", fee: "Fee", recv: "You will receive", depOk: "Deposit credited (demo)", wdOk: "Withdrawal submitted (demo)", hist: "History", depNote: "Demo only: no real funds or wallet address. The amount is added to your demo balance.", wdNote: "Demo only: no real transfer is made.", proc: "Processing", done: "Completed", feeLow: "Amount must be greater than the fee", amount: "Amount", submit: "Submit", hasAcc: "Back to login",
    neterr: "Network error. Server may be waking up, try again", err: "Request failed", unauthorized: "Session expired, please log in", badSym: "Invalid coin", badSide: "Invalid side", badDir: "Invalid direction", badSec: "Invalid time", badCoin: "Invalid coin/network", badInterval: "Invalid interval", forbidden: "Not allowed", wait2: "Please wait..." },
  bn: { login: "লগইন", register: "রেজিস্টার", acc: "আপনার ইমেইল লিখুন", pw: "পাসওয়ার্ড লিখুন", pw2: "পাসওয়ার্ড আবার লিখুন", forgot: "পাসওয়ার্ড ভুলে গেছেন", rem: "অ্যাকাউন্ট মনে রাখুন", email: "ইমেইল", bEmail: "সঠিক ইমেইল দিন", bPw: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", bMatch: "পাসওয়ার্ড মিলছে না", exists: "এই ইমেইল আগেই রেজিস্টার করা", noUser: "অ্যাকাউন্ট পাওয়া যায়নি", wrongPw: "পাসওয়ার্ড ভুল", reset: "পাসওয়ার্ড রিসেট", newPw: "নতুন পাসওয়ার্ড লিখুন", resetOk: "পাসওয়ার্ড বদলেছে, লগইন করুন", dep: "ডিপোজিট", coin: "কয়েন", net: "নেটওয়ার্ক", addr: "উইথড্র অ্যাড্রেস", eAddr: "উইথড্র অ্যাড্রেস দিন", bAddr: "অ্যাড্রেস সঠিক নয়", fee: "ফি", recv: "আপনি পাবেন", depOk: "ডিপোজিট যোগ হয়েছে (ডেমো)", wdOk: "উইথড্র জমা হয়েছে (ডেমো)", hist: "ইতিহাস", depNote: "শুধু ডেমো: আসল টাকা বা ওয়ালেট অ্যাড্রেস নেই। পরিমাণ আপনার ডেমো ব্যালেন্সে যোগ হয়।", wdNote: "শুধু ডেমো: আসল ট্রান্সফার হয় না।", proc: "প্রসেসিং", done: "সম্পন্ন", feeLow: "পরিমাণ ফি-এর চেয়ে বেশি হতে হবে", amount: "পরিমাণ", submit: "জমা দিন", hasAcc: "লগইনে ফিরুন",
    neterr: "নেটওয়ার্ক সমস্যা। সার্ভার জেগে উঠছে হতে পারে, আবার চেষ্টা করুন", err: "অনুরোধ ব্যর্থ হয়েছে", unauthorized: "সেশন শেষ, আবার লগইন করুন", badSym: "কয়েন সঠিক নয়", badSide: "সাইড সঠিক নয়", badDir: "ডিরেকশন সঠিক নয়", badSec: "সময় সঠিক নয়", badCoin: "কয়েন/নেটওয়ার্ক সঠিক নয়", badInterval: "ইন্টারভাল সঠিক নয়", forbidden: "অনুমতি নেই", wait2: "অপেক্ষা করুন..." },
};

export const LangCtx = createContext({ lang: "en", t: (k) => k });
export const useT = () => useContext(LangCtx).t;

export const fmt = (p) => (p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(4) : p >= 0.01 ? p.toFixed(6) : p.toFixed(8));
export const fmtV = (v) => (v >= 1e9 ? (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? (v / 1e3).toFixed(2) + "K" : v.toFixed(2));
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------------- API helper ---------------- */
let TOKEN = store.get("cx_token", "");
let ON401 = () => {};
export const setToken = (v) => { TOKEN = v; };
export const getToken = () => TOKEN;
export const setOn401 = (fn) => { ON401 = fn; };

export async function api(path, opt = {}) {
  const headers = { "Content-Type": "application/json" };
  if (TOKEN) headers.Authorization = "Bearer " + TOKEN;
  let r;
  try {
    r = await fetch(API + path, { method: opt.method || "GET", headers, body: opt.body ? JSON.stringify(opt.body) : undefined });
  } catch { throw new Error("neterr"); }
  let j = null;
  try { j = await r.json(); } catch {}
  if (!r.ok) {
    const d = j && j.detail;
    const code = typeof d === "string" ? d : "err";
    if (r.status === 401 && code === "unauthorized") ON401();
    throw new Error(code);
  }
  return j;
}

export function usePrices() {
  const [P, setP] = useState(() => Object.fromEntries(Object.entries(FALL).map(([k, v]) => [k, { price: v[0], chg: v[1], vol: v[2], hi: v[0] * 1.01, lo: v[0] * 0.99 }])));
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const j = await api("/market/tickers");
        if (stop || !j) return;
        setP((o) => ({ ...o, ...j }));
      } catch {}
    };
    load();
    const id = setInterval(load, 4000);
    return () => { stop = true; clearInterval(id); };
  }, []);
  return P;
}

export const Ic = ({ d, s = 24 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
);
export const ICON = {
  home: "M12 3l10 9h-3v9h-5v-6h-4v6H5v-9H2z",
  market: "M3 21v-8h4v8zm6 0V9h4v12zm6 0V4h4v17z",
  trade: "M12 5V1L7 6l5 5V7a6 6 0 11-6 6H4a8 8 0 108-8z",
  options: "M6 2h9l5 5v15H6zm3 9v2h8v-2zm0 4v2h8v-2z",
  assets: "M3 6a2 2 0 012-2h13v3h3v13H5a2 2 0 01-2-2zm14 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",
  card: "M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm1 4v2h16V9z",
  chat: "M12 3a9 9 0 00-7.6 13.8L3 21l4.4-1.3A9 9 0 1012 3z",
  swap: "M7 7h11l-3-3 1.4-1.4L22 8l-5.6 5.4L15 12l3-3H7zm10 10H6l3 3-1.4 1.4L2 16l5.6-5.4L9 12l-3 3h11z",
  loan: "M12 22l-7-8h4V3h6v11h4z",
  eye: "M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 3a4 4 0 110 8 4 4 0 010-8z",
  menu: "M3 6h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zM3 16h2v2H3zm4 0h14v2H7z",
  idcard: "M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm3 3v4h5V8zm7 0v2h5V8zm0 4v2h5v-2zM6 14v2h5v-2z",
  pin: "M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
  share: "M18 16a3 3 0 00-2.2 1l-7-3.6a3 3 0 000-2.8l7-3.6A3 3 0 1015 6l-7 3.6a3 3 0 100 4.8l7 3.6a3 3 0 103-2z",
  bell: "M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1z",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  lock: "M6 10V8a6 6 0 1112 0v2h1a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V11a1 1 0 011-1zm2 0h8V8a4 4 0 10-8 0z",
  user: "M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z",
  doc: "M6 2h9l5 5v15H6zm3 9v2h8v-2zm0 4v2h8v-2z",
  candle: "M7 2h2v4h2v10H9v6H7v-6H5V6h2zm9 4h2v3h2v8h-2v3h-2v-3h-2V9h2z",
  headset: "M12 2a9 9 0 00-9 9v7a3 3 0 003 3h2v-8H5v-2a7 7 0 0114 0v2h-3v8h3a3 3 0 003-3v-7a9 9 0 00-9-9z",
  gear: "M12 8a4 4 0 100 8 4 4 0 000-8zm9 5v-2l-2.2-.6a7 7 0 00-.7-1.6l1.1-2-1.4-1.4-2 1.1a7 7 0 00-1.6-.7L13 3h-2l-.6 2.2a7 7 0 00-1.6.7l-2-1.1L5.4 6.2l1.1 2a7 7 0 00-.7 1.6L3.6 11v2l2.2.6c.2.6.4 1.1.7 1.6l-1.1 2 1.4 1.4 2-1.1c.5.3 1 .5 1.6.7L11 21h2l.6-2.2c.6-.2 1.1-.4 1.6-.7l2 1.1 1.4-1.4-1.1-2c.3-.5.5-1 .7-1.6z",
};

/* ---------------- Coin logo (CDN + letter fallback) ---------------- */
const logoSrc = (s) => {
  const l = s.toLowerCase();
  return [
    `https://assets.coincap.io/assets/icons/${l}@2x.png`,
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${l}.png`,
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${l}.png`,
  ];
};
export function Coin({ s, size = 42 }) {
  const [n, setN] = useState(0);
  const src = logoSrc(s);
  if (n >= src.length)
    return <span className="cx-coin" style={{ background: COL[s] || BLUE, width: size, height: size }}>{s[0]}</span>;
  return (
    <img key={s + n} className="cx-coin img" src={src[n]} width={size} height={size} alt={s}
      loading="lazy" referrerPolicy="no-referrer" onError={() => setN(n + 1)} />
  );
}

/* ---------------- Language dropdown ---------------- */
export function LangPicker({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const cur = LANGS.find((l) => l[0] === lang) || LANGS[1];
  return (
    <div className="cx-lgw">
      <button className="cx-lang" onClick={() => setOpen(!open)}>{cur[1]} <span className="cx-fl">{cur[2]}</span></button>
      {open && (
        <>
          <div className="cx-lgback" onClick={() => setOpen(false)} />
          <div className="cx-lgm">
            {LANGS.map(([k, n, f]) => (
              <button key={k} className={k === lang ? "on" : ""} onClick={() => { setLang(k); setOpen(false); }}>
                <span>{n}</span><span className="cx-fl">{f}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Auth top bar (Login + Register দুটোতেই) ---------------- */
export function AuBar({ title, onBack, onHelp }) {
  return (
    <div className="cx-ab">
      <button onClick={onBack} aria-label="back">‹</button>
      <h1>{title}</h1>
      <button onClick={onHelp} aria-label="support"><Ic d={ICON.headset} s={28} /></button>
    </div>
  );
}

/* ---------------- CSS (পুরো অ্যাপের) ---------------- */
export const CSS = `
.cx{min-height:100vh;background:#e0e1ea;color:#111;font-family:Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;justify-content:center;overflow-x:hidden}
.cx *{box-sizing:border-box}
.cx button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:start}
.cx small{color:#8a8d99;font-size:13px;display:block}
.cx-pg{width:100%;min-width:0;max-width:520px;background:#fff;min-height:100vh;padding-bottom:90px;box-shadow:0 0 40px rgba(0,0,0,.08);overflow-x:hidden}
.cx-bar{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;position:relative;z-index:40}
.cx-logo{width:40px;height:40px;border-radius:12px;border:4px solid #17c3c9!important;color:#17c3c9!important;display:grid;place-items:center;font-weight:900;text-align:center!important;font-size:18px}
.cx-lang{font-size:17px;display:flex;align-items:center;gap:10px}
.cx-fl{font-size:22px;line-height:1}
.cx-lgw{position:relative}
.cx-lgback{position:fixed;inset:0;z-index:45}
.cx-lgm{position:absolute;top:calc(100% + 8px);inset-inline-end:0;width:240px;max-height:62vh;overflow-y:auto;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.25);z-index:46}
.cx-lgm button{display:flex;justify-content:space-between;align-items:center;width:100%;padding:16px 14px;font-size:19px;border-bottom:1px solid #eceef3}
.cx-lgm button.on{color:${BLUE};font-weight:600}
.cx-banner{position:relative;overflow:hidden;background:#0f2230;aspect-ratio:15/6}
.cx-slides{display:flex;height:100%;transition:transform .6s ease;direction:ltr}
.cx-slides img{flex:none;width:100%;height:100%;object-fit:cover;user-select:none}
.cx-dots{position:absolute;bottom:14px;left:50%;display:flex;gap:10px;transform:translateX(-50%)}
.cx-dots i{width:10px;height:10px;border-radius:50%;background:#7a8a92;cursor:pointer}.cx-dots i.on{background:#fff}
.cx-tick{display:grid;grid-template-columns:repeat(3,1fr);text-align:center;padding:22px 0}
.cx-tick button{text-align:center!important}
.cx-tick span{display:block;font-size:17px}
.cx-tick b{display:block;font-size:26px;margin:4px 0}
.cx-tick em{font-style:normal;font-size:17px}
.cx-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#e0e1ea;padding:14px 10px}
.cx-grid button{display:flex;align-items:center;gap:14px;background:#fff;border-radius:10px;padding:16px 18px;font-size:19px}
.cx-h{margin:0;padding:16px 14px 10px;font-size:24px}
.cx-th,.cx-row{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1.1fr) 84px;align-items:center;gap:8px;padding:0 14px;width:100%}
.cx-th{color:#8a8d99;font-size:14px;padding-top:12px;padding-bottom:12px;border-top:1px solid #e5e6ec}
.cx-th span:last-child{text-align:end}
.cx-row{padding-top:14px;padding-bottom:14px;border-top:1px solid #e5e6ec}
.cx-row b{font-size:17px;font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-row>span{min-width:0}
.cx-nm>span{min-width:0;display:block}
.cx-nm small,.cx-pr small{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.cx-pr{text-align:start}
.cx-row .cx-nm b small{display:inline;font-size:12px;font-weight:400;margin:0}
.cx-nm{display:flex;align-items:center;gap:10px;min-width:0}
.cx-coin{border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;flex:none;object-fit:cover}
.cx-coin.img{background:#fff;display:block}
.cx-dn{display:flex;align-items:center;gap:10px}
.cx-pill{justify-self:end;width:84px;text-align:center;color:#fff;padding:9px 0;border-radius:6px;font-size:15px;font-weight:600}
.cx-top{display:grid;grid-template-columns:48px 1fr auto;align-items:center;padding:12px 14px;border-bottom:1px solid #e5e6ec;gap:6px}
.cx-top h1{margin:0;font-size:24px;text-align:center;font-weight:500}
.cx-top h1 small{display:inline;font-size:18px;margin-inline-start:8px}
.cx-top button{font-size:34px;line-height:1}
.cx-top .cx-link{font-size:17px;display:flex;align-items:center;gap:8px;padding:0 4px;line-height:1.2}
.cx-tabs{display:flex;overflow-x:auto;scrollbar-width:none;padding:6px 10px 0}
.cx-tabs button{padding:16px 16px 12px;font-size:21px;white-space:nowrap;color:#444;border-bottom:4px solid transparent}
.cx-tabs button.on{border-color:${BLUE};color:#000}
.cx-tabs.two{padding-inline-start:0}.cx-tabs.two button{flex:1;text-align:center}
.cx-tabs.big button{flex:1;color:#777;text-align:center}.cx-tabs.big button.on{color:#000}
.cx-empty{padding:40px;text-align:center;color:#8a8d99;background:#e0e1ea}
.cx-ex{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:12px;padding:14px 10px}
.cx-bh,.cx-bk{display:flex;justify-content:space-between;gap:6px;font-size:16px;padding:12px 0}
.cx-bh{color:#8a8d99;font-size:18px}
.cx-bk b{font-weight:400}
.cx-mid{font-size:28px;font-weight:700;padding:16px 0}
.cx-bs{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cx-bs button{text-align:center;padding:14px 4px;font-size:18px;font-weight:600;border-radius:6px;border:2px solid transparent!important}
.cx-bs .bb{background:rgba(0,192,135,.15);color:#00c087;border-color:#00c087!important}
.cx-bs .sb{background:rgba(216,77,90,.15);color:#ff6b78;border-color:#d84d5a!important}
.cx-bs .bb.on{background:#00c087;color:#fff}
.cx-bs .sb.on{background:#d84d5a;color:#fff}
.cx-sel{font-size:21px;padding:18px 14px}
.cx-in{display:flex;align-items:center;border:1px solid #ccd;margin:10px 0 6px;padding:8px;gap:8px;height:68px}
.cx-in input{flex:1;min-width:0;border:0;border-bottom:1px solid #999;outline:0;font-size:18px;padding:6px 2px;background:transparent;color:inherit}
.cx-in button{width:40px;height:44px;border:1px solid #ccd!important;border-radius:4px;text-align:center!important;font-size:22px}
.cx-in b{font-weight:500;font-size:19px}
.cx-form small{margin:4px 0 8px;font-size:16px}
.cx-pc{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.cx-pc button{border:1px solid #555!important;padding:10px 0;text-align:center!important;font-size:17px}
.cx-cta{width:100%;color:#fff!important;padding:18px;margin-top:22px;text-align:center!important;font-size:22px;border-radius:4px}
.cx-msg{margin:8px 10px;padding:10px;background:#eef6ff;color:${BLUE};border-radius:6px;font-size:14px}
.cx-form .cx-msg{margin:10px 0 0}
.cx-ent{display:flex;justify-content:space-between;padding:20px 14px;font-size:26px;border-top:12px solid #e0e1ea}
.cx-ent b{font-size:22px;font-weight:500}
.cx-over{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:50;display:flex}
.cx-over.end{align-items:flex-end;justify-content:center}
.cx-drawer{width:70%;max-width:360px;background:#fff;overflow-y:auto;padding:30px 0}
.cx-drawer h2{font-weight:400;font-size:34px;margin:30px 28px}
.cx-drawer h3{color:${BLUE};font-size:34px;margin:50px 28px 30px}
.cx-drawer button{display:flex;justify-content:space-between;align-items:center;width:calc(100% - 56px);margin:0 28px;padding:20px 0;border-top:1px solid #ddd;font-size:22px}
.cx-drawer button b small{display:inline;color:#666;font-weight:400}
.cx-opt-h{display:flex;justify-content:space-between;padding:18px 14px;align-items:flex-start}
.cx-opt-h>b{font-size:28px;font-weight:600}
.cx-opt-h>b small{color:inherit;font-size:18px;font-weight:400;margin-top:8px}
.cx-opt-h div{display:grid;grid-template-columns:auto auto;gap:8px 30px;font-size:17px;color:#999}
.cx-opt-h i{font-style:normal;color:#222;text-align:end}

/* ---- Candle chart ---- */
.cx-chartw{direction:ltr;border-top:1px solid #dcdfe6;position:relative}
.cx-ctool{display:flex;align-items:center;gap:6px;border-bottom:1px solid #eceef3;height:40px;padding:0 6px}
.cx-ctool>*{display:flex;align-items:center}
.cx-ctool button{padding:6px 14px;font-size:15px;border-inline-end:1px solid #eceef3}
.cx-cti{padding:0 10px;font-size:15px;gap:6px;color:#333}
.cx-ivw{position:relative}
.cx-ivm{position:absolute;top:36px;left:0;background:#fff;border:1px solid #dcdfe6;border-radius:6px;z-index:5;box-shadow:0 6px 20px rgba(0,0,0,.15);display:flex;flex-direction:column;min-width:70px}
.cx-ivm button{border:0;text-align:center;padding:10px 16px}
.cx-ivm button.on{color:${BLUE};font-weight:600}
.cx-cwrap{position:relative;width:100%}
.cx-chead{position:absolute;top:6px;left:8px;font-size:12px;line-height:1.6;z-index:2;pointer-events:none;max-width:calc(100% - 80px)}
.cx-gt2{color:#555}
.cx-gl{stroke:#eef0f4;stroke-width:1}
.cx-ax{stroke:#c9ccd4;stroke-width:1}
.cx-gt{fill:#555}
.cx-ch{stroke:#778;stroke-width:1;stroke-dasharray:4 4}
.cx-zoom{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);display:flex;gap:8px;z-index:3}
.cx-zoom button{width:30px;height:30px;border-radius:50%;background:#fff!important;box-shadow:0 1px 6px rgba(0,0,0,.25);text-align:center!important;font-size:17px;line-height:30px;color:#444!important;padding:0}
.cx-gear{position:absolute;right:20px;bottom:5px;color:#555!important;z-index:3}
.cx-ptabs button{font-size:19px}
.cx-tbl{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:6px;padding:12px 14px;border-bottom:1px solid #eceef3;font-size:15px;align-items:center}
.cx-tbl>span:first-child{display:block;word-break:break-word}
.cx-tbl>span:first-child .cx-coin{vertical-align:middle}
.cx-tbl>span:first-child small{font-size:12px;margin-top:2px}
.cx-tbl>span:not(:first-child){text-align:end}
.cx-tbh{font-size:16px;border-bottom:1px solid #999;padding:16px 14px}
.cx-norec{text-align:center;padding:60px 20px;color:#9aa0ad;font-size:20px}
.cx-norec p{margin:20px 0 0}

.cx-obar{position:fixed;bottom:76px;left:50%;transform:translateX(-50%);width:100%;max-width:520px;background:#fff;display:grid;grid-template-columns:1fr 1fr 1.1fr 1.1fr;gap:8px;padding:10px;z-index:20;border-top:1px solid #e5e6ec}
.cx-obar button{text-align:center!important;font-size:19px}
.cx-obar b{display:block;font-weight:500;font-size:22px}
.cx-obar .g,.cx-two .g{background:${GREEN};color:#fff;border-radius:12px}
.cx-obar .r,.cx-two .r{background:${RED};color:#fff;border-radius:12px}
.cx-obar button.g,.cx-obar button.r{font-weight:700;color:#fff!important;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.cx-sheet{width:100%;max-width:520px;background:#fff;border-radius:26px 26px 0 0;padding:34px 26px 26px}
.cx-sheet h4{margin:20px 0 18px;font-weight:400;font-size:25px}
.cx-chs{display:flex;gap:14px;flex-wrap:wrap}
.cx-chs button{border:1px solid #888!important;padding:14px 0;min-width:78px;flex:1;text-align:center!important;font-size:21px}
.cx-chs button.on{border-color:${BLUE}!important;box-shadow:inset -22px -22px 0 -18px ${BLUE}}
.cx-line{display:flex;align-items:center;gap:10px;margin:22px 0}
.cx-line input{flex:1;font-size:26px;border:0;border-bottom:1px solid #888;outline:0;padding:10px 4px;min-width:0;background:transparent;color:inherit}
.cx-line button{color:${BLUE}!important;font-size:23px;padding:0 16px}
.cx-info{display:flex;justify-content:space-between;color:${GREEN};font-size:22px;margin:18px 0;gap:8px;flex-wrap:wrap}
.cx-two{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-top:30px}
.cx-two button{padding:26px 0;text-align:center!important;font-size:24px;border-radius:12px}
.cx-cards{display:flex;flex-direction:column;gap:14px;background:#e0e1ea;padding:14px 20px;min-height:600px}
.cx-ac{background:#fff;border-radius:16px;padding:26px}
.cx-ac h3{margin:0 0 20px;color:${BLUE};font-size:28px;display:flex;justify-content:space-between;align-items:center}
.cx-ac h3 i{font-style:normal;color:#111}
.cx-ac small{font-size:20px}
.cx-ac>b{display:block;font-size:26px;font-weight:500;margin-top:10px}
.cx-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:24px}
.cx-3 span:nth-child(2){text-align:center}.cx-3 span:last-child{text-align:end}
.cx-3 small{font-size:18px;margin-bottom:12px}
.cx-sum{display:grid;grid-template-columns:1fr auto;padding:24px 22px 40px;row-gap:12px}
.cx-sum h2{margin:0 0 10px;font-weight:400;font-size:28px}
.cx-sum span{font-size:18px}
.cx-sum>b{font-size:26px}.cx-sum small{font-size:20px}
.cx-demo{background:#fff;padding:18px 24px}
.cx-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;background:#fff;display:flex;z-index:30;border-top:1px solid #e5e6ec;padding:10px 0 calc(8px + env(safe-area-inset-bottom))}
.cx-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:19px;color:#111;text-align:center}
.cx-nav svg{color:#5f7a96}
.cx-nav button.on{color:${BLUE}}.cx-nav button.on svg{color:${BLUE}}
.cx-toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:90;background:#14323f;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:92%}
.cx button:focus-visible,.cx input:focus-visible{outline:2px solid ${BLUE};outline-offset:2px}
.cx-row:active,.cx-grid button:active{background:#f3f4f8}

/* ---- Side menu ---- */
.cx-mo{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,0);pointer-events:none;transition:background .3s}
.cx-mo.open{background:rgba(0,0,0,.55);pointer-events:auto}
.cx-md{position:absolute;top:0;bottom:0;inset-inline-start:0;width:80%;max-width:380px;background:#fff;transform:translateX(-100%);transition:transform .3s ease;overflow-y:auto;padding:22px 22px 30px}
.cx[dir=rtl] .cx-md{transform:translateX(100%)}
.cx-mo.open .cx-md,.cx[dir=rtl] .cx-mo.open .cx-md{transform:none}
.cx-mp{padding:8px 0 18px;border-bottom:1px solid #e5e6ec}
.cx-mp p{margin:0;font-size:19px;line-height:2;word-break:break-all}
.cx-mr{display:flex;align-items:center;gap:14px;width:100%;padding:20px 0;border-bottom:1px solid #e5e6ec;font-size:19px}
.cx-mi{color:${BLUE};display:flex;flex:none}
.cx-ml{flex:1;min-width:0}
.cx-mv{font-size:inherit;text-align:end;max-width:42%}
.cx-mv.red{color:${RED}}
.cx-ar{color:#8a8d99;font-size:26px;line-height:1}
.cx[dir=rtl] .cx-ar{transform:scaleX(-1)}
.cx-sw{width:60px;height:32px;border-radius:16px;background:#e3e4ea;position:relative;flex:none;transition:background .2s}
.cx-sw i{position:absolute;top:3px;inset-inline-start:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.35);transition:inset-inline-start .2s}
.cx-sw.on{background:${BLUE}}.cx-sw.on i{inset-inline-start:31px}
.cx-lo{display:block;width:100%;margin-top:30px;padding:20px 0;background:#1a82d6!important;color:#fff!important;border-radius:16px;text-align:center!important;font-size:21px}

/* ---- Night mode ---- */
.cx.dark{background:#080f1c;color:#e8ecf3}
.cx.dark .cx-pg{background:#121e2f;box-shadow:0 0 40px rgba(0,0,0,.4)}
.cx.dark small{color:#8d98ad}
.cx.dark .cx-th,.cx.dark .cx-row,.cx.dark .cx-top,.cx.dark .cx-nav,.cx.dark .cx-obar,.cx.dark .cx-mr,.cx.dark .cx-mp,.cx.dark .cx-lgm button,.cx.dark .cx-tbl,.cx.dark .cx-ctool,.cx.dark .cx-ctool button,.cx.dark .cx-chartw{border-color:#22304a}
.cx.dark .cx-tbh{border-bottom-color:#5b6b88}
.cx.dark .cx-th{color:#8d98ad}
.cx.dark .cx-grid,.cx.dark .cx-cards,.cx.dark .cx-empty{background:#0b1424}
.cx.dark .cx-grid button,.cx.dark .cx-ac{background:#17263d}
.cx.dark .cx-ent{border-top-color:#0b1424}
.cx.dark .cx-nav,.cx.dark .cx-obar,.cx.dark .cx-demo{background:#121e2f}
.cx.dark .cx-nav button{color:#e8ecf3}.cx.dark .cx-nav button.on{color:#4aa3f0}
.cx.dark .cx-nav button.on svg{color:#4aa3f0}
.cx.dark .cx-drawer,.cx.dark .cx-sheet,.cx.dark .cx-lgm,.cx.dark .cx-md,.cx.dark .cx-ivm{background:#17263d;border-color:#22304a}
.cx.dark .cx-tabs button{color:#aab4c6}.cx.dark .cx-tabs button.on,.cx.dark .cx-tabs.big button.on{color:#fff}
.cx.dark .cx-tabs.big button{color:#8d98ad}
.cx.dark .cx-in,.cx.dark .cx-in button{border-color:#3a4a66!important}
.cx.dark .cx-in input,.cx.dark .cx-line input{border-bottom-color:#5b6b88}
.cx.dark .cx-pc button,.cx.dark .cx-chs button{border-color:#5b6b88!important}
.cx.dark .cx-chs button.on{border-color:${BLUE}!important}
.cx.dark .cx-msg{background:#17304f}
.cx.dark .cx-opt-h i,.cx.dark .cx-ac h3 i{color:#e8ecf3}
.cx.dark .cx-drawer button{border-color:#2a3a56}
.cx.dark .cx-sw{background:#3a4a66}.cx.dark .cx-sw.on{background:${BLUE}}
.cx.dark .cx-row:active,.cx.dark .cx-grid button:active{background:#1d2e49}
.cx.dark .cx-gl{stroke:#1d2b42}.cx.dark .cx-ax{stroke:#3a4a66}.cx.dark .cx-gt{fill:#9aa6bb}.cx.dark .cx-gt2{color:#9aa6bb}
.cx.dark .cx-cti{color:#cfd6e4}
.cx.dark .cx-zoom button{background:#2a3a56!important;color:#e8ecf3!important}
.cx.dark .cx-gear{color:#9aa6bb!important}

/* ---- Login / Register ---- */
.cx-au{background:#e0e1ea;padding-bottom:30px}
.cx-ab{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;padding:12px 14px;background:#fff;border-bottom:1px solid #eceef3}
.cx-ab h1{margin:0;font-size:19px;font-weight:500;text-align:center}
.cx-ab button{font-size:32px;line-height:1;display:grid;place-items:center;height:40px;text-align:center!important}
.cx[dir=rtl] .cx-ab button:first-child{transform:scaleX(-1)}
.cx-alogo{display:grid;place-items:center;padding:28px 0 26px}
.cx-alogo i{display:block;width:150px;height:150px;background:#fff}
.cx-alogo svg{width:100%;height:100%;display:block}
.cx-atab{background:#fff;text-align:center;padding-top:16px;font-size:18px;border-bottom:12px solid #e0e1ea}
.cx-atab span{display:inline-block;padding:0 14px 12px;border-bottom:4px solid ${BLUE}}
.cx-acard{background:#fff;margin:0 12px;padding:4px 20px}
.cx-acard.flat{margin:0}
.cx-ai{display:block;width:100%;border:0;border-bottom:1px solid #ddd;outline:0;padding:22px 0 18px;font-size:17px;background:transparent;color:inherit}
.cx-rm{display:flex;align-items:center;gap:12px;padding:18px 0;font-size:17px}
.cx-rm input{width:22px;height:22px;accent-color:${BLUE}}
.cx-a1{display:block;width:calc(100% - 44px);margin:22px 22px 0;background:#1a82d6!important;color:#fff!important;border-radius:14px;padding:17px 0;text-align:center!important;font-size:19px}
.cx-a1.flat{width:100%;margin:18px 0 0}
.cx-alinks{display:flex;justify-content:space-between;align-items:center;padding:22px 24px 8px}
.cx-alinks button{color:${BLUE}!important;font-size:17px}
.cx-alang{display:flex;justify-content:center;padding:18px 0}
.cx-msg.bad{background:#fdecee;color:${RED}}
.cx-au .cx-msg{margin:12px 22px 0}

/* ---- Deposit / Withdraw ---- */
.cx-fm{padding:10px 18px 20px}
.cx-fm h4{margin:16px 0 8px;font-size:15px;font-weight:500;color:#6b6f7c}
.cx-fm .cx-in{height:56px;margin:4px 0}
.cx-fm .cx-in input{font-size:17px}
.cx-chips{display:flex;gap:10px;flex-wrap:wrap}
.cx-chips button{padding:10px 20px;border:1px solid #bbb!important;border-radius:8px;font-size:16px;text-align:center!important}
.cx-chips button.on{border-color:${BLUE}!important;color:${BLUE};background:rgba(31,122,203,.08)}
.cx-all{width:auto!important;padding:0 12px;color:${BLUE}!important;font-size:16px!important;border:0!important}
.cx-note{background:#fff7e6;color:#a56a00;padding:10px 12px;border-radius:8px;font-size:13px;margin:14px 0 0}
.cx-kv{display:flex;justify-content:space-between;gap:10px;font-size:15px;padding:7px 0;color:#6b6f7c}
.cx-kv b{font-weight:500;color:inherit;text-align:end}
.cx-hist h3{margin:8px 18px 4px;font-size:17px}
.cx-tx{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 18px;border-bottom:1px solid #eceef3;font-size:15px}
.cx-tx b{font-weight:600}
.cx-tx .st{font-size:13px;padding:4px 10px;border-radius:12px}
.cx-tx .st.dep{background:rgba(14,203,129,.15);color:#0a9b63}
.cx-tx .st.wd{background:rgba(232,145,79,.18);color:#c26d1c}
.cx-empty2{text-align:center;color:#9aa0ad;padding:30px 0}
.cx.dark .cx-au,.cx.dark .cx-atab{background:#0b1424}
.cx.dark .cx-ab,.cx.dark .cx-acard,.cx.dark .cx-alogo i{background:#17263d}
.cx.dark .cx-alogo i{background:#fff}
.cx.dark .cx-atab{background:#121e2f;border-bottom-color:#0b1424}
.cx.dark .cx-ab,.cx.dark .cx-ai,.cx.dark .cx-tx{border-color:#22304a}
.cx.dark .cx-chips button{border-color:#5b6b88!important}
.cx.dark .cx-chips button.on{border-color:${BLUE}!important;color:#4aa3f0}
.cx.dark .cx-fm h4,.cx.dark .cx-kv{color:#9aa6bb}
.cx.dark .cx-note{background:#3a2e12;color:#f2c36b}
.cx.dark .cx-msg.bad{background:#3b1a20}

/* ---- Tablet / PC (nav + buttons stay at the bottom) ---- */
@media(min-width:768px){
.cx-pg{max-width:900px;padding-bottom:110px}
.cx-nav{max-width:900px;padding:8px 0}
.cx-nav button{font-size:14px;gap:3px}
.cx-nav svg{width:24px;height:24px}
.cx-obar{bottom:64px;max-width:900px}
.cx-banner{aspect-ratio:21/6}
.cx-bar{padding:12px 24px}
.cx-lang{font-size:16px}
.cx-lgm button{font-size:16px;padding:12px 14px}
.cx-tick b{font-size:24px}.cx-tick span,.cx-tick em{font-size:15px}
.cx-grid{grid-template-columns:repeat(3,1fr);gap:12px;padding:16px}
.cx-grid button{font-size:16px;padding:18px}
.cx-h{font-size:20px;padding:16px 24px 10px}
.cx-th,.cx-row{padding-left:24px;padding-right:24px}
.cx-th{font-size:15px}
.cx-row b{font-size:17px}.cx-row .cx-nm b small{font-size:13px}.cx-th,.cx-row{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 100px}
.cx-pill{width:90px;font-size:15px;padding:9px 0}
.cx-top h1{font-size:20px}.cx-top h1 small{font-size:15px}.cx-top button{font-size:30px}.cx-top .cx-link{font-size:16px}
.cx-tabs button{font-size:17px}
.cx-ex{padding:20px 24px;gap:30px}
.cx-bh,.cx-bk{font-size:14px;padding:9px 0}.cx-bh{font-size:15px}
.cx-mid{font-size:22px}
.cx-bs button{font-size:17px;padding:13px}
.cx-sel{font-size:17px}
.cx-in{height:58px}.cx-in input,.cx-in b{font-size:16px}
.cx-form small{font-size:14px}
.cx-pc button{font-size:15px}
.cx-cta{font-size:18px;padding:14px}
.cx-ent{font-size:20px;padding:18px 24px}.cx-ent b{font-size:17px}
.cx-drawer h2{font-size:26px}.cx-drawer h3{font-size:24px;margin:30px 28px 14px}.cx-drawer button{font-size:18px}
.cx-opt-h{padding:18px 24px}.cx-opt-h>b{font-size:24px}.cx-opt-h div{font-size:14px}
.cx-obar button{font-size:16px}.cx-obar b{font-size:18px}
.cx-sheet{max-width:640px;padding:28px 28px 24px}
.cx-sheet h4{font-size:20px}
.cx-chs button{font-size:17px}
.cx-line input{font-size:22px}.cx-line button{font-size:19px}
.cx-info{font-size:17px}
.cx-two button{font-size:20px;padding:20px 0}
.cx-cards{padding:16px 24px}
.cx-ac h3{font-size:22px}.cx-ac small{font-size:16px}.cx-ac>b{font-size:22px}
.cx-3{font-size:19px}.cx-3 small{font-size:15px}
.cx-sum h2{font-size:22px}.cx-sum>b{font-size:22px}.cx-sum small{font-size:16px}
.cx-mp p,.cx-mr{font-size:17px}
.cx-a1{font-size:17px}
.cx-tbl{font-size:14px}
.cx-norec{font-size:18px}
}
`;
