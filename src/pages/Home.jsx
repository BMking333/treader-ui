import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import img1 from "../assets/Image1.png";
import img2 from "../assets/Image2.png";
import img3 from "../assets/Image3.png";

/* =====================================================================
   src/pages/Home.jsx — এক ফাইলে পুরো অ্যাপ (lib + Home + Dashboard + Login + Register)
   ছবি: src/assets/Image1.png, Image2.png, Image3.png   (এই ফাইল src/pages/ এ থাকলে ../assets)
   ব্যবহার:  import CexApp from "./pages/Home";   <CexApp />
   ===================================================================== */

/* ====== BACKEND URL (এখানে বদলান) ====== */
const API = "https://tread-d84x.onrender.com";

const BLUE = "#1f7acb", GREEN = "#00c087", RED = "#d84d5a";
const CUP = "#0ecb81", CDN = "#f6465d";
const COINS = ["BTC", "ETH", "DOGE", "BCH", "LTC", "TRX", "SHIB", "ADA", "BSV", "ICP", "XRP", "ETC"];
const COL = { BTC: "#f7931a", ETH: "#627eea", DOGE: "#c2a633", BCH: "#8dc351", LTC: "#345d9d", TRX: "#eb0029", SHIB: "#e42d04", ADA: "#2563eb", BSV: "#eab300", ICP: "#7b3fe4", XRP: "#111", ETC: "#328332", USDT: "#26a17b", USDC: "#2775ca" };
const FALL = { BTC: [73618.71, -0.27, 1.4e8], ETH: [2046.75, -1.04, 9e7], DOGE: [0.067128, -1.58, 1e7], BCH: [228.86, -0.97, 16285], LTC: [49.77, -2.43, 164530], TRX: [0.317486, -0.04, 1.7e7], SHIB: [0.00000434, -2.91, 6.9e9], ADA: [0.172924, -1.28, 3.3e7], BSV: [15.8364, -2.52, 177887], ICP: [2.57, 0, 2008], XRP: [1.04406, -1.48, 2.7e7], ETC: [6.6095, -1.69, 124280] };
const MARKETS = ["USDT", "TRX", "BTC", "ETH", "USDD", "USDC", "NFT"];
const QTY = [10, 1000, 10000, 1000000], SECS = [20, 30, 70, 90, 180], YIELD = 0.2;
const ASSET_COINS = ["USDT", "USDC", "ETH", "BTC"];
const TOPUP = 1000;

/* ---------------- Languages ---------------- */
const LANGS = [
  ["pt", "Português", "🇵🇹"], ["en", "English", "🇺🇸"], ["ar", "عربي", "🇦🇪"], ["fr", "Français", "🇫🇷"],
  ["it", "italiano", "🇮🇹"], ["ja", "日本語", "🇯🇵"], ["ko", "한국인", "🇰🇷"], ["de", "Deutsch", "🇩🇪"],
  ["ru", "Русский", "🇷🇺"], ["vi", "Tiếng Việt", "🇻🇳"], ["tr", "Türkçe", "🇹🇷"], ["es", "español", "🇪🇸"],
  ["fa", "فارسی", "🇮🇷"], ["id", "Indonesia", "🇮🇩"], ["el", "Ελληνικά", "🇬🇷"], ["ms", "Melayu", "🇲🇾"],
  ["th", "แบบไทย", "🇹🇭"], ["la", "Latinus", "🇻🇦"], ["hi", "हिंदी", "🇮🇳"], ["bn", "বাংলা", "🇧🇩"],
  ["ur", "اردو", "🇵🇰"], ["zhT", "繁体中文", "🇭🇰"], ["zh", "简体中文", "🇨🇳"], ["ro", "România", "🇷🇴"],
  ["sv", "Svenska", "🇸🇪"], ["ht", "Creole", "🇸🇨"],
];
const RTL = ["ar", "fa", "ur"];

