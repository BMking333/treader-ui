import React, { createContext, useContext, useEffect, useState } from "react";
import img1 from "../assets/Image1.png";
import img2 from "../assets/Image2.png";
import img3 from "../assets/Image3.png";

/* =====================================================================
   src/pages/Home.jsx — shared lib (API, ভাষা, আইকন, কয়েন লোগো) + Home পেজ
   ছবি: src/assets/Image1.png, Image2.png, Image3.png
   ===================================================================== */

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
export const TOPUP = 1000;

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
export const T2 = {
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
export const T3 = {
  en: { login: "login", register: "register", acc: "Please enter your email", pw: "Please enter your password", pw2: "Please re-enter your password", forgot: "Forgot password", rem: "Remember account", email: "Email", bEmail: "Enter a valid email address", bPw: "Password must be at least 6 characters", bMatch: "Passwords do not match", exists: "This email is already registered", noUser: "Account not found", wrongPw: "Wrong password", reset: "Reset password", newPw: "Please enter a new password", resetOk: "Password updated, please log in", dep: "Deposit", coin: "Coin", net: "Network", addr: "Withdrawal address", eAddr: "Enter withdrawal address", bAddr: "Invalid withdrawal address", fee: "Fee", recv: "You will receive", depOk: "Deposit submitted", wdOk: "Withdrawal submitted", hist: "History", proc: "Processing", done: "Completed", feeLow: "Amount must be greater than the fee", amount: "Amount", submit: "Submit", hasAcc: "Back to login", topup: "Demo top-up (+1000 USDT)", topOk: "Demo balance added", needLogin: "Please log in first",
    neterr: "Network error. Server may be waking up, try again", err: "Request failed", unauthorized: "Session expired, please log in", badSym: "Invalid coin", badSide: "Invalid side", badDir: "Invalid direction", badSec: "Invalid time", badCoin: "Invalid coin/network", badInterval: "Invalid interval", forbidden: "Not allowed", wait2: "Please wait..." },
  bn: { login: "লগইন", register: "রেজিস্টার", acc: "আপনার ইমেইল লিখুন", pw: "পাসওয়ার্ড লিখুন", pw2: "পাসওয়ার্ড আবার লিখুন", forgot: "পাসওয়ার্ড ভুলে গেছেন", rem: "অ্যাকাউন্ট মনে রাখুন", email: "ইমেইল", bEmail: "সঠিক ইমেইল দিন", bPw: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", bMatch: "পাসওয়ার্ড মিলছে না", exists: "এই ইমেইল আগেই রেজিস্টার করা", noUser: "অ্যাকাউন্ট পাওয়া যায়নি", wrongPw: "পাসওয়ার্ড ভুল", reset: "পাসওয়ার্ড রিসেট", newPw: "নতুন পাসওয়ার্ড লিখুন", resetOk: "পাসওয়ার্ড বদলেছে, লগইন করুন", dep: "ডিপোজিট", coin: "কয়েন", net: "নেটওয়ার্ক", addr: "উইথড্র অ্যাড্রেস", eAddr: "উইথড্র অ্যাড্রেস দিন", bAddr: "অ্যাড্রেস সঠিক নয়", fee: "ফি", recv: "আপনি পাবেন", depOk: "ডিপোজিট জমা হয়েছে", wdOk: "উইথড্র জমা হয়েছে", hist: "ইতিহাস", proc: "প্রসেসিং", done: "সম্পন্ন", feeLow: "পরিমাণ ফি-এর চেয়ে বেশি হতে হবে", amount: "পরিমাণ", submit: "জমা দিন", hasAcc: "লগইনে ফিরুন", topup: "ডেমো টপ-আপ (+1000 USDT)", topOk: "ডেমো ব্যালেন্স যোগ হয়েছে", needLogin: "আগে লগইন করুন",
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
export let TOKEN = store.get("cx_token", "");
let ON401 = () => {};
export const setOn401 = (fn) => { ON401 = fn; };
export const setToken = (v) => { TOKEN = v; store.set("cx_token", v); };
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot"];

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
    if (r.status === 401 && !AUTH_PATHS.includes(path)) { ON401(); throw new Error("unauthorized"); }
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

export const Ic = ({ d, s = 24 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>);
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
  if (n >= src.length) return <span className="cx-coin" style={{ background: COL[s] || BLUE, width: size, height: size }}>{s[0]}</span>;
  return <img key={s + n} className="cx-coin img" src={src[n]} width={size} height={size} alt={s} loading="lazy" referrerPolicy="no-referrer" onError={() => setN(n + 1)} />;
}

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
              <button key={k} className={k === lang ? "on" : ""} onClick={() => { setLang(k); setOpen(false); }}><span>{n}</span><span className="cx-fl">{f}</span></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ====================== HOME ====================== */
const BANNERS = [img1, img2, img3];

export function List({ P, go, names }) {
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

export default function Home({ P, go, lang, setLang, onMenu, notify, guest, askLogin }) {
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
        {guest && <button className="cx-lgin" onClick={() => askLogin("login")}>{t("login")}</button>}
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