const T = {
  en: { home: "Home", market: "Market", trade: "Trade", options: "Options", assets: "Assets", rech: "Recharge", wd: "Withdraw", cs: "Customer service", swap: "Flash swap", loan: "Boost loan", tf: "Transfer", chg: "Chg%", name: "Name", lp: "Latest price", nodata: "No data", buy: "Buy", sell: "Sell", limit: "Limit price", price: "Price", qty: "Quantity", avail: "Available", amt: "Trade amount", eAmt: "Enter trade amount", eQty: "Enter quantity", iU: "Insufficient USDT balance", iC: "Insufficient", ok: "Order filled", entrust: "Current entrust", all: "All", spot: "Spot trading", pos: "Positions", hi: "High", lo: "Low", vol: "24H volume", bl: "Buy Long", ss: "Sell Short", time: "Time", mode: "Transaction mode", oq: "Opening quantity", ot: "Opening time", bal: "Account balance", yld: "Estimated Yield", openMsg: "Position opened", badQ: "Opening quantity: 10.00 - 1000000.00", iB: "Insufficient balance", ta: "Total assets", funds: "Funds", quant: "Quant trading", conv: "converted", frozen: "Frozen", cv: "Converted($)", closed: "{n} position(s) closed · {w} win, {l} loss" },
  bn: { home: "হোম", market: "মার্কেট", trade: "ট্রেড", options: "অপশন", assets: "অ্যাসেট", rech: "রিচার্জ", wd: "উইথড্র", cs: "কাস্টমার সার্ভিস", swap: "ফ্ল্যাশ সোয়াপ", loan: "বুস্ট লোন", tf: "ট্রান্সফার", chg: "পরিবর্তন%", name: "নাম", lp: "সর্বশেষ দাম", nodata: "কোনো ডেটা নেই", buy: "কিনুন", sell: "বিক্রি", limit: "লিমিট প্রাইস", price: "দাম", qty: "পরিমাণ", avail: "উপলব্ধ", amt: "ট্রেড অ্যামাউন্ট", eAmt: "ট্রেড অ্যামাউন্ট দিন", eQty: "পরিমাণ দিন", iU: "USDT ব্যালেন্স অপর্যাপ্ত", iC: "অপর্যাপ্ত", ok: "অর্ডার সম্পন্ন", entrust: "বর্তমান অর্ডার", all: "সব", spot: "স্পট ট্রেডিং", pos: "পজিশন", hi: "সর্বোচ্চ", lo: "সর্বনিম্ন", vol: "২৪ ঘণ্টার ভলিউম", bl: "বাই লং", ss: "সেল শর্ট", time: "সময়", mode: "লেনদেন মোড", oq: "ওপেনিং পরিমাণ", ot: "ওপেনিং সময়", bal: "অ্যাকাউন্ট ব্যালেন্স", yld: "আনুমানিক ইল্ড", openMsg: "পজিশন খোলা হয়েছে", badQ: "ওপেনিং পরিমাণ: 10.00 - 1000000.00", iB: "ব্যালেন্স অপর্যাপ্ত", ta: "মোট অ্যাসেট", funds: "ফান্ডস", quant: "কোয়ান্ট ট্রেডিং", conv: "রূপান্তরিত", frozen: "ফ্রোজেন", cv: "রূপান্তরিত($)", closed: "{n}টি পজিশন বন্ধ · {w} জয়, {l} হার" },
  hi: { home: "होम", market: "बाज़ार", trade: "ट्रेड", options: "ऑप्शन", assets: "एसेट्स", rech: "रिचार्ज", wd: "निकासी", cs: "ग्राहक सेवा", swap: "फ्लैश स्वैप", loan: "बूस्ट लोन", tf: "ट्रांसफर", chg: "बदलाव%", name: "नाम", lp: "ताज़ा कीमत", nodata: "कोई डेटा नहीं", buy: "खरीदें", sell: "बेचें", limit: "लिमिट कीमत", price: "कीमत", qty: "मात्रा", avail: "उपलब्ध", amt: "ट्रेड राशि", eAmt: "ट्रेड राशि दर्ज करें", eQty: "मात्रा दर्ज करें", iU: "USDT बैलेंस अपर्याप्त", iC: "अपर्याप्त", ok: "ऑर्डर पूरा", entrust: "वर्तमान ऑर्डर", all: "सभी", spot: "स्पॉट ट्रेडिंग", pos: "पोज़िशन", hi: "उच्चतम", lo: "न्यूनतम", vol: "24 घंटे वॉल्यूम", bl: "बाय लॉन्ग", ss: "सेल शॉर्ट", time: "समय", mode: "लेनदेन मोड", oq: "ओपनिंग मात्रा", ot: "ओपनिंग समय", bal: "खाता बैलेंस", yld: "अनुमानित यील्ड", openMsg: "पोज़िशन खुली", badQ: "ओपनिंग मात्रा: 10.00 - 1000000.00", iB: "बैलेंस अपर्याप्त", ta: "कुल एसेट्स", funds: "फंड्स", quant: "क्वांट ट्रेडिंग", conv: "परिवर्तित", frozen: "फ्रोज़न", cv: "परिवर्तित($)", closed: "{n} पोज़िशन बंद · {w} जीत, {l} हार" },
  ur: { home: "ہوم", market: "مارکیٹ", trade: "ٹریڈ", options: "آپشنز", assets: "اثاثے", rech: "ریچارج", wd: "نکالیں", cs: "کسٹمر سروس", swap: "فلیش سوئپ", loan: "بوسٹ لون", tf: "ٹرانسفر", chg: "تبدیلی%", name: "نام", lp: "تازہ قیمت", nodata: "کوئی ڈیٹا نہیں", buy: "خریدیں", sell: "بیچیں", limit: "لمٹ قیمت", price: "قیمت", qty: "مقدار", avail: "دستیاب", amt: "ٹریڈ رقم", eAmt: "ٹریڈ رقم درج کریں", eQty: "مقدار درج کریں", iU: "USDT بیلنس ناکافی", iC: "ناکافی", ok: "آرڈر مکمل", entrust: "موجودہ آرڈر", all: "سب", spot: "اسپاٹ ٹریڈنگ", pos: "پوزیشنز", hi: "بلند", lo: "کم", vol: "24 گھنٹے حجم", bl: "بائے لانگ", ss: "سیل شارٹ", time: "وقت", mode: "لین دین موڈ", oq: "اوپننگ مقدار", ot: "اوپننگ وقت", bal: "اکاؤنٹ بیلنس", yld: "متوقع منافع", openMsg: "پوزیشن کھل گئی", badQ: "اوپننگ مقدار: 10.00 - 1000000.00", iB: "بیلنس ناکافی", ta: "کل اثاثے", funds: "فنڈز", quant: "کوانٹ ٹریڈنگ", conv: "تبدیل شدہ", frozen: "منجمد", cv: "تبدیل شدہ($)", closed: "{n} پوزیشن بند · {w} جیت، {l} ہار" },
  ar: { home: "الرئيسية", market: "السوق", trade: "تداول", options: "الخيارات", assets: "الأصول", rech: "شحن", wd: "سحب", cs: "خدمة العملاء", swap: "تبديل سريع", loan: "قرض معزز", tf: "تحويل", chg: "التغير%", name: "الاسم", lp: "آخر سعر", nodata: "لا توجد بيانات", buy: "شراء", sell: "بيع", limit: "سعر محدد", price: "السعر", qty: "الكمية", avail: "المتاح", amt: "مبلغ التداول", eAmt: "أدخل مبلغ التداول", eQty: "أدخل الكمية", iU: "رصيد USDT غير كاف", iC: "غير كاف", ok: "تم تنفيذ الأمر", entrust: "الأوامر الحالية", all: "الكل", spot: "التداول الفوري", pos: "المراكز", hi: "الأعلى", lo: "الأدنى", vol: "حجم 24 ساعة", bl: "شراء طويل", ss: "بيع قصير", time: "الوقت", mode: "نمط المعاملة", oq: "كمية الفتح", ot: "وقت الفتح", bal: "رصيد الحساب", yld: "العائد المقدر", openMsg: "تم فتح المركز", badQ: "كمية الفتح: 10.00 - 1000000.00", iB: "الرصيد غير كاف", ta: "إجمالي الأصول", funds: "الأموال", quant: "التداول الكمي", conv: "المحول", frozen: "مجمد", cv: "المحول($)", closed: "تم إغلاق {n} مركز · {w} ربح، {l} خسارة" },
  fr: { home: "Accueil", market: "Marché", trade: "Trader", options: "Options", assets: "Actifs", rech: "Recharger", wd: "Retirer", cs: "Service client", swap: "Échange flash", loan: "Prêt boost", tf: "Transfert", chg: "Var%", name: "Nom", lp: "Dernier prix", nodata: "Aucune donnée", buy: "Acheter", sell: "Vendre", limit: "Prix limite", price: "Prix", qty: "Quantité", avail: "Disponible", amt: "Montant", eAmt: "Entrez le montant", eQty: "Entrez la quantité", iU: "Solde USDT insuffisant", iC: "Insuffisant", ok: "Ordre exécuté", entrust: "Ordre en cours", all: "Tout", spot: "Trading spot", pos: "Positions", hi: "Haut", lo: "Bas", vol: "Volume 24H", bl: "Acheter Long", ss: "Vendre Short", time: "Durée", mode: "Mode de transaction", oq: "Quantité d'ouverture", ot: "Durée d'ouverture", bal: "Solde du compte", yld: "Rendement estimé", openMsg: "Position ouverte", badQ: "Quantité d'ouverture : 10.00 - 1000000.00", iB: "Solde insuffisant", ta: "Total des actifs", funds: "Fonds", quant: "Trading quantitatif", conv: "converti", frozen: "Gelé", cv: "Converti($)", closed: "{n} position(s) fermée(s) · {w} gain, {l} perte" },
  es: { home: "Inicio", market: "Mercado", trade: "Operar", options: "Opciones", assets: "Activos", rech: "Recargar", wd: "Retirar", cs: "Atención al cliente", swap: "Swap rápido", loan: "Préstamo boost", tf: "Transferir", chg: "Var%", name: "Nombre", lp: "Último precio", nodata: "Sin datos", buy: "Comprar", sell: "Vender", limit: "Precio límite", price: "Precio", qty: "Cantidad", avail: "Disponible", amt: "Monto", eAmt: "Ingrese el monto", eQty: "Ingrese la cantidad", iU: "Saldo USDT insuficiente", iC: "Insuficiente", ok: "Orden ejecutada", entrust: "Orden actual", all: "Todo", spot: "Trading spot", pos: "Posiciones", hi: "Máx", lo: "Mín", vol: "Volumen 24H", bl: "Comprar Long", ss: "Vender Short", time: "Tiempo", mode: "Modo de transacción", oq: "Cantidad de apertura", ot: "Tiempo de apertura", bal: "Saldo de cuenta", yld: "Rendimiento estimado", openMsg: "Posición abierta", badQ: "Cantidad de apertura: 10.00 - 1000000.00", iB: "Saldo insuficiente", ta: "Activos totales", funds: "Fondos", quant: "Trading cuantitativo", conv: "convertido", frozen: "Congelado", cv: "Convertido($)", closed: "{n} posición(es) cerrada(s) · {w} ganada, {l} perdida" },
  de: { home: "Start", market: "Markt", trade: "Handel", options: "Optionen", assets: "Vermögen", rech: "Aufladen", wd: "Auszahlen", cs: "Kundenservice", swap: "Flash-Swap", loan: "Boost-Kredit", tf: "Überweisen", chg: "Änd.%", name: "Name", lp: "Letzter Preis", nodata: "Keine Daten", buy: "Kaufen", sell: "Verkaufen", limit: "Limitpreis", price: "Preis", qty: "Menge", avail: "Verfügbar", amt: "Handelsbetrag", eAmt: "Betrag eingeben", eQty: "Menge eingeben", iU: "USDT-Guthaben unzureichend", iC: "Unzureichend", ok: "Order ausgeführt", entrust: "Aktuelle Order", all: "Alle", spot: "Spot-Handel", pos: "Positionen", hi: "Hoch", lo: "Tief", vol: "24H-Volumen", bl: "Long kaufen", ss: "Short verkaufen", time: "Zeit", mode: "Transaktionsmodus", oq: "Eröffnungsmenge", ot: "Eröffnungszeit", bal: "Kontostand", yld: "Geschätzte Rendite", openMsg: "Position eröffnet", badQ: "Eröffnungsmenge: 10.00 - 1000000.00", iB: "Guthaben unzureichend", ta: "Gesamtvermögen", funds: "Guthaben", quant: "Quant-Handel", conv: "umgerechnet", frozen: "Gesperrt", cv: "Umgerechnet($)", closed: "{n} Position(en) geschlossen · {w} Gewinn, {l} Verlust" },
  pt: { home: "Início", market: "Mercado", trade: "Negociar", options: "Opções", assets: "Ativos", rech: "Recarregar", wd: "Sacar", cs: "Atendimento", swap: "Troca rápida", loan: "Empréstimo boost", tf: "Transferir", chg: "Var%", name: "Nome", lp: "Último preço", nodata: "Sem dados", buy: "Comprar", sell: "Vender", limit: "Preço limite", price: "Preço", qty: "Quantidade", avail: "Disponível", amt: "Valor", eAmt: "Digite o valor", eQty: "Digite a quantidade", iU: "Saldo USDT insuficiente", iC: "Insuficiente", ok: "Ordem executada", entrust: "Ordem atual", all: "Todos", spot: "Negociação spot", pos: "Posições", hi: "Máx", lo: "Mín", vol: "Volume 24H", bl: "Comprar Long", ss: "Vender Short", time: "Tempo", mode: "Modo de transação", oq: "Quantidade de abertura", ot: "Tempo de abertura", bal: "Saldo da conta", yld: "Rendimento estimado", openMsg: "Posição aberta", badQ: "Quantidade de abertura: 10.00 - 1000000.00", iB: "Saldo insuficiente", ta: "Ativos totais", funds: "Fundos", quant: "Negociação quant", conv: "convertido", frozen: "Congelado", cv: "Convertido($)", closed: "{n} posição(ões) fechada(s) · {w} ganho, {l} perda" },
  ru: { home: "Главная", market: "Рынок", trade: "Торговля", options: "Опционы", assets: "Активы", rech: "Пополнить", wd: "Вывод", cs: "Поддержка", swap: "Быстрый обмен", loan: "Буст-кредит", tf: "Перевод", chg: "Изм.%", name: "Название", lp: "Посл. цена", nodata: "Нет данных", buy: "Купить", sell: "Продать", limit: "Лимитная цена", price: "Цена", qty: "Количество", avail: "Доступно", amt: "Сумма сделки", eAmt: "Введите сумму", eQty: "Введите количество", iU: "Недостаточно USDT", iC: "Недостаточно", ok: "Ордер исполнен", entrust: "Текущий ордер", all: "Все", spot: "Спот-торговля", pos: "Позиции", hi: "Макс", lo: "Мин", vol: "Объём 24Ч", bl: "Купить Long", ss: "Продать Short", time: "Время", mode: "Режим сделки", oq: "Объём открытия", ot: "Время открытия", bal: "Баланс счёта", yld: "Ожидаемая доходность", openMsg: "Позиция открыта", badQ: "Объём открытия: 10.00 - 1000000.00", iB: "Недостаточно средств", ta: "Всего активов", funds: "Средства", quant: "Квант-торговля", conv: "пересчитано", frozen: "Заморожено", cv: "Пересчитано($)", closed: "Закрыто позиций: {n} · {w} выигрыш, {l} проигрыш" },
  tr: { home: "Ana Sayfa", market: "Piyasa", trade: "İşlem", options: "Opsiyonlar", assets: "Varlıklar", rech: "Yükle", wd: "Çek", cs: "Müşteri hizmetleri", swap: "Hızlı takas", loan: "Boost kredi", tf: "Transfer", chg: "Değ.%", name: "Ad", lp: "Son fiyat", nodata: "Veri yok", buy: "Al", sell: "Sat", limit: "Limit fiyat", price: "Fiyat", qty: "Miktar", avail: "Kullanılabilir", amt: "İşlem tutarı", eAmt: "Tutar girin", eQty: "Miktar girin", iU: "USDT bakiyesi yetersiz", iC: "Yetersiz", ok: "Emir gerçekleşti", entrust: "Mevcut emir", all: "Tümü", spot: "Spot işlem", pos: "Pozisyonlar", hi: "Yüksek", lo: "Düşük", vol: "24S hacim", bl: "Long Al", ss: "Short Sat", time: "Süre", mode: "İşlem modu", oq: "Açılış miktarı", ot: "Açılış süresi", bal: "Hesap bakiyesi", yld: "Tahmini getiri", openMsg: "Pozisyon açıldı", badQ: "Açılış miktarı: 10.00 - 1000000.00", iB: "Bakiye yetersiz", ta: "Toplam varlık", funds: "Fonlar", quant: "Kuant işlem", conv: "dönüştürülen", frozen: "Dondurulmuş", cv: "Dönüştürülen($)", closed: "{n} pozisyon kapandı · {w} kazanç, {l} kayıp" },
  zh: { home: "首页", market: "行情", trade: "交易", options: "期权", assets: "资产", rech: "充值", wd: "提现", cs: "客服", swap: "闪兑", loan: "助力贷", tf: "划转", chg: "涨跌幅", name: "名称", lp: "最新价", nodata: "暂无数据", buy: "买入", sell: "卖出", limit: "限价", price: "价格", qty: "数量", avail: "可用", amt: "交易额", eAmt: "请输入交易额", eQty: "请输入数量", iU: "USDT 余额不足", iC: "不足", ok: "委托成交", entrust: "当前委托", all: "全部", spot: "现货交易", pos: "持仓", hi: "最高", lo: "最低", vol: "24H成交量", bl: "买涨", ss: "买跌", time: "时间", mode: "交易模式", oq: "开仓数量", ot: "开仓时间", bal: "账户余额", yld: "预计收益", openMsg: "开仓成功", badQ: "开仓数量：10.00 - 1000000.00", iB: "余额不足", ta: "总资产", funds: "资金", quant: "量化交易", conv: "折合", frozen: "冻结", cv: "折合($)", closed: "{n} 个持仓已平仓 · 盈 {w}，亏 {l}" },
  ja: { home: "ホーム", market: "マーケット", trade: "取引", options: "オプション", assets: "資産", rech: "入金", wd: "出金", cs: "カスタマーサービス", swap: "フラッシュスワップ", loan: "ブーストローン", tf: "振替", chg: "変動%", name: "名称", lp: "最新価格", nodata: "データなし", buy: "買い", sell: "売り", limit: "指値", price: "価格", qty: "数量", avail: "利用可能", amt: "取引額", eAmt: "取引額を入力", eQty: "数量を入力", iU: "USDT残高不足", iC: "不足", ok: "注文約定", entrust: "現在の注文", all: "すべて", spot: "現物取引", pos: "ポジション", hi: "高値", lo: "安値", vol: "24H出来高", bl: "買いロング", ss: "売りショート", time: "時間", mode: "取引モード", oq: "建玉数量", ot: "建玉時間", bal: "口座残高", yld: "想定利回り", openMsg: "ポジションを開きました", badQ: "建玉数量：10.00 - 1000000.00", iB: "残高不足", ta: "総資産", funds: "資金", quant: "クオンツ取引", conv: "換算", frozen: "凍結", cv: "換算($)", closed: "{n}件決済 · 勝ち{w}、負け{l}" },
  id: { home: "Beranda", market: "Pasar", trade: "Trading", options: "Opsi", assets: "Aset", rech: "Isi saldo", wd: "Tarik", cs: "Layanan pelanggan", swap: "Tukar cepat", loan: "Pinjaman boost", tf: "Transfer", chg: "Ubah%", name: "Nama", lp: "Harga terakhir", nodata: "Tidak ada data", buy: "Beli", sell: "Jual", limit: "Harga limit", price: "Harga", qty: "Jumlah", avail: "Tersedia", amt: "Nilai trading", eAmt: "Masukkan nilai", eQty: "Masukkan jumlah", iU: "Saldo USDT tidak cukup", iC: "Tidak cukup", ok: "Order terisi", entrust: "Order saat ini", all: "Semua", spot: "Trading spot", pos: "Posisi", hi: "Tertinggi", lo: "Terendah", vol: "Volume 24J", bl: "Beli Long", ss: "Jual Short", time: "Waktu", mode: "Mode transaksi", oq: "Jumlah pembukaan", ot: "Waktu pembukaan", bal: "Saldo akun", yld: "Perkiraan imbal hasil", openMsg: "Posisi dibuka", badQ: "Jumlah pembukaan: 10.00 - 1000000.00", iB: "Saldo tidak cukup", ta: "Total aset", funds: "Dana", quant: "Trading kuantitatif", conv: "dikonversi", frozen: "Dibekukan", cv: "Dikonversi($)", closed: "{n} posisi ditutup · {w} menang, {l} kalah" },
};

/* ---------------- Side-menu + Options extra texts ---------------- */
const T2 = {
  en: { rep: "Reputation score", auth: "Authentication", wait: "Awaiting certification", bind: "Bind withdrawal address", share: "My sharing link", smsg: "System message", night: "Night mode", sec: "Security", notset: "Not set", web: "Website Introduction", logout: "Log out", copied: "Sharing link copied", nomsg: "No new messages", soon: "Coming soon", pl: "Position list", orec: "Order records", kl: "K-line", pp: "Purchase price", fp: "Filled price", pnl: "Profit/Loss", norec: "No records for now", ind: "Indicators" },
  bn: { rep: "রেপুটেশন স্কোর", auth: "ভেরিফিকেশন", wait: "যাচাইয়ের অপেক্ষায়", bind: "উইথড্র অ্যাড্রেস যুক্ত করুন", share: "আমার শেয়ারিং লিংক", smsg: "সিস্টেম মেসেজ", night: "নাইট মোড", sec: "সিকিউরিটি", notset: "সেট করা নেই", web: "ওয়েবসাইট পরিচিতি", logout: "লগ আউট", copied: "শেয়ারিং লিংক কপি হয়েছে", nomsg: "নতুন মেসেজ নেই", soon: "শীঘ্রই আসছে", pl: "পজিশন তালিকা", orec: "অর্ডার রেকর্ড", kl: "কে-লাইন", pp: "ক্রয়মূল্য", fp: "ফিলড প্রাইস", pnl: "লাভ/ক্ষতি", norec: "এখনো কোনো রেকর্ড নেই", ind: "ইন্ডিকেটর" },
  hi: { rep: "प्रतिष्ठा स्कोर", auth: "प्रमाणीकरण", wait: "प्रमाणन की प्रतीक्षा", bind: "निकासी पता जोड़ें", share: "मेरा शेयर लिंक", smsg: "सिस्टम संदेश", night: "नाइट मोड", sec: "सुरक्षा", notset: "सेट नहीं", web: "वेबसाइट परिचय", logout: "लॉग आउट", copied: "शेयर लिंक कॉपी हुआ", nomsg: "कोई नया संदेश नहीं", pl: "पोज़िशन सूची", orec: "ऑर्डर रिकॉर्ड", kl: "के-लाइन", pp: "खरीद मूल्य", fp: "भरा गया मूल्य", pnl: "लाभ/हानि", norec: "अभी कोई रिकॉर्ड नहीं", ind: "इंडिकेटर" },
  ur: { rep: "ساکھ اسکور", auth: "تصدیق", wait: "تصدیق کا انتظار", bind: "نکالنے کا پتہ جوڑیں", share: "میرا شیئرنگ لنک", smsg: "سسٹم پیغام", night: "نائٹ موڈ", sec: "سیکیورٹی", notset: "سیٹ نہیں", web: "ویب سائٹ تعارف", logout: "لاگ آؤٹ", copied: "شیئرنگ لنک کاپی ہو گیا", nomsg: "کوئی نیا پیغام نہیں", pl: "پوزیشن فہرست", orec: "آرڈر ریکارڈ", kl: "کے لائن", pp: "خرید قیمت", fp: "بھری گئی قیمت", pnl: "نفع/نقصان", norec: "ابھی کوئی ریکارڈ نہیں", ind: "انڈیکیٹرز" },
  ar: { rep: "نقاط السمعة", auth: "التوثيق", wait: "بانتظار التوثيق", bind: "ربط عنوان السحب", share: "رابط المشاركة", smsg: "رسالة النظام", night: "الوضع الليلي", sec: "الأمان", notset: "غير مضبوط", web: "نبذة عن الموقع", logout: "تسجيل الخروج", copied: "تم نسخ رابط المشاركة", nomsg: "لا رسائل جديدة", pl: "قائمة المراكز", orec: "سجل الأوامر", kl: "الشموع", pp: "سعر الشراء", fp: "سعر التنفيذ", pnl: "الربح/الخسارة", norec: "لا سجلات حاليا", ind: "المؤشرات" },
  es: { rep: "Puntuación de reputación", auth: "Autenticación", wait: "Pendiente de certificación", bind: "Vincular dirección de retiro", share: "Mi enlace para compartir", smsg: "Mensaje del sistema", night: "Modo noche", sec: "Seguridad", notset: "Sin configurar", web: "Presentación del sitio", logout: "Cerrar sesión", copied: "Enlace copiado", nomsg: "Sin mensajes nuevos", pl: "Lista de posiciones", orec: "Registro de órdenes", kl: "Velas", pp: "Precio de compra", fp: "Precio ejecutado", pnl: "Ganancia/Pérdida", norec: "Sin registros", ind: "Indicadores" },
  fr: { rep: "Score de réputation", auth: "Authentification", wait: "En attente de certification", bind: "Lier l'adresse de retrait", share: "Mon lien de partage", smsg: "Message système", night: "Mode nuit", sec: "Sécurité", notset: "Non défini", web: "Présentation du site", logout: "Déconnexion", copied: "Lien copié", nomsg: "Aucun nouveau message", pl: "Liste des positions", orec: "Historique des ordres", kl: "Bougies", pp: "Prix d'achat", fp: "Prix exécuté", pnl: "Gain/Perte", norec: "Aucun enregistrement", ind: "Indicateurs" },
  de: { rep: "Reputationswert", auth: "Authentifizierung", wait: "Zertifizierung ausstehend", bind: "Auszahlungsadresse binden", share: "Mein Freigabelink", smsg: "Systemnachricht", night: "Nachtmodus", sec: "Sicherheit", notset: "Nicht gesetzt", web: "Webseiten-Vorstellung", logout: "Abmelden", copied: "Link kopiert", nomsg: "Keine neuen Nachrichten", pl: "Positionsliste", orec: "Orderverlauf", kl: "K-Linie", pp: "Kaufpreis", fp: "Ausführungspreis", pnl: "Gewinn/Verlust", norec: "Keine Einträge", ind: "Indikatoren" },
  pt: { rep: "Pontuação de reputação", auth: "Autenticação", wait: "Aguardando certificação", bind: "Vincular endereço de saque", share: "Meu link de compartilhamento", smsg: "Mensagem do sistema", night: "Modo noturno", sec: "Segurança", notset: "Não definido", web: "Apresentação do site", logout: "Sair", copied: "Link copiado", nomsg: "Sem novas mensagens", pl: "Lista de posições", orec: "Registro de ordens", kl: "Candles", pp: "Preço de compra", fp: "Preço executado", pnl: "Lucro/Perda", norec: "Sem registros", ind: "Indicadores" },
  ru: { rep: "Рейтинг репутации", auth: "Аутентификация", wait: "Ожидает проверки", bind: "Привязать адрес вывода", share: "Моя ссылка", smsg: "Системное сообщение", night: "Ночной режим", sec: "Безопасность", notset: "Не задано", web: "О сайте", logout: "Выйти", copied: "Ссылка скопирована", nomsg: "Нет новых сообщений", pl: "Список позиций", orec: "История ордеров", kl: "График", pp: "Цена покупки", fp: "Цена исполнения", pnl: "Прибыль/Убыток", norec: "Записей нет", ind: "Индикаторы" },
  tr: { rep: "İtibar puanı", auth: "Kimlik doğrulama", wait: "Onay bekleniyor", bind: "Çekim adresi bağla", share: "Paylaşım bağlantım", smsg: "Sistem mesajı", night: "Gece modu", sec: "Güvenlik", notset: "Ayarlanmadı", web: "Web sitesi tanıtımı", logout: "Çıkış yap", copied: "Bağlantı kopyalandı", nomsg: "Yeni mesaj yok", pl: "Pozisyon listesi", orec: "Emir kayıtları", kl: "Mum grafiği", pp: "Alış fiyatı", fp: "Gerçekleşen fiyat", pnl: "Kâr/Zarar", norec: "Kayıt yok", ind: "Göstergeler" },
  zh: { rep: "信誉分", auth: "实名认证", wait: "待认证", bind: "绑定提现地址", share: "我的分享链接", smsg: "系统消息", night: "夜间模式", sec: "安全设置", notset: "未设置", web: "网站介绍", logout: "退出登录", copied: "分享链接已复制", nomsg: "暂无新消息", pl: "持仓列表", orec: "委托记录", kl: "K线", pp: "买入价", fp: "成交价", pnl: "盈亏", norec: "暂无记录", ind: "指标" },
  ja: { rep: "信用スコア", auth: "認証", wait: "認証待ち", bind: "出金アドレスを登録", share: "共有リンク", smsg: "システムメッセージ", night: "ナイトモード", sec: "セキュリティ", notset: "未設定", web: "サイト紹介", logout: "ログアウト", copied: "リンクをコピーしました", nomsg: "新着メッセージなし", pl: "ポジション一覧", orec: "注文履歴", kl: "ローソク足", pp: "購入価格", fp: "約定価格", pnl: "損益", norec: "記録なし", ind: "インジケーター" },
  id: { rep: "Skor reputasi", auth: "Autentikasi", wait: "Menunggu sertifikasi", bind: "Ikat alamat penarikan", share: "Tautan bagikan saya", smsg: "Pesan sistem", night: "Mode malam", sec: "Keamanan", notset: "Belum diatur", web: "Pengenalan situs", logout: "Keluar", copied: "Tautan disalin", nomsg: "Tidak ada pesan baru", pl: "Daftar posisi", orec: "Catatan order", kl: "K-line", pp: "Harga beli", fp: "Harga terisi", pnl: "Untung/Rugi", norec: "Belum ada catatan", ind: "Indikator" },
};

/* ---------------- Auth / Deposit / Withdraw / API error texts ---------------- */
const T3 = {
  en: { login: "login", register: "register", acc: "Please enter your email", pw: "Please enter your password", pw2: "Please re-enter your password", forgot: "Forgot password", rem: "Remember account", email: "Email", bEmail: "Enter a valid email address", bPw: "Password must be at least 6 characters", bMatch: "Passwords do not match", exists: "This email is already registered", noUser: "Account not found", wrongPw: "Wrong password", reset: "Reset password", newPw: "Please enter a new password", resetOk: "Password updated, please log in", dep: "Deposit", coin: "Coin", net: "Network", addr: "Withdrawal address", eAddr: "Enter withdrawal address", bAddr: "Invalid withdrawal address", fee: "Fee", recv: "You will receive", depOk: "Deposit submitted", wdOk: "Withdrawal submitted", hist: "History", proc: "Processing", done: "Completed", feeLow: "Amount must be greater than the fee", amount: "Amount", submit: "Submit", hasAcc: "Back to login", topup: "Demo top-up (+1000 USDT)", topOk: "Demo balance added",
    neterr: "Network error. Server may be waking up, try again", err: "Request failed", unauthorized: "Session expired, please log in", badSym: "Invalid coin", badSide: "Invalid side", badDir: "Invalid direction", badSec: "Invalid time", badCoin: "Invalid coin/network", badInterval: "Invalid interval", forbidden: "Not allowed", wait2: "Please wait..." },
  bn: { login: "লগইন", register: "রেজিস্টার", acc: "আপনার ইমেইল লিখুন", pw: "পাসওয়ার্ড লিখুন", pw2: "পাসওয়ার্ড আবার লিখুন", forgot: "পাসওয়ার্ড ভুলে গেছেন", rem: "অ্যাকাউন্ট মনে রাখুন", email: "ইমেইল", bEmail: "সঠিক ইমেইল দিন", bPw: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", bMatch: "পাসওয়ার্ড মিলছে না", exists: "এই ইমেইল আগেই রেজিস্টার করা", noUser: "অ্যাকাউন্ট পাওয়া যায়নি", wrongPw: "পাসওয়ার্ড ভুল", reset: "পাসওয়ার্ড রিসেট", newPw: "নতুন পাসওয়ার্ড লিখুন", resetOk: "পাসওয়ার্ড বদলেছে, লগইন করুন", dep: "ডিপোজিট", coin: "কয়েন", net: "নেটওয়ার্ক", addr: "উইথড্র অ্যাড্রেস", eAddr: "উইথড্র অ্যাড্রেস দিন", bAddr: "অ্যাড্রেস সঠিক নয়", fee: "ফি", recv: "আপনি পাবেন", depOk: "ডিপোজিট জমা হয়েছে", wdOk: "উইথড্র জমা হয়েছে", hist: "ইতিহাস", proc: "প্রসেসিং", done: "সম্পন্ন", feeLow: "পরিমাণ ফি-এর চেয়ে বেশি হতে হবে", amount: "পরিমাণ", submit: "জমা দিন", hasAcc: "লগইনে ফিরুন", topup: "ডেমো টপ-আপ (+1000 USDT)", topOk: "ডেমো ব্যালেন্স যোগ হয়েছে",
    neterr: "নেটওয়ার্ক সমস্যা। সার্ভার জেগে উঠছে হতে পারে, আবার চেষ্টা করুন", err: "অনুরোধ ব্যর্থ হয়েছে", unauthorized: "সেশন শেষ, আবার লগইন করুন", badSym: "কয়েন সঠিক নয়", badSide: "সাইড সঠিক নয়", badDir: "ডিরেকশন সঠিক নয়", badSec: "সময় সঠিক নয়", badCoin: "কয়েন/নেটওয়ার্ক সঠিক নয়", badInterval: "ইন্টারভাল সঠিক নয়", forbidden: "অনুমতি নেই", wait2: "অপেক্ষা করুন..." },
};

const LangCtx = createContext({ lang: "en", t: (k) => k });
const useT = () => useContext(LangCtx).t;

const fmt = (p) => (p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(4) : p >= 0.01 ? p.toFixed(6) : p.toFixed(8));
const fmtV = (v) => (v >= 1e9 ? (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? (v / 1e3).toFixed(2) + "K" : v.toFixed(2));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------------- API helper ---------------- */
let TOKEN = store.get("cx_token", "");
let ON401 = () => {};
const setToken = (v) => { TOKEN = v; store.set("cx_token", v); };
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot"];

async function api(path, opt = {}) {
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
    if (r.status === 401 && !AUTH_PATHS.includes(path)) { ON401(); throw new Error("unauthorized"); }
    throw new Error(code);
  }
  return j;
}

function usePrices() {
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

const Ic = ({ d, s = 24 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>);
const ICON = {
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
function Coin({ s, size = 42 }) {
  const [n, setN] = useState(0);
  const src = logoSrc(s);
  if (n >= src.length) return <span className="cx-coin" style={{ background: COL[s] || BLUE, width: size, height: size }}>{s[0]}</span>;
  return <img key={s + n} className="cx-coin img" src={src[n]} width={size} height={size} alt={s} loading="lazy" referrerPolicy="no-referrer" onError={() => setN(n + 1)} />;
}

function LangPicker({ lang, setLang }) {
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
              <button key={k} className={k === lang ? "on" : ""} onClick={() => { setLang(k); setOpen(false); }}><span>{n}</span><span className="cx-fl">{f}</span></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AuBar({ title, onBack, onHelp }) {
  return (
    <div className="cx-ab">
      <button onClick={onBack} aria-label="back">‹</button>
      <h1>{title}</h1>
      <button onClick={onHelp} aria-label="support"><Ic d={ICON.headset} s={28} /></button>
    </div>
  );
}

/* ====================== HOME ====================== */
const BANNERS = [img1, img2, img3];

function List({ P, go, names }) {
  const t = useT();
  return (
    <>
      <div className="cx-th"><span>{t("name")}</span><span>{t("lp")}</span><span>{t("chg")}</span></div>
      {COINS.map((s) => (
        <button key={s} className="cx-row" onClick={() => go("exchange", s)}>
          <span className="cx-nm">
            <Coin s={s} size={names ? 38 : 42} />
            {names ? <span><b>{s}<small>/USDT</small></b><small>24H {P[s].vol}</small></span> : <b>{s}<small>/USDT</small></b>}
          </span>
          <span className="cx-pr">{names ? <><b>{fmt(P[s].price)}</b><small>$ {P[s].price.toFixed(2)}</small></> : <b>{fmt(P[s].price)}</b>}</span>
          <span className="cx-pill" style={{ background: P[s].chg >= 0 ? GREEN : RED }}>{P[s].chg >= 0 ? "+" : ""}{Math.abs(P[s].chg) < 0.005 ? "0" : P[s].chg.toFixed(2)}%</span>
        </button>
      ))}
    </>
  );
}

function Home({ P, go, lang, setLang, onMenu, notify }) {
  const t = useT();
  const [i, setI] = useState(0), [k, setK] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % BANNERS.length), 3500); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(() => setK((x) => (x + 3) % COINS.length), 4000); return () => clearInterval(id); }, []);
  const tick = [0, 1, 2].map((n) => COINS[(k + n) % COINS.length]);
  const grid = [
    [ICON.card, "rech", () => go("deposit")], [ICON.card, "wd", () => go("withdraw")],
    [ICON.chat, "cs", () => notify(t("soon"))], [ICON.swap, "swap", () => go("exchange")],
    [ICON.loan, "loan", () => notify(t("soon"))], [ICON.card, "tf", () => go("assets")],
  ];
  return (
    <>
      <div className="cx-bar">
        <button className="cx-logo" onClick={onMenu} aria-label="menu">C</button>
        <LangPicker lang={lang} setLang={setLang} />
      </div>
      <div className="cx-banner">
        <div className="cx-slides" style={{ transform: `translateX(-${i * 100}%)` }}>{BANNERS.map((b, n) => <img key={n} src={b} alt="" draggable="false" />)}</div>
        <div className="cx-dots">{BANNERS.map((_, d) => <i key={d} className={d === i ? "on" : ""} onClick={() => setI(d)} />)}</div>
      </div>
      <div className="cx-tick">
        {tick.map((s) => (
          <button key={s} onClick={() => go("exchange", s)}>
            <span>{s}/USDT</span>
            <b style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{fmt(P[s].price)}</b>
            <em style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{P[s].chg.toFixed(2)}%</em>
          </button>
        ))}
      </div>
      <div className="cx-grid">
        {grid.map(([ic, l, fn]) => <button key={l} onClick={fn}><span style={{ color: "#17c3c9", display: "flex" }}><Ic d={ic} s={30} /></span>{t(l)}</button>)}
      </div>
      <h3 className="cx-h">{t("chg")}</h3>
      <List P={P} go={go} />
    </>
  );
}

/* ====================== DASHBOARD ====================== */
function CoinDrawer({ P, onPick, onClose }) {
  const t = useT();
  return (
    <div className="cx-over" onClick={onClose}>
      <div className="cx-drawer" onClick={(e) => e.stopPropagation()}>
        <h2>{t("spot")}</h2><h3>USDT</h3>
        {COINS.map((s) => (
          <button key={s} onClick={() => onPick(s)}>
            <span className="cx-dn"><Coin s={s} size={30} /><b>{s}<small>/USDT</small></b></span>
            <span style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{fmt(P[s].price)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SideMenu({ open, onClose, me, logout, dark, setDark, go, notify }) {
  const t = useT();
  const share = async () => {
    let link = (typeof window !== "undefined" ? window.location.origin : "") + "/?ref=" + me.uid;
    try {
      const j = await api("/user/share-link");
      if (typeof j === "string" && j) link = j.startsWith("/") ? (typeof window !== "undefined" ? window.location.origin : "") + j : j;
    } catch {}
    try { navigator.clipboard && navigator.clipboard.writeText(link).catch(() => {}); } catch {}
    notify(t("copied"));
  };
  const soon = () => notify(t("soon"));
  const rows = [
    ["idcard", t("auth"), t("wait"), true, soon],
    ["pin", t("bind"), "", false, () => { onClose(); go("withdraw"); }],
    ["share", t("share"), "", false, share],
    ["bell", t("smsg"), "", false, () => notify(t("nomsg"))],
    ["moon", t("night"), "switch", false, () => setDark(!dark)],
    ["lock", t("sec"), t("notset"), true, soon],
    ["user", t("web"), "", false, soon],
  ];
  return (
    <div className={"cx-mo" + (open ? " open" : "")} onClick={onClose}>
      <aside className="cx-md" onClick={(e) => e.stopPropagation()}>
        <div className="cx-mp"><p>{me.email}</p><p>UID:{me.uid}</p><p>VIP:{me.vip ?? 0}</p><p>{t("rep")} : {me.reputation ?? 0}</p></div>
        {rows.map(([ic, label, val, red, fn]) => (
          <button key={ic} className="cx-mr" onClick={fn}>
            <span className="cx-mi"><Ic d={ICON[ic]} s={28} /></span>
            <span className="cx-ml">{label}</span>
            {val === "switch" ? <span className={"cx-sw" + (dark ? " on" : "")}><i /></span> : <>{val && <span className={"cx-mv" + (red ? " red" : "")}>{val}</span>}<span className="cx-ar">›</span></>}
          </button>
        ))}
        <button className="cx-lo" onClick={() => { onClose(); logout(); }}>{t("logout")}</button>
      </aside>
    </div>
  );
}

function Market({ P, go }) {
  const t = useT();
  const [m, setM] = useState("USDT"), [sub, setSub] = useState("All");
  return (
    <>
      <div className="cx-top"><button onClick={() => go("home")}>‹</button><h1>{t("market")}</h1><span /></div>
      <div className="cx-tabs">{MARKETS.map((x) => <button key={x} className={m === x ? "on" : ""} onClick={() => setM(x)}>{x}</button>)}</div>
      <div className="cx-tabs two">{["All", "NFT"].map((x) => <button key={x} className={sub === x ? "on" : ""} onClick={() => setSub(x)}>{x === "All" ? t("all") : x}</button>)}</div>
      {m === "USDT" && sub === "All" ? <List P={P} go={go} names /> : <div className="cx-empty">{t("nodata")}</div>}
    </>
  );
}

/* ---- Exchange (spot) → POST /spot/order, GET /spot/orders ---- */
function Exchange({ P, W, sym, setSym, go, spot }) {
  const t = useT();
  const [side, setSide] = useState("buy"), [price, setPrice] = useState(""), [q, setQ] = useState(""), [amt, setAmt] = useState("");
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [pick, setPick] = useState(false);
  const d = P[sym];
  const book = useMemo(() => {
    const mk = (k) => Array.from({ length: 5 }, (_, i) => [d.price * (1 + k * 0.0004 * (i + 1)), Math.random() * 1.2 + 0.001]);
    return { a: mk(1).reverse(), b: mk(-1) };
  }, [Math.round(d.price)]); // eslint-disable-line
  const usdt = W.w.USDT || 0, held = W.w[sym] || 0;
  const px = parseFloat(price) || d.price;
  const est = side === "buy" ? (parseFloat(amt) || 0) / px : (parseFloat(q) || 0);
  const pct = (p) => { if (side === "buy") setAmt(String(+(usdt * p).toFixed(2))); else setQ(String(+(held * p).toFixed(8))); };
  const submit = async () => {
    if (busy) return;
    setMsg("");
    try {
      if (side === "buy") {
        const a = parseFloat(amt) || 0;
        if (a <= 0) return setMsg(t("eAmt"));
        if (a > usdt) return setMsg(t("iU"));
        setBusy(true);
        await api("/spot/order", { method: "POST", body: { sym, side: "buy", amount: a } });
      } else {
        const n = parseFloat(q) || 0;
        if (n <= 0) return setMsg(t("eQty"));
        if (n > held) return setMsg(t("iC") + " " + sym);
        setBusy(true);
        await api("/spot/order", { method: "POST", body: { sym, side: "sell", qty: n } });
      }
      await W.reload();
      setAmt(""); setQ(""); setMsg(t("ok"));
    } catch (e) { setMsg(t(e.message)); }
    setBusy(false);
  };
  const R = ({ r, c }) => (<div className="cx-bk"><b style={{ color: c }}>{r[0].toFixed(6)}</b><span>{r[1].toFixed(6)}</span></div>);
  return (
    <>
      <div className="cx-top">
        <button onClick={() => setPick(true)}><Ic d={ICON.menu} s={26} /></button>
        <h1 style={{ textAlign: "start", display: "flex", alignItems: "center", gap: 8 }}><Coin s={sym} size={28} />{sym}/USDT <small style={{ color: d.chg >= 0 ? GREEN : RED }}>{d.chg.toFixed(2)} %</small></h1>
        <button onClick={() => go("options")}><Ic d={ICON.market} s={26} /></button>
      </div>
      <div className="cx-ex">
        <div className="cx-book">
          <div className="cx-bh"><span>{t("price")}</span><span>{t("qty")}</span></div>
          {book.a.map((r, i) => <R key={"a" + i} r={r} c={RED} />)}
          <div className="cx-mid" style={{ color: d.chg >= 0 ? GREEN : RED }}>{fmt(d.price)}<small>≈ {d.price.toFixed(2)}</small></div>
          {book.b.map((r, i) => <R key={"b" + i} r={r} c={GREEN} />)}
        </div>
        <div className="cx-form">
          <div className="cx-bs">
            <button className={"bb" + (side === "buy" ? " on" : "")} onClick={() => setSide("buy")}>{t("buy")}</button>
            <button className={"sb" + (side === "sell" ? " on" : "")} onClick={() => setSide("sell")}>{t("sell")}</button>
          </div>
          <div className="cx-sel">{t("limit")} ⌄</div>
          <div className="cx-in"><input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t("price")} inputMode="decimal" /><button onClick={() => setPrice(fmt(px * 1.001))}>+</button><button onClick={() => setPrice(fmt(px * 0.999))}>−</button></div>
          <small>≈ {fmt(px)}</small>
          <div className="cx-in"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("qty")} inputMode="decimal" /><b>{sym}</b></div>
          <small>{t("avail")} {side === "buy" ? usdt.toFixed(8) + " USDT" : held.toFixed(8) + " " + sym}<br />{side === "buy" ? t("buy") : t("sell")} {est ? est.toFixed(6) : "0"} {sym}</small>
          <div className="cx-pc">{[0.25, 0.5, 0.75, 1].map((p) => <button key={p} onClick={() => pct(p)}>{p * 100}%</button>)}</div>
          <div className="cx-in"><input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={t("amt")} inputMode="decimal" /><b>USDT</b></div>
          {msg && <p className="cx-msg">{msg}</p>}
          <button className="cx-cta" style={{ background: side === "buy" ? GREEN : RED, opacity: busy ? 0.6 : 1 }} onClick={submit}>{busy ? t("wait2") : (side === "buy" ? t("buy") : t("sell")) + " " + sym}</button>
        </div>
      </div>
      <div className="cx-ent"><span>{t("entrust")} <b style={{ color: BLUE }}>{t("buy")} ⌄</b></span><span>{t("all")}</span></div>
      {spot.length ? spot.slice(0, 30).map((o) => (
        <div key={o.id} className="cx-tx">
          <span><b style={{ color: o.side === "buy" ? CUP : CDN }}>{o.side === "buy" ? t("buy") : t("sell")} {o.sym}/USDT</b><small>{fmt(o.price || 0)} · {(o.qty || 0).toFixed(6)} · {new Date(o.created_at).toLocaleString()}</small></span>
          <span>{(o.amount || 0).toFixed(2)} USDT</span>
        </div>
      )) : <div className="cx-empty" style={{ height: 120 }} />}
      {pick && <CoinDrawer P={P} onClose={() => setPick(false)} onPick={(s) => { setSym(s); setPick(false); }} />}
    </>
  );
}

/* ---- Candle chart ---- */
const IVS = [["1m", "1m"], ["5m", "5m"], ["15m", "15m"], ["1h", "1H"], ["4h", "4H"], ["1d", "D"]];
const IVMS = { "1m": 6e4, "5m": 3e5, "15m": 9e5, "1h": 36e5, "4h": 144e5, "1d": 864e5 };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function synth(price, iv, n = 200) {
  const ms = IVMS[iv], now = Math.floor(Date.now() / ms) * ms;
  let seed = (Math.round(price * 100) % 9973) + iv.length + 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const vol = iv === "1d" ? 0.025 : iv === "4h" ? 0.012 : iv === "1h" ? 0.006 : 0.002;
  const arr = []; let c = price;
  for (let i = 0; i < n; i++) {
    const o = c / (1 + (rnd() - 0.5) * vol * 2);
    const h = Math.max(o, c) * (1 + rnd() * vol * 0.5), l = Math.min(o, c) * (1 - rnd() * vol * 0.5);
    arr.unshift({ t: now - i * ms, o, h, l, c, v: (rnd() * 0.8 + 0.2) * 1000 });
    c = o;
  }
  return arr;
}
const niceStep = (range, target) => { const raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag; return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag; };
const decOf = (p) => (p >= 100 ? 2 : p >= 1 ? 4 : p >= 0.01 ? 6 : 8);
const fmtT = (ts, iv) => { const d = new Date(ts), z = (x) => String(x).padStart(2, "0"); return iv === "1d" ? d.getDate() + " " + MON[d.getMonth()] : z(d.getHours()) + ":" + z(d.getMinutes()); };

function Chart({ sym, price }) {
  const t = useT();
  const wrap = useRef(null);
  const [w, setW] = useState(360), [iv, setIv] = useState("1d"), [ivOpen, setIvOpen] = useState(false), [data, setData] = useState([]);
  const [n, setN] = useState(40), [off, setOff] = useState(0), [hov, setHov] = useState(null);
  const priceRef = useRef(price); priceRef.current = price;

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 360));
    ro.observe(el); setW(el.clientWidth || 360);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let stop = false;
    setOff(0); setHov(null);
    const load = async () => {
      try {
        if (sym === "BSV") throw 0;
        const j = await api(`/market/klines?sym=${sym}&interval=${iv}&limit=300`);
        if (!j || !j.length) throw 0;
        if (!stop) setData(j);
      } catch { if (!stop) setData((o) => (o.length && o.__sym === sym + iv ? o : Object.assign(synth(priceRef.current, iv), { __sym: sym + iv }))); }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { stop = true; clearInterval(id); };
  }, [sym, iv]);

  const cs = useMemo(() => {
    if (!data.length || !price) return data;
    const a = data.slice(), l = a[a.length - 1];
    a[a.length - 1] = { ...l, c: price, h: Math.max(l.h, price), l: Math.min(l.l, price) };
    return a;
  }, [data, price]);
  const ma = useMemo(() => cs.map((_, i) => (i < 8 ? null : cs.slice(i - 8, i + 1).reduce((s, x) => s + x.c, 0) / 9)), [cs]);

  const AX = 66, H1 = 340, GAP = 12, H2 = 90, TA = 28, H = H1 + GAP + H2 + TA;
  const pw = Math.max(100, w - AX);
  const end = Math.max(1, cs.length - off), start = Math.max(0, end - n);
  const vis = cs.slice(start, end), len = vis.length;
  const step = pw / n, x0 = pw - len * step;
  const cx = (k) => x0 + (k + 0.5) * step;

  let hi = -Infinity, lo = Infinity, vmax = 0;
  vis.forEach((c, k) => { hi = Math.max(hi, c.h); lo = Math.min(lo, c.l); vmax = Math.max(vmax, c.v); const m = ma[start + k]; if (m) { hi = Math.max(hi, m); lo = Math.min(lo, m); } });
  if (!isFinite(hi) || !len) { hi = 1; lo = 0; vmax = 1; }
  const padp = (hi - lo) * 0.06 || hi * 0.01;
  hi += padp; lo -= padp;
  const y = (p) => 6 + ((hi - p) / (hi - lo)) * (H1 - 12);
  const vy = (v) => H1 + GAP + H2 - 4 - (v / (vmax || 1)) * (H2 - 14);
  const dec = decOf(price || 1);
  const ps = niceStep(hi - lo, 8);
  const ticks = [];
  for (let p = Math.ceil(lo / ps) * ps; p <= hi; p += ps) ticks.push(p);
  const every = Math.max(1, Math.ceil(len / 5));
  const last = vis[len - 1];
  const cur = hov && vis[hov.k] ? vis[hov.k] : last;
  const curIdx = hov && vis[hov.k] ? start + hov.k : start + len - 1;
  const up = (c) => c.c >= c.o;
  const colr = cur ? (up(cur) ? CUP : CDN) : CUP;
  const lastCol = cs.length && up(cs[cs.length - 1]) ? CUP : CDN;
  const maPts = vis.map((c, k) => ({ m: ma[start + k], k })).filter((a) => a.m).map((a) => `${cx(a.k)},${y(a.m)}`).join(" ");

  const ptr = useRef(new Map()), gs = useRef({}), offR = useRef(0), nR = useRef(40);
  offR.current = off; nR.current = n;
  const maxOff = Math.max(0, cs.length - 10);
  const hover = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    if (px > pw || px < x0 || !len) return setHov(null);
    setHov({ k: Math.max(0, Math.min(len - 1, Math.floor((px - x0) / step))), x: px, y: py });
  };
  const dist = () => { const a = [...ptr.current.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };
  const onDown = (e) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    ptr.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.current.size === 2) { gs.current = { d: dist(), n: nR.current }; setHov(null); }
    else gs.current = { x: e.clientX, off: offR.current, mv: false };
    hover(e);
  };
  const onMv = (e) => {
    if (ptr.current.has(e.pointerId)) ptr.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.current.size >= 2) { setN(Math.max(10, Math.min(200, Math.round(gs.current.n * gs.current.d / dist())))); return; }
    if (ptr.current.size === 1) {
      const dx = e.clientX - gs.current.x;
      if (gs.current.mv || Math.abs(dx) > 6) { gs.current.mv = true; setHov(null); setOff(Math.max(0, Math.min(maxOff, gs.current.off + Math.round(dx / step)))); return; }
    }
    hover(e);
  };
  const onUp = (e) => {
    ptr.current.delete(e.pointerId);
    const r = [...ptr.current.values()][0];
    if (r) gs.current = { x: r.x, off: offR.current, mv: true };
  };
  const onWheel = (e) => setN((x) => Math.max(10, Math.min(200, Math.round(x * (e.deltaY > 0 ? 1.1 : 0.9)))));
  const chgv = cur ? cur.c - cur.o : 0;
  const vma = (() => { const i = curIdx; const s = cs.slice(Math.max(0, i - 19), i + 1); return s.length ? s.reduce((a, x) => a + x.v, 0) / s.length : 0; })();
  const ivl = (IVS.find((a) => a[0] === iv) || [])[1];

  return (
    <div className="cx-chartw" ref={wrap}>
      <div className="cx-ctool">
        <div className="cx-ivw">
          <button onClick={() => setIvOpen(!ivOpen)}>{ivl}</button>
          {ivOpen && <div className="cx-ivm">{IVS.map(([k, l]) => <button key={k} className={k === iv ? "on" : ""} onClick={() => { setIv(k); setIvOpen(false); }}>{l}</button>)}</div>}
        </div>
        <span className="cx-cti"><Ic d={ICON.candle} s={18} /></span>
        <span className="cx-cti ind">∿ {t("ind")}</span>
      </div>
      <div className="cx-cwrap" style={{ height: H }}>
        {cur && (
          <div className="cx-chead" style={{ color: colr }}>
            <div><span className="cx-gt2">{sym.toLowerCase()}usdt, {ivl}</span>{" "}O{cur.o.toFixed(dec)} H{cur.h.toFixed(dec)} L{cur.l.toFixed(dec)} C{cur.c.toFixed(dec)} {chgv >= 0 ? "+" : ""}{chgv.toFixed(dec)} ({chgv >= 0 ? "+" : ""}{((chgv / cur.o) * 100).toFixed(2)}%)</div>
            <div className="cx-gt2">MA (9, close, 0) <span style={{ color: "#e8914f" }}>{ma[curIdx] ? ma[curIdx].toFixed(4) : "n/a"}</span></div>
          </div>
        )}
        <svg width={w} height={H} onPointerDown={onDown} onPointerMove={onMv} onPointerUp={onUp} onPointerCancel={onUp}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") setHov(null); }} onWheel={onWheel} style={{ touchAction: "none", display: "block" }}>
          {ticks.map((p) => (
            <g key={p}>
              <line x1="0" x2={pw} y1={y(p)} y2={y(p)} className="cx-gl" />
              <line x1={pw} x2={pw + 4} y1={y(p)} y2={y(p)} className="cx-ax" />
              <text x={pw + 8} y={y(p) + 4} className="cx-gt" fontSize="11">{p.toFixed(dec > 2 ? dec : 2)}</text>
            </g>
          ))}
          <line x1={pw} x2={pw} y1="0" y2={H - TA} className="cx-ax" />
          <line x1="0" x2={w} y1={H1 + GAP / 2} y2={H1 + GAP / 2} className="cx-ax" />
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={pw} x2={pw + 4} y1={vy(vmax * f)} y2={vy(vmax * f)} className="cx-ax" />
              <text x={pw + 8} y={vy(vmax * f) + 4} className="cx-gt" fontSize="11">{fmtV(vmax * f)}</text>
            </g>
          ))}
          {vis.map((c, k) => k % every === 0 && (<text key={"t" + k} x={cx(k)} y={H - 9} textAnchor="middle" className="cx-gt" fontSize="11">{fmtT(c.t, iv)}</text>))}
          {vis.map((c, k) => {
            const col = up(c) ? CUP : CDN, bw = Math.max(3, step * 0.78), top = y(Math.max(c.o, c.c)), bh = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
            return (
              <g key={c.t}>
                <rect x={cx(k) - bw / 2} y={vy(c.v)} width={bw} height={H1 + GAP + H2 - 4 - vy(c.v)} fill={col} opacity=".4" />
                <line x1={cx(k)} x2={cx(k)} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1.6" />
                <rect x={cx(k) - bw / 2} y={top} width={bw} height={bh} fill={col} />
              </g>
            );
          })}
          {maPts && <polyline points={maPts} fill="none" stroke="#e8a46b" strokeWidth="1" />}
          {off === 0 && price > lo && price < hi && (
            <g>
              <line x1="0" x2={pw} y1={y(price)} y2={y(price)} stroke={lastCol} strokeWidth="1" strokeDasharray="1 2" />
              <rect x={pw} y={y(price) - 10} width={AX} height="20" fill={lastCol} />
              <text x={pw + 6} y={y(price) + 4} fill="#fff" fontSize="11">{price.toFixed(dec > 2 ? dec : 2)}</text>
            </g>
          )}
          {hov && vis[hov.k] && (
            <g>
              <line x1={cx(hov.k)} x2={cx(hov.k)} y1="0" y2={H - TA} className="cx-ch" />
              {hov.y < H1 && <>
                <line x1="0" x2={pw} y1={hov.y} y2={hov.y} className="cx-ch" />
                <rect x={pw} y={hov.y - 10} width={AX} height="20" fill="#4a5568" />
                <text x={pw + 6} y={hov.y + 4} fill="#fff" fontSize="11">{(hi - ((hov.y - 6) / (H1 - 12)) * (hi - lo)).toFixed(dec > 2 ? dec : 2)}</text>
              </>}
              <rect x={Math.max(0, Math.min(pw - 74, cx(hov.k) - 37))} y={H - TA + 2} width="74" height="20" fill="#4a5568" />
              <text x={Math.max(0, Math.min(pw - 74, cx(hov.k) - 37)) + 37} y={H - TA + 16} textAnchor="middle" fill="#fff" fontSize="11">{fmtT(vis[hov.k].t, iv)}</text>
            </g>
          )}
          <text x="8" y={H1 + GAP + 14} className="cx-gt" fontSize="11">Volume (20) <tspan fill={colr}>{cur ? fmtV(cur.v) : ""}</tspan> <tspan fill="#e8914f">{fmtV(vma)}</tspan></text>
        </svg>
        <div className="cx-zoom">
          <button onClick={() => setN((x) => Math.min(200, Math.round(x * 1.3)))}>−</button>
          <button onClick={() => setN((x) => Math.max(10, Math.round(x / 1.3)))}>+</button>
          <button onClick={() => setOff((o) => Math.min(Math.max(0, cs.length - 10), o + Math.max(1, Math.round(n / 4))))}>‹</button>
          <button onClick={() => setOff((o) => Math.max(0, o - Math.max(1, Math.round(n / 4))))}>›</button>
        </div>
        <button className="cx-gear" onClick={() => { setOff(0); setN(40); }} aria-label="reset"><Ic d={ICON.gear} s={18} /></button>
      </div>
    </div>
  );
}

/* ---- Options → POST /options/open ---- */
function Options({ P, W, sym, setSym, pos, orders }) {
  const t = useT();
  const [qty, setQty] = useState(10), [sec, setSec] = useState(20), [sheet, setSheet] = useState(false), [, tick] = useState(0);
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [view, setView] = useState("k"), [ptab, setPtab] = useState("list"), [pick, setPick] = useState(false);
  const d = P[sym];
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(id); }, []);
  const open = async (dir) => {
    if (busy) return;
    setMsg("");
    const bal = W.w.USDT || 0;
    if (qty < 10 || qty > 1000000) return setMsg(t("badQ"));
    if (qty > bal) return setMsg(t("iB"));
    setBusy(true);
    try {
      await api("/options/open", { method: "POST", body: { sym, direction: dir, qty, sec } });
      await W.reload();
      setSheet(false); setMsg(t("openMsg"));
    } catch (e) { setMsg(t(e.message)); }
    setBusy(false);
  };
  return (
    <>
      <div className="cx-top">
        <button onClick={() => setPick(true)}><Ic d={ICON.menu} s={26} /></button>
        <h1 style={{ textAlign: "start", display: "flex", alignItems: "center", gap: 8 }}><Coin s={sym} size={28} />{sym}/USDT</h1>
        <button className="cx-link" onClick={() => setView(view === "k" ? "p" : "k")}>{view === "k" ? t("pos") : t("kl")} <Ic d={view === "k" ? ICON.doc : ICON.candle} s={22} /></button>
      </div>
      {view === "k" ? (
        <>
          <div className="cx-opt-h">
            <b style={{ color: d.chg >= 0 ? GREEN : RED }}>{d.price.toFixed(6)}<small>{d.chg.toFixed(2)} %</small></b>
            <div><span>{t("hi")}</span><i>{fmt(d.hi)}</i><span>{t("lo")}</span><i>{fmt(d.lo)}</i><span>{t("vol")}</span><i>{d.vol.toFixed(2)}</i></div>
          </div>
          <Chart sym={sym} price={d.price} />
          {msg && <p className="cx-msg">{msg}</p>}
          <div style={{ height: 110 }} />
          <div className="cx-obar">
            <button onClick={() => setSheet(true)}>{t("qty")} ⌄<b>{qty.toFixed(2)}</b></button>
            <button onClick={() => setSheet(true)}>{t("time")} ⌄<b>{sec}s</b></button>
            <button className="g" style={{ opacity: busy ? 0.6 : 1 }} onClick={() => open("long")}>{t("bl")}</button>
            <button className="r" style={{ opacity: busy ? 0.6 : 1 }} onClick={() => open("short")}>{t("ss")}</button>
          </div>
        </>
      ) : (
        <>
          <div className="cx-tabs two cx-ptabs">
            <button className={ptab === "list" ? "on" : ""} onClick={() => setPtab("list")}>{t("pl")}</button>
            <button className={ptab === "rec" ? "on" : ""} onClick={() => setPtab("rec")}>{t("orec")}</button>
          </div>
          <div className="cx-tbl cx-tbh"><span>{t("qty")}</span><span>{t("pp")}</span><span>{t("fp")}</span><span>{t("pnl")}</span></div>
          {ptab === "list" && pos.map((p) => {
            const c = P[p.sym] ? P[p.sym].price : p.open;
            const win = p.dir === "long" ? c > p.open : c < p.open;
            return (
              <div key={p.id} className="cx-tbl">
                <span><Coin s={p.sym} size={18} /> {p.qty}<small>{p.sym} · {p.dir === "long" ? t("bl") : t("ss")} · {Math.max(0, Math.ceil((p.end - Date.now()) / 1000))}s</small></span>
                <span>{fmt(p.open)}</span><span>{fmt(c)}</span>
                <span style={{ color: win ? CUP : CDN }}>{win ? "+" : "-"}{(win ? p.qty * YIELD : p.qty).toFixed(2)}</span>
              </div>
            );
          })}
          {ptab === "rec" && orders.map((o) => (
            <div key={o.id} className="cx-tbl">
              <span><Coin s={o.sym} size={18} /> {o.qty}<small>{o.sym} · {o.dir === "long" ? t("bl") : t("ss")}</small></span>
              <span>{fmt(o.open)}</span><span>{fmt(o.close)}</span>
              <span style={{ color: o.pnl >= 0 ? CUP : CDN }}>{o.pnl >= 0 ? "+" : ""}{o.pnl.toFixed(2)}</span>
            </div>
          ))}
          {((ptab === "list" && !pos.length) || (ptab === "rec" && !orders.length)) && (
            <div className="cx-norec">
              <svg width="150" height="120" viewBox="0 0 150 120"><rect x="38" y="20" width="74" height="70" rx="4" fill="#eceef2" /><rect x="46" y="28" width="58" height="44" fill="#fff" /><rect x="54" y="38" width="42" height="5" fill="#e0e2e8" /><rect x="54" y="49" width="42" height="5" fill="#e0e2e8" /><rect x="54" y="60" width="42" height="5" fill="#e0e2e8" /><rect x="34" y="72" width="82" height="22" rx="3" fill="#e3e5ea" /><rect x="62" y="81" width="26" height="4" rx="2" fill="#fff" /></svg>
              <p>{t("norec")}</p>
            </div>
          )}
        </>
      )}
      {sheet && (
        <div className="cx-over end" onClick={() => setSheet(false)}>
          <div className="cx-sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t("mode")}</h4><div className="cx-chs"><button className="on">USDT</button></div>
            <h4>{t("oq")}</h4>
            <div className="cx-chs">{QTY.map((x) => <button key={x} className={qty === x ? "on" : ""} onClick={() => setQty(x)}>{x.toFixed(2)}</button>)}</div>
            <div className="cx-line"><input value={qty} inputMode="decimal" onChange={(e) => setQty(parseFloat(e.target.value) || 0)} /><button onClick={() => setQty(Math.floor(W.w.USDT || 0))}>{t("all")}</button></div>
            <h4>{t("ot")}</h4>
            <div className="cx-chs">{SECS.map((x) => <button key={x} className={sec === x ? "on" : ""} onClick={() => setSec(x)}>{x}s</button>)}</div>
            <div className="cx-info"><span>{t("bal")} : {(W.w.USDT || 0).toFixed(8)}</span><span>{t("yld")} : {YIELD * 100}%</span></div>
            <div className="cx-info"><span>{t("oq")} : 10.00 - 1000000.00</span></div>
            {msg && <p className="cx-msg" style={{ margin: "0 0 10px" }}>{msg}</p>}
            <div className="cx-two"><button className="g" onClick={() => open("long")}>{t("bl")}</button><button className="r" onClick={() => open("short")}>{t("ss")}</button></div>
          </div>
        </div>
      )}
      {pick && <CoinDrawer P={P} onClose={() => setPick(false)} onPick={(s) => { setSym(s); setPick(false); }} />}
    </>
  );
}

/* ---- Assets (GET /wallet/total, POST /wallet/demo-topup) ---- */
function Assets({ P, W }) {
  const t = useT();
  const [tab, setTab] = useState("assets"), [hide, setHide] = useState(false), [note, setNote] = useState({ k: "", ok: true }), [busy, setBusy] = useState(false);
  const val = (s, q) => (s === "USDT" || s === "USDC" ? q : q * (P[s]?.price || 0));
  const calc = Object.entries(W.w).reduce((x, [s, q]) => x + val(s, q), 0);
  const total = typeof W.total === "number" ? W.total : calc;
  const sub = tab === "assets" ? null : tab;
  const tabs = [["assets", t("assets")], ["funds", t("funds")], ["options", t("options")], ["quant", t("quant")]];
  const sec = [["ta", total], ["funds", total], ["options", 0], ["quant", 0]];
  const title = (k) => (k === "ta" ? t("ta") : t(k));
  const topup = async () => {
    if (busy) return;
    setBusy(true); setNote({ k: "wait2", ok: true });
    try {
      await api("/wallet/demo-topup", { method: "POST", body: { amount: TOPUP } });
      await W.reload();
      setNote({ k: "topOk", ok: true });
    } catch (e) { setNote({ k: e.message, ok: false }); }
    setBusy(false);
  };
  return (
    <>
      <div className="cx-tabs big">{tabs.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <button className="cx-a1" style={{ opacity: busy ? 0.6 : 1, marginBottom: 6 }} onClick={topup}>{t("topup")}</button>
      {note.k && <p className={"cx-msg" + (note.ok ? "" : " bad")}>{t(note.k)}</p>}
      {!sub ? (
        <div className="cx-cards">{sec.map(([k, v]) => (<div key={k} className="cx-ac"><h3>{title(k)} {t("conv")}</h3><small>{t("avail")}</small><b>{v.toFixed(2)}</b></div>))}</div>
      ) : (
        <>
          <div className="cx-sum">
            <div><h2>{title(sub)} {t("conv")}</h2><span>{t("ta")}</span><small>{t("cv")}</small></div>
            <button onClick={() => setHide(!hide)}><Ic d={ICON.eye} s={26} /></button>
            <b>$ {hide ? "••••••" : (sub === "funds" ? total : 0).toFixed(8)}</b><small>≈ $ {(sub === "funds" ? total : 0).toFixed(2)}</small>
          </div>
          <div className="cx-cards gray">
            {ASSET_COINS.map((s) => {
              const q = sub === "funds" ? W.w[s] || 0 : 0;
              const fz = sub === "funds" ? W.fz[s] || 0 : 0;
              return (
                <div key={s} className="cx-ac wide">
                  <h3><span className="cx-dn"><Coin s={s} size={30} />{s}</span> <i>›</i></h3>
                  <div className="cx-3"><span><small>{t("avail")}</small>{q.toFixed(8)}</span><span><small>{t("frozen")}</small>{fz.toFixed(8)}</span><span><small>{t("cv")}</small>$ {val(s, q).toFixed(2)}</span></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/* ---- Deposit / Withdraw → /deposit, /withdraw ---- */
const NETS = { USDT: ["TRC20", "ERC20"], USDC: ["ERC20"], ETH: ["ERC20"], BTC: ["BTC"] };
const WFEE = { USDT: 1, USDC: 1, ETH: 0.002, BTC: 0.0002 };
const isDone = (x) => x.type === "dep" || /done|success|complete|approved|paid/i.test(x.status || "");

function TxList({ txs, type }) {
  const t = useT();
  const l = txs.filter((x) => x.type === type);
  return (
    <div className="cx-hist">
      <h3>{t("hist")}</h3>
      {l.length ? l.map((x) => (
        <div key={x.id} className="cx-tx">
          <span><b>{x.type === "dep" ? "+" : "-"}{x.amt} {x.coin}</b><small>{x.net} · {new Date(x.time).toLocaleString()}</small></span>
          <span className={"st " + (isDone(x) ? "dep" : "wd")}>{t(isDone(x) ? "done" : "proc")}</span>
        </div>
      )) : <div className="cx-empty2">{t("norec")}</div>}
    </div>
  );
}
function Chips({ list, v, set }) { return <div className="cx-chips">{list.map((x) => <button key={x} className={x === v ? "on" : ""} onClick={() => set(x)}>{x}</button>)}</div>; }

function Deposit({ W, go, txs }) {
  const t = useT();
  const [coin, setCoin] = useState("USDT"), [net, setNet] = useState("TRC20"), [amt, setAmt] = useState(""), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false });
  const nl = NETS[coin], nn = nl.includes(net) ? net : nl[0];
  const pickCoin = (c) => { setCoin(c); setNet(NETS[c][0]); };
  const submit = async () => {
    if (busy) return;
    const a = parseFloat(amt);
    if (!(a > 0)) return setMsg({ k: "eAmt", ok: false });
    setBusy(true);
    try {
      await api("/deposit", { method: "POST", body: { coin, net: nn, amount: a } });
      await W.reload();
      setAmt(""); setMsg({ k: "depOk", ok: true });
    } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  return (
    <>
      <div className="cx-top"><button onClick={() => go("home")}>‹</button><h1>{t("dep")}</h1><span /></div>
      <div className="cx-fm">
        <h4>{t("coin")}</h4><Chips list={Object.keys(NETS)} v={coin} set={pickCoin} />
        <h4>{t("net")}</h4><Chips list={nl} v={nn} set={setNet} />
        <h4>{t("amount")}</h4>
        <div className="cx-in"><input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={t("amount")} inputMode="decimal" /><b>{coin}</b></div>
        {msg.k && <p className={"cx-msg" + (msg.ok ? "" : " bad")} style={{ margin: "10px 0 0" }}>{t(msg.k)}</p>}
        <button className="cx-a1 flat" style={{ opacity: busy ? 0.6 : 1 }} onClick={submit}>{t("submit")}</button>
      </div>
      <TxList txs={txs} type="dep" />
    </>
  );
}

function Withdraw({ W, go, txs }) {
  const t = useT();
  const [coin, setCoin] = useState("USDT"), [net, setNet] = useState("TRC20"), [addr, setAddr] = useState(""), [amt, setAmt] = useState(""), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false });
  const nl = NETS[coin], nn = nl.includes(net) ? net : nl[0];
  const pickCoin = (c) => { setCoin(c); setNet(NETS[c][0]); };
  const held = W.w[coin] || 0, fee = WFEE[coin], a = parseFloat(amt) || 0;
  const submit = async () => {
    if (busy) return;
    const ad = addr.trim();
    if (!ad) return setMsg({ k: "eAddr", ok: false });
    if (!/^[A-Za-z0-9]{20,100}$/.test(ad)) return setMsg({ k: "bAddr", ok: false });
    if (!(a > 0)) return setMsg({ k: "eAmt", ok: false });
    if (a <= fee) return setMsg({ k: "feeLow", ok: false });
    if (a > held) return setMsg({ k: "iB", ok: false });
    setBusy(true);
    try {
      await api("/withdraw", { method: "POST", body: { coin, net: nn, address: ad, amount: a } });
      await W.reload();
      setAmt(""); setAddr(""); setMsg({ k: "wdOk", ok: true });
    } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  return (
    <>
      <div className="cx-top"><button onClick={() => go("home")}>‹</button><h1>{t("wd")}</h1><span /></div>
      <div className="cx-fm">
        <h4>{t("coin")}</h4><Chips list={Object.keys(NETS)} v={coin} set={pickCoin} />
        <h4>{t("net")}</h4><Chips list={nl} v={nn} set={setNet} />
        <h4>{t("addr")}</h4>
        <div className="cx-in"><input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder={t("addr")} autoComplete="off" /></div>
        <h4>{t("amount")}</h4>
        <div className="cx-in"><input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={t("amount")} inputMode="decimal" /><button className="cx-all" onClick={() => setAmt(String(held))}>{t("all")}</button><b>{coin}</b></div>
        <div className="cx-kv"><span>{t("avail")}</span><b>{held.toFixed(8)} {coin}</b></div>
        <div className="cx-kv"><span>{t("fee")}</span><b>{fee} {coin}</b></div>
        <div className="cx-kv"><span>{t("recv")}</span><b>{Math.max(0, a - fee).toFixed(8)} {coin}</b></div>
        {msg.k && <p className={"cx-msg" + (msg.ok ? "" : " bad")} style={{ margin: "10px 0 0" }}>{t(msg.k)}</p>}
        <button className="cx-a1 flat" style={{ opacity: busy ? 0.6 : 1 }} onClick={submit}>{t("submit")}</button>
      </div>
      <TxList txs={txs} type="wd" />
    </>
  );
}

function Dashboard({ me0, logout, lang, setLang, dark, setDark }) {
  const P = usePrices();
  const t = useT();
  const [me, setMe] = useState(me0), [menu, setMenu] = useState(false), [w, setW] = useState({ USDT: 0 }), [fz, setFz] = useState({}), [total, setTotal] = useState(null);
  const [pos, setPos] = useState([]), [orders, setOrders] = useState([]), [txs, setTxs] = useState([]), [spot, setSpot] = useState([]), [toast, setToast] = useState("");
  const notify = (m, ms = 3000) => { setToast(m); setTimeout(() => setToast(""), ms); };
  const [page, setPage] = useState("home"), [sym, setSym] = useState("BTC");
  const ref = useRef({});
  ref.current = { t, pos, page };
  const prevOpen = useRef(null);

  const loadMe = async () => { try { const j = await api("/auth/me"); setMe(j); } catch {} };
  const loadWallet = async () => {
    try {
      const [j, tt] = await Promise.all([api("/wallet"), api("/wallet/total").catch(() => null)]);
      const a = {}, f = {};
      Object.entries(j.wallet).forEach(([c, v]) => { a[c] = v.available; f[c] = v.frozen; });
      setW(a); setFz(f);
      setTotal(tt && typeof tt.total_usd === "number" ? tt.total_usd : null);
    } catch {}
  };
  const loadSpot = async () => { try { const j = await api("/spot/orders"); if (Array.isArray(j)) setSpot(j); } catch {} };
  const loadPos = async () => {
    try {
      const [o, r] = await Promise.all([api("/options/positions"), api("/options/records")]);
      const np = o.map((x) => ({ id: x.id, sym: x.sym, dir: x.direction, qty: x.qty, open: x.open_price, end: Date.parse(x.end_at) }));
      const no = r.map((x) => ({ id: x.id, sym: x.sym, dir: x.direction, qty: x.qty, open: x.open_price, close: x.close_price, pnl: x.pnl || 0 }));
      if (prevOpen.current) {
        const ids = new Set(np.map((x) => x.id));
        const gone = [...prevOpen.current].filter((i) => !ids.has(i));
        const cl = no.filter((x) => gone.includes(x.id));
        if (cl.length) {
          const wins = cl.filter((x) => x.pnl > 0).length;
          notify(ref.current.t("closed").replace("{n}", cl.length).replace("{w}", wins).replace("{l}", cl.length - wins), 4000);
          loadWallet();
        }
      }
      prevOpen.current = new Set(np.map((x) => x.id));
      setPos(np); setOrders(no);
    } catch {}
  };
  const loadTx = async () => {
    try {
      const [d, x] = await Promise.all([api("/deposit/history"), api("/withdraw/history")]);
      const m = (a, type) => a.map((y) => ({ id: type + y.id, type, coin: y.coin, net: y.net, amt: y.amount, status: y.status, time: y.created_at }));
      setTxs([...m(d, "dep"), ...m(x, "wd")].sort((a, b) => Date.parse(b.time) - Date.parse(a.time)));
    } catch {}
  };
  const reload = () => Promise.all([loadWallet(), loadPos(), loadTx(), loadSpot()]);
  const W = { w, fz, total, reload };

  useEffect(() => {
    loadMe(); reload();
    let c = 0;
    const id = setInterval(() => {
      c++;
      const { pos: ps, page: pg } = ref.current;
      if (ps.length || pg === "options") loadPos();
      if (c % 3 === 0) loadWallet();
    }, 2000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const go = (p, s) => { if (s) setSym(s); setPage(p); window.scrollTo(0, 0); };
  const nav = [["home", "home"], ["market", "market"], ["exchange", "trade"], ["options", "options"], ["assets", "assets"]];
  return (
    <>
      <div className="cx-pg">
        {page === "home" && <Home P={P} go={go} lang={lang} setLang={setLang} onMenu={() => setMenu(true)} notify={notify} />}
        {page === "market" && <Market P={P} go={go} />}
        {page === "exchange" && <Exchange P={P} W={W} sym={sym} setSym={setSym} go={go} spot={spot} />}
        {page === "options" && <Options P={P} W={W} sym={sym} setSym={setSym} pos={pos} orders={orders} />}
        {page === "assets" && <Assets P={P} W={W} />}
        {page === "deposit" && <Deposit W={W} go={go} txs={txs} />}
        {page === "withdraw" && <Withdraw W={W} go={go} txs={txs} />}
      </div>
      <SideMenu open={menu} onClose={() => setMenu(false)} me={me} logout={logout} dark={dark} setDark={setDark} go={go} notify={notify} />
      {toast && <div className="cx-toast">{toast}</div>}
      <nav className="cx-nav">
        {nav.map(([k, l]) => (<button key={k} className={page === k ? "on" : ""} onClick={() => go(k)}><Ic d={ICON[k === "exchange" ? "trade" : k]} s={30} />{t(l)}</button>))}
      </nav>
    </>
  );
}

/* ====================== LOGIN / REGISTER ====================== */
function Login({ onLogin, lang, setLang, go, flash = "" }) {
  const t = useT();
  const rem0 = store.get("cx_rem", "");
  const [email, setEmail] = useState(rem0), [pw, setPw] = useState(""), [rem, setRem] = useState(!!rem0), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: flash, ok: true });
  const mail = email.trim().toLowerCase();
  const login = async () => {
    if (busy) return;
    setBusy(true); setMsg({ k: "wait2", ok: true });
    try {
      const r = await api("/auth/login", { method: "POST", body: { email: mail, password: pw } });
      store.set("cx_rem", rem ? mail : "");
      await onLogin(r);
    } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  const enter = (e) => { if (e.key === "Enter") login(); };
  const note = msg.k ? <p className={"cx-msg" + (msg.ok ? "" : " bad")}>{t(msg.k)}</p> : null;
  return (
    <div className="cx-pg cx-au">
      <AuBar title={t("login")} onBack={() => go("login")} onHelp={() => {}} />
      <div className="cx-alogo"><i><svg viewBox="0 0 100 100"><g fill="none" stroke="#06c9c9" strokeWidth="6.5"><path d="M76 16H50a34 34 0 000 68h26V66" /><path d="M76 33H50a17 17 0 000 34h26V54" /><path d="M76 49H54a3 3 0 000 6h22" /></g></svg></i></div>
      <div className="cx-acard">
        <input className="cx-ai" type="text" autoComplete="username" placeholder={t("acc")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="cx-ai" type="password" autoComplete="current-password" placeholder={t("pw")} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={enter} />
        <label className="cx-rm"><input type="checkbox" checked={rem} onChange={(e) => setRem(e.target.checked)} />{t("rem")}</label>
      </div>
      {note}
      <button className="cx-a1" style={{ opacity: busy ? 0.6 : 1 }} onClick={login}>{t("login")}</button>
      <div className="cx-alinks"><button onClick={() => go("register")}>{t("register")}</button><button onClick={() => go("forgot")}>{t("forgot")}</button></div>
      <div className="cx-alang"><LangPicker lang={lang} setLang={setLang} /></div>
    </div>
  );
}

function Register({ mode = "register", onLogin, go }) {
  const t = useT();
  const isReg = mode === "register";
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false });
  const mail = email.trim().toLowerCase();
  const run = async (fn) => {
    if (busy) return;
    setBusy(true); setMsg({ k: "wait2", ok: true });
    try { await fn(); } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  const reg = () => run(async () => {
    const r = await api("/auth/register", { method: "POST", body: { email: mail, password: pw, password2: pw2 } });
    await onLogin(r);
  });
  const reset = () => run(async () => {
    await api("/auth/forgot", { method: "POST", body: { email: mail, password: pw, password2: pw2 } });
    go("login", "resetOk");
  });
  const submit = isReg ? reg : reset;
  const enter = (e) => { if (e.key === "Enter") submit(); };
  const note = msg.k ? <p className={"cx-msg" + (msg.ok ? "" : " bad")}>{t(msg.k)}</p> : null;
  return (
    <div className="cx-pg cx-au">
      <AuBar title={t(isReg ? "register" : "reset")} onBack={() => go("login")} onHelp={() => {}} />
      <div className="cx-atab"><span>{t("email")}</span></div>
      <div className="cx-acard flat">
        <input className="cx-ai" type="text" autoComplete="username" placeholder={t("acc")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="cx-ai" type="password" autoComplete="new-password" placeholder={t(isReg ? "pw" : "newPw")} value={pw} onChange={(e) => setPw(e.target.value)} />
        <input className="cx-ai" type="password" autoComplete="new-password" placeholder={t("pw2")} value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={enter} />
      </div>
      {note}
      <button className="cx-a1" style={{ opacity: busy ? 0.6 : 1 }} onClick={submit}>{t(isReg ? "register" : "reset")}</button>
      <div className="cx-alinks"><button onClick={() => go("login")}>{t("hasAcc")}</button></div>
    </div>
  );
}

/* ====================== ROOT APP ====================== */
export default function CexApp() {
  const [lang, setLangS] = useState(() => store.get("cx_lang", "en"));
  const [dark, setDarkS] = useState(() => store.get("cx_dark", true));
  const [me, setMe] = useState(null);
  const [view, setView] = useState(TOKEN ? "boot" : "login");
  const [flash, setFlash] = useState("");

  const patchSettings = (b) => { if (TOKEN) api("/user/settings", { method: "PATCH", body: b }).catch(() => {}); };
  const setLang = (l) => { setLangS(l); store.set("cx_lang", l); patchSettings({ lang: l }); };
  const setDark = (v) => { setDarkS(v); store.set("cx_dark", v); patchSettings({ dark: v }); };
  const t = (k) => (T[lang]?.[k] ?? T2[lang]?.[k] ?? T3[lang]?.[k] ?? T.en[k] ?? T2.en[k] ?? T3.en[k] ?? k);
  const go = (v, f = "") => { setFlash(f); setView(v); };

  const logout = () => { setToken(""); setMe(null); go("login"); };
  ON401 = logout;

  /* সার্ভারে সেভ করা lang/dark ইউজারের সেটিং হিসেবে বসায় */
  const applyMe = (u) => {
    if (!u) return;
    if (u.lang && LANGS.some((l) => l[0] === u.lang)) { setLangS(u.lang); store.set("cx_lang", u.lang); }
    if (typeof u.dark === "boolean") { setDarkS(u.dark); store.set("cx_dark", u.dark); }
  };

  /* login/register রেসপন্স = {access_token, token_type, email, uid} → তারপর /auth/me দিয়ে পুরো প্রোফাইল */
  const onLogin = async (r) => {
    const tok = r && (r.token || r.access_token);
    if (tok) setToken(tok);
    let u = { email: r?.email, uid: r?.uid, vip: 0, reputation: 0 };
    try { u = await api("/auth/me"); applyMe(u); } catch {}
    setMe(u);
    setView("app");
  };

  useEffect(() => {
    if (!TOKEN) return;
    api("/auth/me").then((j) => { applyMe(j); setMe(j); setView("app"); }).catch(() => { setToken(""); setView("login"); });
  }, []); // eslint-disable-line

  return (
    <LangCtx.Provider value={{ lang, t }}>
      <div className={"cx" + (dark ? " dark" : "")} dir={RTL.includes(lang) ? "rtl" : "ltr"}>
        <style>{CSS}</style>
        {view === "boot" && <div className="cx-pg" />}
        {view === "login" && <Login onLogin={onLogin} lang={lang} setLang={setLang} go={go} flash={flash} />}
        {view === "register" && <Register mode="register" onLogin={onLogin} go={go} />}
        {view === "forgot" && <Register mode="forgot" onLogin={onLogin} go={go} />}
        {view === "app" && me && <Dashboard me0={me} logout={logout} lang={lang} setLang={setLang} dark={dark} setDark={setDark} />}
      </div>
    </LangCtx.Provider>
  );
}

/* ====================== CSS ====================== */
const CSS = `
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
.cx-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;background:#fff;display:flex;z-index:30;border-top:1px solid #e5e6ec;padding:10px 0 calc(8px + env(safe-area-inset-bottom))}
.cx-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:19px;color:#111;text-align:center}
.cx-nav svg{color:#5f7a96}
.cx-nav button.on{color:${BLUE}}.cx-nav button.on svg{color:${BLUE}}
.cx-toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:90;background:#14323f;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:92%}
.cx button:focus-visible,.cx input:focus-visible{outline:2px solid ${BLUE};outline-offset:2px}
.cx-row:active,.cx-grid button:active{background:#f3f4f8}
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
.cx.dark{background:#080f1c;color:#e8ecf3}
.cx.dark .cx-pg{background:#121e2f;box-shadow:0 0 40px rgba(0,0,0,.4)}
.cx.dark small{color:#8d98ad}
.cx.dark .cx-th,.cx.dark .cx-row,.cx.dark .cx-top,.cx.dark .cx-nav,.cx.dark .cx-obar,.cx.dark .cx-mr,.cx.dark .cx-mp,.cx.dark .cx-lgm button,.cx.dark .cx-tbl,.cx.dark .cx-ctool,.cx.dark .cx-ctool button,.cx.dark .cx-chartw{border-color:#22304a}
.cx.dark .cx-tbh{border-bottom-color:#5b6b88}
.cx.dark .cx-th{color:#8d98ad}
.cx.dark .cx-grid,.cx.dark .cx-cards,.cx.dark .cx-empty{background:#0b1424}
.cx.dark .cx-grid button,.cx.dark .cx-ac{background:#17263d}
.cx.dark .cx-ent{border-top-color:#0b1424}
.cx.dark .cx-nav,.cx.dark .cx-obar{background:#121e2f}
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
.cx-fm{padding:10px 18px 20px}
.cx-fm h4{margin:16px 0 8px;font-size:15px;font-weight:500;color:#6b6f7c}
.cx-fm .cx-in{height:56px;margin:4px 0}
.cx-fm .cx-in input{font-size:17px}
.cx-chips{display:flex;gap:10px;flex-wrap:wrap}
.cx-chips button{padding:10px 20px;border:1px solid #bbb!important;border-radius:8px;font-size:16px;text-align:center!important}
.cx-chips button.on{border-color:${BLUE}!important;color:${BLUE};background:rgba(31,122,203,.08)}
.cx-all{width:auto!important;padding:0 12px;color:${BLUE}!important;font-size:16px!important;border:0!important}
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
.cx.dark .cx-ab,.cx.dark .cx-acard{background:#17263d}
.cx.dark .cx-alogo i{background:#fff}
.cx.dark .cx-atab{background:#121e2f;border-bottom-color:#0b1424}
.cx.dark .cx-ab,.cx.dark .cx-ai,.cx.dark .cx-tx{border-color:#22304a}
.cx.dark .cx-chips button{border-color:#5b6b88!important}
.cx.dark .cx-chips button.on{border-color:${BLUE}!important;color:#4aa3f0}
.cx.dark .cx-fm h4,.cx.dark .cx-kv{color:#9aa6bb}
.cx.dark .cx-msg.bad{background:#3b1a20}
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
.cx-th,.cx-row{padding-left:24px;padding-right:24px;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 100px}
.cx-th{font-size:15px}
.cx-row b{font-size:17px}.cx-row .cx-nm b small{font-size:13px}
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
