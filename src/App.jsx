import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  Home as HomeIcon, PlusCircle, Sun, Moon, Search,
  SlidersHorizontal, Heart, MapPin, GraduationCap, CheckCircle2,
  ArrowLeft, Trash2, Phone, Filter, X, RotateCcw,
  AlertTriangle, Languages, ChevronRight, Compass, Lock, LogOut,
  Eye, EyeOff, MessageCircle, Send, User, UserPlus, LogIn, ShieldCheck,
  CreditCard, BarChart3, Sparkles, ClipboardList, Users, Check, Clock,
  LayoutDashboard, Bot, Wallet, CalendarDays, DoorOpen, Navigation, Camera,
  ChevronLeft, Map as MapIcon, List as ListIcon
} from 'lucide-react';


const TG_BOT_TOKEN = '';
const TG_CHAT_ID = '';


const USD_RATE = 12700;
const DEPOSIT_PERCENT = 0.1;


const ADMIN_SEED = { name: 'Admin', phone: '+998 90 000 00 00', password: 'admin1234' };

const api = axios.create({ baseURL: '/api' });
const mock = new MockAdapter(api, { delayResponse: 300 });

const LOCAL_STORAGE_KEY = 'talabauy_listings_db_v5';
const OLD_LISTINGS_KEY = 'talabauy_listings_db_v4';
const CHAT_STORAGE_KEY = 'talabauy_chat_messages_v2';
const USERS_KEY = 'talabauy_users_v1';
const ORDERS_KEY = 'talabauy_orders_v1';
const PAYMENTS_KEY = 'talabauy_payments_v1';
const VISITS_KEY = 'talabauy_visits_v1';
const VISIT_FLAG = 'talabauy_visit_counted';
const MAX_MESSAGES = 200;

const universitiesList = ['Barchasi', 'TATU', "O'zMU", 'TDTU', 'TDIU', 'WIUT', 'INHA', 'TPTI'];



function readStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(data);
    const ok = parsed && typeof parsed === 'object' && Array.isArray(parsed) === Array.isArray(fallback);
    return ok ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } // xotira to'lsa false qaytadi
}

const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const escapeHtml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function normalizePhone(v = '') {
  let d = String(v).replace(/\D/g, '');
  if (d.length === 9) d = '998' + d;
  return d;
}
const isValidPhone = (v) => /^998\d{9}$/.test(normalizePhone(v));
function formatPhone(v) {
  const d = normalizePhone(v);
  if (d.length !== 12) return v || '';
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
}

const depositUZS = (priceUSD) => Math.round(priceUSD * USD_RATE * DEPOSIT_PERCENT);
const formatUZS = (n) => Number(n || 0).toLocaleString('ru-RU');
const formatDate = (iso) => {
  try { return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return ''; }
};



const getImages = (item) => (item.images && item.images.length ? item.images : [item.image]);


function fileToDataUrl(file, maxSize = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}


const uniCoords = {
  TATU: [41.3395, 69.2860], "O'zMU": [41.3437, 69.2046], TDTU: [41.3418, 69.2085],
  TDIU: [41.3165, 69.2885], WIUT: [41.3390, 69.3380], INHA: [41.3378, 69.3335], TPTI: [41.3245, 69.2380]
};
function listingCoords(item) {
  const base = uniCoords[item.university] || [41.3111, 69.2797];
  let h = 0;
  for (let i = 0; i < String(item.id).length; i += 1) h = (h * 31 + String(item.id).charCodeAt(i)) % 100000;
  const a = ((h % 200) - 100) / 100;          // -1 .. 1
  const b = (((Math.floor(h / 200)) % 200) - 100) / 100;
  return [base[0] + a * 0.006, base[1] + b * 0.008];
}


let leafletPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.async = true;
    js.onload = () => resolve(window.L);
    js.onerror = () => { leafletPromise = null; reject(new Error('leaflet')); };
    document.head.appendChild(js);
  });
  return leafletPromise;
}


async function hashPassword(pw) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode('talabauy:' + pw));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* pastdagi zaxira ishlaydi */ }
  return 'x' + btoa(String.fromCharCode(...new TextEncoder().encode('talabauy:' + pw)));
}

async function notifyTelegram(text) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    console.info('[Telegram demo]', text);
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
    });
  } catch (e) {
    console.warn('Telegramga yuborib bo\'lmadi', e);
  }
}

function recordVisit() {
  try {
    if (sessionStorage.getItem(VISIT_FLAG)) return;
    sessionStorage.setItem(VISIT_FLAG, '1');
    const visits = readStorage(VISITS_KEY, {});
    const k = todayKey();
    visits[k] = (visits[k] || 0) + 1;
    writeStorage(VISITS_KEY, visits);
  } catch { /* e'tiborsiz */ }
}



const baseListings = [
  { id: '1', title: "TATU yaqinida 2 xonali kvartirada 1 ta joy", type: 'Xonadosh', price: 80, university: 'TATU', address: 'Yunusobod tumani, Bodomzor metro yaqinida', distance: '300 m (5 min piyoda)', phone: '+998 90 123 45 67', rooms: 2, verified: true, description: "Wi-Fi, muzlatgich, kir yuvish mashinasi bor. Xonadon sharoiti a'lo. Faqat intizomli va ozoda talabalar uchun.", image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-01T10:00:00.000Z' },
  { id: '2', title: "O'zMU va TDTU talabalari uchun shinam xonadon", type: 'Xonadon', price: 220, university: "O'zMU", address: "Olmazor tumani, Beruniy metro yo'nalishida", distance: '600 m (8 min piyoda)', phone: '+998 93 987 65 43', rooms: 3, verified: true, description: 'Yangi remontdan chiqqan xonadon. Kombi isitish tizimi, smart TV va yevro-remont qilingan.', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-02T10:00:00.000Z' },
  { id: '3', title: 'TDIU atrofida qizlar uchun sheriklik', type: 'Xonadosh', price: 95, university: 'TDIU', address: 'Mirobod tumani, Oybek metro yaqinida', distance: '400 m (6 min piyoda)', phone: '+998 97 555 11 22', rooms: 2, verified: true, description: "O'qishga mas'uliyatli qizlarni taklif qilamiz. Tinch, toza va barcha qulayliklarga ega.", image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-03T10:00:00.000Z' },
  { id: '4', title: 'WIUT yaqinida lyuks 1 xonali studiya', type: 'Xonadon', price: 310, university: 'WIUT', address: 'Yashnobod tumani, Amir Temur maydoni yaqinida', distance: '200 m (3 min piyoda)', phone: '+998 94 444 00 11', rooms: 1, verified: true, description: 'Zamonaviy dizayndagi studiya kvartira. Talaba yoki yosh mutassis uchun juda qulay.', image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-04T10:00:00.000Z' },
  { id: '5', title: "TDTU (Politeh) binosidan 5 minutlik uy", type: 'Xonadosh', price: 75, university: 'TDTU', address: 'Olmazor tumani, Talabalar shaharchasi', distance: '250 m', phone: '+998 99 111 22 33', rooms: 3, verified: false, description: "Boshqa o'g'il bolalar yoniga 1 kishi kerak. Sharoiti yaxshi, internet bor.", image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-05T10:00:00.000Z' },
  { id: '6', title: "INHA Universiteti qarshisidagi novostroyka", type: 'Xonadon', price: 280, university: 'INHA', address: 'Mirzo Ulugbek tumani, Buyuk Ipak Yoli', distance: '150 m', phone: '+998 91 777 88 99', rooms: 2, verified: true, description: 'Yangi binoda joylashgan, lifty bor, xavfsiz hudud va tinch hovli.', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-06T10:00:00.000Z' },
  { id: '7', title: "TPTI talaba qizlari uchun 2 xonali uy", type: 'Xonadosh', price: 85, university: 'TPTI', address: 'Shayxontohur tumani, Toshmi yaqinida', distance: '500 m', phone: '+998 95 333 44 55', rooms: 2, verified: true, description: "Toshmi o'quvchilariga juda qulay joy. Uyda hamma texnika bor.", image: 'https://images.unsplash.com/photo-1540518614846-7ede433c517a?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-07T10:00:00.000Z' },
  { id: '8', title: "TATU shaharchasida 1 xonali alohida uy", type: 'Xonadon', price: 180, university: 'TATU', address: 'Yunusobod 4-mavze', distance: '450 m', phone: '+998 90 999 00 11', rooms: 1, verified: false, description: "Alohida yashashni xohlaydigan talabaga mo'ljallangan ixcham uy.", image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-08T10:00:00.000Z' },
  { id: '9', title: "TATU yaqinida 2 xonali yevro-remont kvartira", type: 'Xonadon', price: 210, university: 'TATU', address: 'Yunusobod tumani, Bodomzor metro yonida', distance: '320 m (5 min piyoda)', phone: '+998 90 555 22 33', rooms: 2, verified: true, description: "To'liq yevro-remont qilingan, oshxona texnikasi va mebel bilan jihozlangan kvartira.", image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-09T10:00:00.000Z' },
  { id: '10', title: "O'zMU qarshisida keng 3 xonali kvartira", type: 'Xonadon', price: 270, university: "O'zMU", address: "Olmazor tumani, Chilonzor ko'chasi", distance: '400 m (6 min piyoda)', phone: '+998 93 444 11 22', rooms: 3, verified: true, description: 'Keng xonalar, 2 ta balkon, yangi santexnika. Bir nechta talaba birgalikda ijaraga olishi mumkin.', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-10T10:00:00.000Z' },
  { id: '11', title: "TDTU (Politeh) yonida 1 xonali kvartira", type: 'Xonadon', price: 165, university: 'TDTU', address: 'Olmazor tumani, Talabalar shaharchasi', distance: '280 m (4 min piyoda)', phone: '+998 99 222 55 66', rooms: 1, verified: true, description: 'Kichik va shinam, alohida yashash uchun qulay. Konditsioner va muzlatgich mavjud.', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-11T10:00:00.000Z' },
  { id: '12', title: "TDIU yonida 2 xonali zamonaviy kvartira", type: 'Xonadon', price: 225, university: 'TDIU', address: 'Mirobod tumani, Oybek metro yaqinida', distance: '380 m (5 min piyoda)', phone: '+998 97 888 11 44', rooms: 2, verified: true, description: 'Yangi binoda, lift va parking mavjud. Universitetgacha piyoda 5 daqiqa.', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-12T10:00:00.000Z' },
  { id: '13', title: "WIUT yaqinida 1 xonali biznes-klass studiya", type: 'Xonadon', price: 330, university: 'WIUT', address: 'Yashnobod tumani, Amir Temur maydoni', distance: '180 m (3 min piyoda)', phone: '+998 94 777 33 22', rooms: 1, verified: true, description: "Yuqori toifadagi studiya, to'liq texnika bilan jihozlangan. Xavfsizlik doim faol.", image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-13T10:00:00.000Z' },
  { id: '14', title: "INHA yaqinida 2 xonali yorug' kvartira", type: 'Xonadon', price: 250, university: 'INHA', address: 'Mirzo Ulugbek tumani, Buyuk Ipak Yoli', distance: '220 m (3 min piyoda)', phone: '+998 91 333 66 77', rooms: 2, verified: false, description: 'Quyosh nuriga boy, keng derazali kvartira. Metro va avtobus bekati yaqin.', image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-14T10:00:00.000Z' },
  { id: '15', title: "TPTI (Toshmi) yonida 1 xonali kvartira", type: 'Xonadon', price: 155, university: 'TPTI', address: 'Shayxontohur tumani, Chorsu yaqinida', distance: '340 m (5 min piyoda)', phone: '+998 95 222 88 99', rooms: 1, verified: true, description: 'Markazga yaqin, transport qatnovi qulay, ijaraga arzon narxda beriladi.', image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-15T10:00:00.000Z' },
  { id: '16', title: "TATU shaharchasi yaqinida 3 xonali oilaviy kvartira", type: 'Xonadon', price: 290, university: 'TATU', address: 'Yunusobod 4-mavze', distance: '470 m (7 min piyoda)', phone: '+998 90 111 77 88', rooms: 3, verified: true, description: "Katta oilalar yoki bir nechta talaba uchun mo'ljallangan keng kvartira.", image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-16T10:00:00.000Z' },
  { id: '17', title: "TDTU qarshisida 2 xonali yangi kvartira", type: 'Xonadon', price: 235, university: 'TDTU', address: "Olmazor tumani, Politexnika ko'chasi", distance: '210 m (3 min piyoda)', phone: '+998 99 666 22 11', rooms: 2, verified: true, description: "Yangi qurilgan binoda, issiq suv doimiy, konditsioner o'rnatilgan.", image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-17T10:00:00.000Z' },
  { id: '18', title: "O'zMU yonida 1 xonali kichik kvartira", type: 'Xonadon', price: 145, university: "O'zMU", address: "Olmazor tumani, Beruniy metro yo'nalishida", distance: '540 m (7 min piyoda)', phone: '+998 93 222 99 11', rooms: 1, verified: false, description: "Talaba byudjetiga mos, kichik lekin yorug' xonadon.", image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', createdAt: '2026-01-18T10:00:00.000Z' }
];


const listingAreas = {
  TATU: ['Yunusobod tumani, Bodomzor metro yaqinida', 'Yunusobod 4-mavze', 'Yunusobod tumani, Yunusobod metro yonida', 'Yunusobod 19-kvartal'],
  "O'zMU": ["Olmazor tumani, Beruniy metro yo'nalishida", "Olmazor tumani, Chilonzor ko'chasi", 'Olmazor tumani, Universitet ko\'chasi', 'Olmazor tumani, Tinchlik yaqinida'],
  TDTU: ['Olmazor tumani, Talabalar shaharchasi', "Olmazor tumani, Politexnika ko'chasi", 'Olmazor tumani, Beruniy metro yaqinida', 'Olmazor tumani, Qorasaroy'],
  TDIU: ['Mirobod tumani, Oybek metro yaqinida', "Mirobod tumani, Shahriston ko'chasi", 'Mirobod tumani, Mirobod bozori yonida', 'Mirobod tumani, Turkiston'],
  WIUT: ['Yashnobod tumani, Amir Temur maydoni yaqinida', 'Yashnobod tumani, Yashnobod metro yonida', 'Mirobod tumani, Minor yo\'nalishida', 'Yashnobod tumani, Ippodrom'],
  INHA: ['Mirzo Ulugbek tumani, Buyuk Ipak Yoli', 'Mirzo Ulugbek tumani, Minor metro yaqinida', "Mirzo Ulugbek tumani, Ming O'rik", 'Mirzo Ulugbek tumani, Buyuk Ipak Yoli metrosi'],
  TPTI: ['Shayxontohur tumani, Toshmi yaqinida', 'Shayxontohur tumani, Chorsu yaqinida', 'Shayxontohur tumani, Sebzor', 'Shayxontohur tumani, Gafur Gulom metro yonida'],
};

function generateListings() {
  let seed = 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const images = Array.from(new Set(baseListings.map((l) => l.image)));
  const operators = ['90', '91', '93', '94', '95', '97', '99'];
  const roommateDesc = [
    "Wi-Fi, muzlatgich va kir yuvish mashinasi bor. Ozoda va mas'uliyatli talaba kerak.",
    'Tinch xonadon, xonadoshlar do\'stona. Oshxona va hammom umumiy.',
    'Uyda barcha sharoit bor: internet, konditsioner, mebel. Oylik to\'lov kommunal xizmatlar bilan.',
    "O'qishga yaqin, transport qulay. Faqat intizomli talabalar uchun.",
  ];
  const aptDesc = [
    "Yangi remont, barcha maishiy texnika va mebel bor. Universitetga piyoda boriladi.",
    'Yorug\' va keng xonalar, lift, xavfsiz hudud. Bir nechta talaba birga olishi mumkin.',
    "Konditsioner, muzlatgich, kir yuvish mashinasi va tezkor internet mavjud.",
    "Metro va avtobus bekati yaqin, atrofda do'konlar va oshxonalar ko'p.",
  ];
  const out = [];
  let n = 0;
  Object.keys(listingAreas).forEach((uni) => {
    for (let k = 0; k < 10; k += 1) {
      n += 1;
      const isRoommate = k % 2 === 0;
      const rooms = isRoommate ? pick([2, 3]) : pick([1, 1, 2, 2, 3]);
      const price = isRoommate
        ? 60 + Math.floor(rnd() * 11) * 5
        : ({ 1: 140, 2: 200, 3: 260 }[rooms] + Math.floor(rnd() * 15) * 5);
      const meters = 120 + Math.floor(rnd() * 46) * 10;
      const title = isRoommate
        ? pick([`${uni} yaqinida ${rooms} xonali uyda 1 ta joy`, `${uni} talabalari uchun xonadosh kerak`, `${uni} yonida qizlar uchun sheriklik`, `${uni} yaqinida yigitlar uchun joy`])
        : (rooms === 1
          ? pick([`${uni} yaqinida shinam studiya`, `${uni} yonida 1 xonali kvartira`])
          : pick([`${uni} yaqinida ${rooms} xonali kvartira`, `${uni} qarshisida ${rooms} xonali yevro-remont kvartira`, `${uni} yonida ${rooms} xonali zamonaviy kvartira`]));
      const day = new Date(Date.UTC(2026, 0, 19 + n, 10, 0, 0));
      out.push({
        id: 'g' + n,
        title,
        type: isRoommate ? 'Xonadosh' : 'Xonadon',
        price,
        university: uni,
        address: listingAreas[uni][k % 4],
        distance: `${meters} m (${Math.ceil(meters / 80)} min piyoda)`,
        phone: `+998 ${pick(operators)} ${100 + Math.floor(rnd() * 900)} ${10 + Math.floor(rnd() * 90)} ${10 + Math.floor(rnd() * 90)}`,
        rooms,
        verified: k % 4 !== 0,
        description: pick(isRoommate ? roommateDesc : aptDesc),
        image: images[(n + k) % images.length],
        images: [images[(n + k) % images.length], images[(n + k + 3) % images.length], images[(n + k + 6) % images.length]],
        createdAt: day.toISOString(),
      });
    }
  });
  return out;
}

const initialListings = [...baseListings, ...generateListings()];


function getListingsFromStorage() {
  try {
    if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
      let mine = [];
      try {
        const old = JSON.parse(localStorage.getItem(OLD_LISTINGS_KEY) || '[]');
        if (Array.isArray(old)) mine = old.filter((l) => l && l.ownerId);
      } catch { /* e'tiborsiz */ }
      const merged = [...mine, ...initialListings];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch { /* e'tiborsiz */ }
  return readStorage(LOCAL_STORAGE_KEY, initialListings);
}
const saveListingsToStorage = (l) => writeStorage(LOCAL_STORAGE_KEY, l);
const getMessagesFromStorage = () => readStorage(CHAT_STORAGE_KEY, []);
const saveMessagesToStorage = (m) => writeStorage(CHAT_STORAGE_KEY, m.slice(-MAX_MESSAGES));
const getUsers = () => readStorage(USERS_KEY, []);
const saveUsers = (u) => writeStorage(USERS_KEY, u);
const getOrders = () => readStorage(ORDERS_KEY, []);
const saveOrders = (o) => writeStorage(ORDERS_KEY, o);
const getPayments = () => readStorage(PAYMENTS_KEY, []);
const savePayments = (p) => writeStorage(PAYMENTS_KEY, p);
const safeUser = ({ passHash, ...rest }) => rest;
const idFromUrl = (config) => config.url.split('/').pop();


async function ensureAdminSeed() {
  const users = getUsers();
  if (users.some((u) => u.role === 'admin')) return;
  const passHash = await hashPassword(ADMIN_SEED.password);
  saveUsers([{
    id: 'u_admin', name: ADMIN_SEED.name, phone: normalizePhone(ADMIN_SEED.phone),
    passHash, role: 'admin', blocked: false, createdAt: new Date().toISOString()
  }, ...getUsers()]);
}
const seedPromise = ensureAdminSeed();


mock.onGet('/listings').reply(() => [200, getListingsFromStorage()]);

mock.onGet(/\/listings\/\w+/).reply((config) => {
  const listing = getListingsFromStorage().find((i) => i.id === idFromUrl(config));
  return listing ? [200, listing] : [404, { message: 'Topilmadi' }];
});

mock.onPost('/listings').reply((config) => {
  const data = JSON.parse(config.data);
  const newListing = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
  if (!saveListingsToStorage([newListing, ...getListingsFromStorage()])) return [507, { code: 'storage_full' }];
  notifyTelegram(`🏠 <b>Yangi e'lon</b>\n${escapeHtml(newListing.title)}\n💵 $${newListing.price}\n👤 ${escapeHtml(newListing.ownerName || '')}`);
  return [201, newListing];
});

mock.onPatch(/\/listings\/\w+/).reply((config) => {
  const id = idFromUrl(config);
  const patch = JSON.parse(config.data);
  let updated = null;
  const list = getListingsFromStorage().map((i) => (i.id === id ? (updated = { ...i, ...patch }) : i));
  saveListingsToStorage(list);
  return updated ? [200, updated] : [404, {}];
});

mock.onDelete(/\/listings\/\w+/).reply((config) => {
  const id = idFromUrl(config);
  saveListingsToStorage(getListingsFromStorage().filter((i) => i.id !== id));
  return [200, { success: true }];
});


mock.onGet('/messages').reply(() => [200, getMessagesFromStorage()]);
mock.onPost('/messages').reply((config) => {
  const data = JSON.parse(config.data);
  const msg = { ...data, id: uid('m'), createdAt: new Date().toISOString() };
  saveMessagesToStorage([...getMessagesFromStorage(), msg]);
  return [201, msg];
});


mock.onPost('/auth/register').reply((config) => {
  const { name, phone, passHash } = JSON.parse(config.data);
  const users = getUsers();
  const p = normalizePhone(phone);
  if (users.some((u) => u.phone === p)) return [409, { code: 'exists' }];
  const user = { id: uid('u'), name: String(name).trim(), phone: p, passHash, role: 'user', blocked: false, createdAt: new Date().toISOString() };
  saveUsers([...users, user]);
  notifyTelegram(`🆕 <b>Yangi foydalanuvchi</b>\n👤 ${escapeHtml(user.name)}\n📞 ${formatPhone(p)}`);
  return [201, safeUser(user)];
});

mock.onPost('/auth/login').reply((config) => {
  const { phone, passHash } = JSON.parse(config.data);
  const user = getUsers().find((u) => u.phone === normalizePhone(phone));
  if (!user || user.passHash !== passHash) return [401, { code: 'wrong' }];
  if (user.blocked) return [403, { code: 'blocked' }];
  return [200, safeUser(user)];
});


mock.onGet('/users').reply(() => [200, getUsers().map(safeUser)]);

mock.onPatch(/\/users\/\w+/).reply((config) => {
  const id = idFromUrl(config);
  const body = JSON.parse(config.data);
  const patch = {};
  ['name', 'role', 'blocked', 'passHash'].forEach((k) => { if (body[k] !== undefined) patch[k] = body[k]; });
  let updated = null;
  saveUsers(getUsers().map((u) => (u.id === id ? (updated = { ...u, ...patch }) : u)));
  return updated ? [200, safeUser(updated)] : [404, {}];
});

mock.onDelete(/\/users\/\w+/).reply((config) => {
  const id = idFromUrl(config);
  saveUsers(getUsers().filter((u) => u.id !== id));
  return [200, { success: true }];
});

mock.onGet('/orders').reply((config) => {
  const userId = config.params && config.params.userId;
  let list = getOrders();
  if (userId) list = list.filter((o) => o.userId === userId);
  return [200, [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))];
});

mock.onPost('/orders').reply((config) => {
  const data = JSON.parse(config.data);
  const order = { ...data, id: uid('o'), status: 'pending', paid: false, createdAt: new Date().toISOString() };
  saveOrders([...getOrders(), order]);
  notifyTelegram(`🛎 <b>Yangi buyurtma (bron)</b>\n🏠 ${escapeHtml(order.listingTitle)}\n👤 ${escapeHtml(order.userName)} · ${formatPhone(order.userPhone)}\n📅 ${escapeHtml(order.moveIn)}`);
  return [201, order];
});

mock.onPatch(/\/orders\/\w+/).reply((config) => {
  const id = idFromUrl(config);
  const body = JSON.parse(config.data);
  let updated = null;
  saveOrders(getOrders().map((o) => (o.id === id ? (updated = { ...o, status: body.status }) : o)));
  return updated ? [200, updated] : [404, {}];
});


mock.onGet('/payments').reply((config) => {
  const userId = config.params && config.params.userId;
  let list = getPayments();
  if (userId) list = list.filter((p) => p.userId === userId);
  return [200, [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))];
});

mock.onPost('/payments').reply((config) => {
  const { orderId, provider, userId } = JSON.parse(config.data);
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) return [404, { code: 'no_order' }];
  if (order.paid) return [409, { code: 'already_paid' }];
  const payment = {
    id: uid('p'), orderId, userId, provider, listingTitle: order.listingTitle,
    amountUZS: depositUZS(order.price), status: 'paid', createdAt: new Date().toISOString()
  };
  savePayments([...getPayments(), payment]);
  saveOrders(getOrders().map((o) => (o.id === orderId ? { ...o, paid: true, paymentId: payment.id } : o)));
  notifyTelegram(`💳 <b>To'lov qabul qilindi</b>\n🏠 ${escapeHtml(order.listingTitle)}\n💰 ${formatUZS(payment.amountUZS)} so'm (${provider})\n👤 ${escapeHtml(order.userName)}`);
  return [201, payment];
});


mock.onGet('/stats').reply(() => {
  const listings = getListingsFromStorage();
  const orders = getOrders();
  const visits = readStorage(VISITS_KEY, {});
  const days = Array.from({ length: 7 }, (_, i) => {
    const k = todayKey(new Date(Date.now() - (6 - i) * 864e5));
    return { label: k.slice(5), value: visits[k] || 0 };
  });
  return [200, {
    visits: days,
    visitsToday: visits[todayKey()] || 0,
    users: getUsers().length,
    listings: listings.length,
    orders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    revenue: getPayments().filter((p) => p.status === 'paid').reduce((s, p) => s + p.amountUZS, 0),
    byUniversity: universitiesList.filter((u) => u !== 'Barchasi').map((u) => ({ label: u, value: listings.filter((l) => l.university === u).length }))
  }];
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, refetchOnWindowFocus: false } }
});



const errCode = (err) => err && err.response && err.response.data && err.response.data.code;

function useFetchListings() {
  return useQuery({ queryKey: ['listings'], queryFn: async () => (await api.get('/listings')).data });
}
function useFetchSingleListing(id) {
  return useQuery({ queryKey: ['listing', id], queryFn: async () => (await api.get(`/listings/${id}`)).data });
}
function useCreateListing() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (l) => (await api.post('/listings', l)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['listings'] });
      client.invalidateQueries({ queryKey: ['stats'] });
      toast.success(useStore.getState().t('listingSaved'));
    },
    onError: (err) => toast.error(useStore.getState().t(errCode(err) === 'storage_full' ? 'storageFull' : 'errorGeneric'))
  });
}
function useRemoveListing() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/listings/${id}`)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['listings'] });
      client.invalidateQueries({ queryKey: ['stats'] });
      toast.success(useStore.getState().t('listingDeleted'));
    }
  });
}
function useUpdateListing() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) => (await api.patch(`/listings/${id}`, patch)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['listings'] });
      client.invalidateQueries({ queryKey: ['listing'] });
    }
  });
}

function useFetchMessages() {
  const client = useQueryClient();
  useEffect(() => {
    const onStorage = (e) => { if (e.key === CHAT_STORAGE_KEY) client.invalidateQueries({ queryKey: ['messages'] }); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [client]);
  return useQuery({ queryKey: ['messages'], queryFn: async () => (await api.get('/messages')).data, refetchInterval: 2000 });
}
function useSendMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (m) => (await api.post('/messages', m)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['messages'] }),
    onError: () => toast.error(useStore.getState().t('errorGeneric'))
  });
}

function useAuthMutation(kind) {
  return useMutation({
    mutationFn: async ({ name, phone, password }) => {
      await seedPromise;
      const passHash = await hashPassword(password);
      const url = kind === 'login' ? '/auth/login' : '/auth/register';
      return (await api.post(url, { name, phone, passHash })).data;
    }
  });
}

function useFetchUsers() {
  return useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data });
}
function useUpdateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch, password }) => {
      const body = { ...patch };
      if (password) body.passHash = await hashPassword(password);
      return (await api.patch(`/users/${id}`, body)).data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['users'] })
  });
}
function useDeleteUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['users'] });
      client.invalidateQueries({ queryKey: ['stats'] });
    }
  });
}

function useFetchOrders(userId) {
  return useQuery({
    queryKey: ['orders', userId || 'all'],
    queryFn: async () => (await api.get('/orders', { params: userId ? { userId } : {} })).data
  });
}
function useCreateOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (o) => (await api.post('/orders', o)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['orders'] });
      client.invalidateQueries({ queryKey: ['stats'] });
      toast.success(useStore.getState().t('orderCreated'));
    },
    onError: () => toast.error(useStore.getState().t('errorGeneric'))
  });
}
function useUpdateOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => (await api.patch(`/orders/${id}`, { status })).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['orders'] });
      client.invalidateQueries({ queryKey: ['stats'] });
    }
  });
}
function useFetchPayments(userId) {
  return useQuery({
    queryKey: ['payments', userId || 'all'],
    queryFn: async () => (await api.get('/payments', { params: userId ? { userId } : {} })).data
  });
}
function usePayOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, provider, userId }) => {

      await new Promise((r) => setTimeout(r, 1200));
      return (await api.post('/payments', { orderId, provider, userId })).data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['orders'] });
      client.invalidateQueries({ queryKey: ['payments'] });
      client.invalidateQueries({ queryKey: ['stats'] });
      toast.success(useStore.getState().t('paySuccess'));
    },
    onError: () => toast.error(useStore.getState().t('errorGeneric'))
  });
}
function useFetchStats() {
  return useQuery({ queryKey: ['stats'], queryFn: async () => (await api.get('/stats')).data, refetchInterval: 5000, staleTime: 0 });
}



const translations = {
  uz: {
    home: 'Bosh sahifa', favorites: 'Saralanganlar', addListing: "E'lon berish", chat: 'Talabalar chati',
    heroKicker: 'Toshkentdagi oliygohlar uchun', brandTag: 'Toshkent talabalar portali',
    heroTitle: 'Talabalar uchun Shinam va Qulay Uylar',
    heroSub: "O'zingizga mos keladigan hamyonbop xonadon va ishonchli xonadoshlarni osongina toping.",
    searchPlaceholder: 'Metro, tumani yoki oliygoh nomini kiriting...',
    filters: 'Moslashtirish filtri', reset: 'Tozalash', university: 'Oliygoh', type: "E'lon turi",
    rooms: 'Xonalar soni', roomsShort: 'xona', sort: 'Saralash', maxPrice: 'Maks. narx', all: 'Barchasi',
    roommate: 'Xonadosh kerak', apartment: "To'liq xonadon", newest: "Yangi e'lonlar",
    priceLow: 'Narx: arzonidan', priceHigh: 'Narx: qimmatidan', notFound: "Mos e'lonlar topilmadi",
    details: 'Batafsil', loadMore: "Yana ko'rsatish", shown: 'ta e\'lon topildi', call: "Qo'ng'iroq qilish", monthly: 'oyiga', nearby: 'Yaqinida',
    nearUni: '{uni} yaqinida', back: 'Ortga qaytish', verified: 'Tasdiqlangan',
    addTitle: "Yangi e'lon qo'shish", titleLabel: "E'lon sarlavhasi", priceLabel: 'Narxi ($)',
    phoneLabel: 'Telefon raqam', addressLabel: 'Manzil', descLabel: 'Tavsif', submitBtn: "E'lonni joylash",
    deleteBtn: "E'lonni o'chirish", locationOnMap: 'Joylashuv xaritasi',
    titleRequired: 'Sarlavha kiritilishi shart!', saving: 'Saqlanmoqda...',
    listingSaved: "E'lon saqlandi! Admin tasdiqlagach \"Tasdiqlangan\" belgisi chiqadi.",
    listingDeleted: "E'lon o'chirildi!", errorGeneric: 'Xatolik yuz berdi!', retry: 'Qayta urinish',
    listingNotFound: "Uy ma'lumoti topilmadi.", pageNotFound: 'Sahifa topilmadi', noFavs: "Hozircha saralangan uylar yo'q",
    favAdded: "Saralanganlarga qo'shildi!", favRemoved: 'Saralanganlardan olib tashlandi',
    // auth
    loginTitle: 'Xush kelibsiz!', loginSub: 'Davom etish uchun telefon raqami va parolingizni kiriting',
    registerSub: "Yangi akkaunt yarating — bir daqiqa ichida", tabLogin: 'Kirish', tabRegister: "Ro'yxatdan o'tish",
    nameLabel: 'Ismingiz', nameRequired: 'Ism kiritilishi shart!', passwordLabel: 'Parol',
    confirmLabel: 'Parolni takrorlang', passwordMismatch: 'Parollar mos kelmadi',
    loginBtn: 'Kirish', registerBtn: "Ro'yxatdan o'tish", loggingIn: 'Tekshirilmoqda...',
    phoneRequired: 'Telefon raqami kiritilishi shart!', phoneInvalid: "Raqam noto'g'ri (masalan: +998 90 123 45 67)",
    passwordRequired: 'Parol kiritilishi shart!', passwordMin: "Parol kamida 4 ta belgidan iborat bo'lishi kerak",
    userExists: "Bu raqam allaqachon ro'yxatdan o'tgan", wrongCreds: "Telefon yoki parol noto'g'ri",
    blockedMsg: 'Akkaunt bloklangan. Admin bilan bog\'laning.', registered: "Ro'yxatdan o'tdingiz!",
    logoutBtn: 'Chiqish', logoutConfirm: 'Rostdan ham chiqmoqchimisiz?', deleteConfirm: "Rostdan ham ushbu e'lonni o'chirmoqchimisiz?",
    // cabinet
    cabinet: 'Kabinet', profile: 'Profil', myOrders: 'Buyurtmalarim', myListings: "E'lonlarim", history: "To'lovlar tarixi",
    saveBtn: 'Saqlash', newPassword: 'Yangi parol (ixtiyoriy)', saved: 'Saqlandi!',
    noOrders: "Hali buyurtmalar yo'q", noListings: "Hali e'lon bermagansiz", noPayments: "To'lovlar hali yo'q",
    role: 'Rol', roleAdmin: 'Admin', roleUser: 'Foydalanuvchi', memberSince: "Ro'yxatdan o'tgan sana",
    // orders + payment
    book: 'Bron qilish', bookTitle: "Bron so'rovi", moveInLabel: "Ko'chib o'tish sanasi", moveInRequired: 'Sanani tanlang',
    noteLabel: 'Izoh (ixtiyoriy)', sendRequest: "So'rov yuborish", sending: 'Yuborilmoqda...',
    orderCreated: "Bron so'rovi yuborildi!", statusPending: 'Kutilmoqda', statusConfirmed: 'Tasdiqlandi', statusCancelled: 'Bekor qilindi',
    paidBadge: "To'langan", unpaidBadge: "To'lanmagan", payNow: "To'lash", payLater: 'Keyinroq',
    payTitle: "Bron to'lovi", payDeposit: "Oldindan to'lov (oylik narxning 10%)", chooseProvider: "To'lov usulini tanlang",
    payBtn: "To'lash", paying: "To'lov amalga oshirilmoqda...", paySuccess: "To'lov qabul qilindi!",
    payDemo: "Demo rejim: haqiqiy pul yechilmaydi.", sum: "so'm",
    // admin
    adminPanel: 'Admin panel', accessDenied: "Bu sahifaga kirish huquqingiz yo'q",
    tabStats: 'Statistika', tabListings: "E'lonlar", tabUsers: 'Foydalanuvchilar', tabOrders: 'Buyurtmalar',
    visitsToday: 'Bugungi tashriflar', totalUsers: 'Foydalanuvchilar', totalListings: "E'lonlar", totalOrders: 'Buyurtmalar',
    pendingOrders: 'Kutilayotgan', revenue: "To'lovlar summasi", visits7: "So'nggi 7 kun tashrifi", byUniversity: "Oliygohlar bo'yicha e'lonlar",
    verifyBtn: 'Tasdiqlash', unverifyBtn: 'Tasdiqni olish', blockBtn: 'Bloklash', unblockBtn: 'Blokdan chiqarish',
    makeAdmin: 'Admin qilish', makeUser: 'Oddiy qilish', deleteShort: "O'chirish", confirmBtn: 'Tasdiqlash', cancelBtn: 'Bekor qilish',
    deleteUserConfirm: "Foydalanuvchini o'chirmoqchimisiz?",
    colTitle: 'Sarlavha', colOwner: 'Egasi', colPrice: 'Narx', colName: 'Ism', colPhone: 'Telefon', colRole: 'Rol',
    colStatus: 'Holat', colDate: 'Sana', colListing: 'Uy', colUser: 'Foydalanuvchi', colPaid: "To'lov", colActions: 'Amallar', noData: "Ma'lumot yo'q",
    // AI
    aiTitle: 'AI yordamchi', aiGreeting: 'Salom! Byudjet, oliygoh va xonalar sonini yozing, men mos uylarni topaman. Masalan: "TATU yaqinida 100 dollargacha xonadosh"',
    aiPlaceholder: 'Nima qidiryapsiz?', aiFound: 'Mana sizga mos variantlar:', aiNone: "Mos variant topilmadi. Narxni oshirib yoki boshqa oliygohni sinab ko'ring.",
    aiHint: 'Oliygoh, narx yoki xonalar sonini yozing.', recommended: 'Sizga tavsiya',
    // chat
    viewList: "Ro'yxat", viewMap: 'Xarita', mapError: "Xaritani yuklab bo'lmadi. Internetni tekshiring.",
    mapApprox: "Nuqtalar oliygoh atrofidagi taxminiy joylashuvni ko'rsatadi.", filterBtn: 'Filtr', applyBtn: "Ko'rsatish",
    newBadge: 'Yangi', browse: "Uylarni ko'rish", statListings: "e'lon", statUnis: 'oliygoh', statLangs: 'til', statFrom: 'dan',
    photos: 'Rasmlar', addPhotos: "Rasm qo'shish", photosHint: "Eng ko'pi bilan 5 ta. Birinchisi asosiy rasm bo'ladi.", cover: 'Asosiy',
    storageFull: "Xotira to'ldi. Rasmlar sonini yoki hajmini kamaytiring.",
    chatPlaceholder: 'Xabar yozing...', chatEmpty: "Hali xabarlar yo'q. Birinchi bo'lib yozing!", chatOnline: 'faol'
  },
  en: {
    home: 'Home', favorites: 'Favorites', addListing: 'Add Listing', chat: 'Student Chat',
    heroKicker: 'For Tashkent universities', brandTag: 'Tashkent student portal',
    heroTitle: 'Cozy & Affordable Student Housing',
    heroSub: 'Easily find suitable budget apartments and reliable roommates near your university.',
    searchPlaceholder: 'Search by metro, district or university...',
    filters: 'Custom Filters', reset: 'Reset', university: 'University', type: 'Listing Type',
    rooms: 'Rooms Count', roomsShort: 'rooms', sort: 'Sort By', maxPrice: 'Max Price', all: 'All',
    roommate: 'Roommate needed', apartment: 'Full Apartment', newest: 'Newest first',
    priceLow: 'Price: Low to High', priceHigh: 'Price: High to Low', notFound: 'No listings found',
    details: 'Details', loadMore: 'Show more', shown: 'listings found', call: 'Call Now', monthly: 'per month', nearby: 'Nearby',
    nearUni: 'Near {uni}', back: 'Back', verified: 'Verified',
    addTitle: 'Add New Listing', titleLabel: 'Listing Title', priceLabel: 'Price ($)',
    phoneLabel: 'Phone Number', addressLabel: 'Address', descLabel: 'Description', submitBtn: 'Submit Listing',
    deleteBtn: 'Delete Listing', locationOnMap: 'Location Map',
    titleRequired: 'Title is required!', saving: 'Saving...',
    listingSaved: 'Listing saved! The "Verified" badge appears after admin approval.',
    listingDeleted: 'Listing deleted!', errorGeneric: 'Something went wrong!', retry: 'Try again',
    listingNotFound: 'Listing not found.', pageNotFound: 'Page not found', noFavs: 'No favorites yet',
    favAdded: 'Added to favorites!', favRemoved: 'Removed from favorites',
    loginTitle: 'Welcome!', loginSub: 'Enter your phone number and password to continue',
    registerSub: 'Create a new account in a minute', tabLogin: 'Sign in', tabRegister: 'Sign up',
    nameLabel: 'Your name', nameRequired: 'Name is required!', passwordLabel: 'Password',
    confirmLabel: 'Repeat password', passwordMismatch: 'Passwords do not match',
    loginBtn: 'Sign In', registerBtn: 'Sign Up', loggingIn: 'Checking...',
    phoneRequired: 'Phone number is required!', phoneInvalid: 'Invalid number (e.g. +998 90 123 45 67)',
    passwordRequired: 'Password is required!', passwordMin: 'Password must be at least 4 characters',
    userExists: 'This number is already registered', wrongCreds: 'Wrong phone or password',
    blockedMsg: 'Account is blocked. Contact the admin.', registered: 'Account created!',
    logoutBtn: 'Log out', logoutConfirm: 'Do you really want to log out?', deleteConfirm: 'Delete this listing?',
    cabinet: 'Account', profile: 'Profile', myOrders: 'My orders', myListings: 'My listings', history: 'Payment history',
    saveBtn: 'Save', newPassword: 'New password (optional)', saved: 'Saved!',
    noOrders: 'No orders yet', noListings: 'You have no listings yet', noPayments: 'No payments yet',
    role: 'Role', roleAdmin: 'Admin', roleUser: 'User', memberSince: 'Member since',
    book: 'Book now', bookTitle: 'Booking request', moveInLabel: 'Move-in date', moveInRequired: 'Pick a date',
    noteLabel: 'Note (optional)', sendRequest: 'Send request', sending: 'Sending...',
    orderCreated: 'Booking request sent!', statusPending: 'Pending', statusConfirmed: 'Confirmed', statusCancelled: 'Cancelled',
    paidBadge: 'Paid', unpaidBadge: 'Unpaid', payNow: 'Pay now', payLater: 'Later',
    payTitle: 'Booking payment', payDeposit: 'Deposit (10% of monthly price)', chooseProvider: 'Choose payment method',
    payBtn: 'Pay', paying: 'Processing payment...', paySuccess: 'Payment received!',
    payDemo: 'Demo mode: no real money is charged.', sum: 'UZS',
    adminPanel: 'Admin panel', accessDenied: 'You do not have access to this page',
    tabStats: 'Statistics', tabListings: 'Listings', tabUsers: 'Users', tabOrders: 'Orders',
    visitsToday: 'Visits today', totalUsers: 'Users', totalListings: 'Listings', totalOrders: 'Orders',
    pendingOrders: 'Pending', revenue: 'Payments total', visits7: 'Visits, last 7 days', byUniversity: 'Listings by university',
    verifyBtn: 'Verify', unverifyBtn: 'Unverify', blockBtn: 'Block', unblockBtn: 'Unblock',
    makeAdmin: 'Make admin', makeUser: 'Make user', deleteShort: 'Delete', confirmBtn: 'Confirm', cancelBtn: 'Cancel',
    deleteUserConfirm: 'Delete this user?',
    colTitle: 'Title', colOwner: 'Owner', colPrice: 'Price', colName: 'Name', colPhone: 'Phone', colRole: 'Role',
    colStatus: 'Status', colDate: 'Date', colListing: 'Listing', colUser: 'User', colPaid: 'Payment', colActions: 'Actions', noData: 'No data',
    aiTitle: 'AI assistant', aiGreeting: 'Hi! Tell me your budget, university and rooms and I will find matches. Example: "roommate near TATU up to 100 dollars"',
    aiPlaceholder: 'What are you looking for?', aiFound: 'Here are some matches:', aiNone: 'No matches. Try a higher budget or another university.',
    aiHint: 'Mention a university, price or number of rooms.', recommended: 'Recommended for you',
    viewList: 'List', viewMap: 'Map', mapError: 'Could not load the map. Check your connection.',
    mapApprox: 'Pins show approximate locations around each university.', filterBtn: 'Filters', applyBtn: 'Show',
    newBadge: 'New', browse: 'Browse homes', statListings: 'listings', statUnis: 'universities', statLangs: 'languages', statFrom: 'from',
    photos: 'Photos', addPhotos: 'Add photos', photosHint: 'Up to 5. The first one is the cover.', cover: 'Cover',
    storageFull: 'Storage is full. Use fewer or smaller photos.',
    chatPlaceholder: 'Write a message...', chatEmpty: 'No messages yet. Be the first to write!', chatOnline: 'active'
  },
  ru: {
    home: 'Главная', favorites: 'Избранное', addListing: 'Добавить объявление', chat: 'Чат студентов',
    heroKicker: 'Для вузов Ташкента', brandTag: 'Студенческий портал Ташкента',
    heroTitle: 'Уютное жильё для студентов',
    heroSub: 'Легко найдите бюджетную квартиру и надёжных соседей рядом с университетом.',
    searchPlaceholder: 'Поиск по метро, району или университету...',
    filters: 'Настроить фильтр', reset: 'Сбросить', university: 'Университет', type: 'Тип объявления',
    rooms: 'Количество комнат', roomsShort: 'комн.', sort: 'Сортировка', maxPrice: 'Макс. цена', all: 'Все',
    roommate: 'Нужен сосед', apartment: 'Вся квартира', newest: 'Сначала новые',
    priceLow: 'Цена: по возрастанию', priceHigh: 'Цена: по убыванию', notFound: 'Объявления не найдены',
    details: 'Подробнее', loadMore: 'Показать ещё', shown: 'объявлений найдено', call: 'Позвонить', monthly: 'в месяц', nearby: 'Рядом',
    nearUni: 'Рядом с {uni}', back: 'Назад', verified: 'Проверено',
    addTitle: 'Добавить объявление', titleLabel: 'Заголовок', priceLabel: 'Цена ($)',
    phoneLabel: 'Номер телефона', addressLabel: 'Адрес', descLabel: 'Описание', submitBtn: 'Опубликовать',
    deleteBtn: 'Удалить объявление', locationOnMap: 'Карта расположения',
    titleRequired: 'Введите заголовок!', saving: 'Сохранение...',
    listingSaved: 'Объявление сохранено! Отметка «Проверено» появится после подтверждения админом.',
    listingDeleted: 'Объявление удалено!', errorGeneric: 'Произошла ошибка!', retry: 'Повторить',
    listingNotFound: 'Объявление не найдено.', pageNotFound: 'Страница не найдена', noFavs: 'Пока нет избранных',
    favAdded: 'Добавлено в избранное!', favRemoved: 'Удалено из избранного',
    loginTitle: 'Добро пожаловать!', loginSub: 'Введите номер телефона и пароль, чтобы продолжить',
    registerSub: 'Создайте аккаунт за минуту', tabLogin: 'Вход', tabRegister: 'Регистрация',
    nameLabel: 'Ваше имя', nameRequired: 'Введите имя!', passwordLabel: 'Пароль',
    confirmLabel: 'Повторите пароль', passwordMismatch: 'Пароли не совпадают',
    loginBtn: 'Войти', registerBtn: 'Зарегистрироваться', loggingIn: 'Проверка...',
    phoneRequired: 'Введите номер телефона!', phoneInvalid: 'Неверный номер (например: +998 90 123 45 67)',
    passwordRequired: 'Введите пароль!', passwordMin: 'Пароль должен содержать минимум 4 символа',
    userExists: 'Этот номер уже зарегистрирован', wrongCreds: 'Неверный телефон или пароль',
    blockedMsg: 'Аккаунт заблокирован. Свяжитесь с админом.', registered: 'Вы зарегистрированы!',
    logoutBtn: 'Выйти', logoutConfirm: 'Вы действительно хотите выйти?', deleteConfirm: 'Удалить это объявление?',
    cabinet: 'Кабинет', profile: 'Профиль', myOrders: 'Мои заказы', myListings: 'Мои объявления', history: 'История платежей',
    saveBtn: 'Сохранить', newPassword: 'Новый пароль (необязательно)', saved: 'Сохранено!',
    noOrders: 'Заказов пока нет', noListings: 'У вас пока нет объявлений', noPayments: 'Платежей пока нет',
    role: 'Роль', roleAdmin: 'Админ', roleUser: 'Пользователь', memberSince: 'Дата регистрации',
    book: 'Забронировать', bookTitle: 'Запрос на бронь', moveInLabel: 'Дата заезда', moveInRequired: 'Выберите дату',
    noteLabel: 'Комментарий (необязательно)', sendRequest: 'Отправить запрос', sending: 'Отправка...',
    orderCreated: 'Запрос на бронь отправлен!', statusPending: 'Ожидает', statusConfirmed: 'Подтверждён', statusCancelled: 'Отменён',
    paidBadge: 'Оплачено', unpaidBadge: 'Не оплачено', payNow: 'Оплатить', payLater: 'Позже',
    payTitle: 'Оплата брони', payDeposit: 'Предоплата (10% от месячной цены)', chooseProvider: 'Выберите способ оплаты',
    payBtn: 'Оплатить', paying: 'Выполняется оплата...', paySuccess: 'Платёж принят!',
    payDemo: 'Демо-режим: реальные деньги не списываются.', sum: 'сум',
    adminPanel: 'Админ-панель', accessDenied: 'У вас нет доступа к этой странице',
    tabStats: 'Статистика', tabListings: 'Объявления', tabUsers: 'Пользователи', tabOrders: 'Заказы',
    visitsToday: 'Визиты сегодня', totalUsers: 'Пользователи', totalListings: 'Объявления', totalOrders: 'Заказы',
    pendingOrders: 'Ожидают', revenue: 'Сумма платежей', visits7: 'Визиты за 7 дней', byUniversity: 'Объявления по вузам',
    verifyBtn: 'Подтвердить', unverifyBtn: 'Снять отметку', blockBtn: 'Заблокировать', unblockBtn: 'Разблокировать',
    makeAdmin: 'Сделать админом', makeUser: 'Сделать обычным', deleteShort: 'Удалить', confirmBtn: 'Подтвердить', cancelBtn: 'Отменить',
    deleteUserConfirm: 'Удалить пользователя?',
    colTitle: 'Заголовок', colOwner: 'Владелец', colPrice: 'Цена', colName: 'Имя', colPhone: 'Телефон', colRole: 'Роль',
    colStatus: 'Статус', colDate: 'Дата', colListing: 'Жильё', colUser: 'Пользователь', colPaid: 'Оплата', colActions: 'Действия', noData: 'Нет данных',
    aiTitle: 'AI помощник', aiGreeting: 'Привет! Напишите бюджет, вуз и число комнат, и я подберу жильё. Например: «сосед рядом с TATU до 100 долларов»',
    aiPlaceholder: 'Что ищете?', aiFound: 'Вот подходящие варианты:', aiNone: 'Ничего не найдено. Увеличьте бюджет или попробуйте другой вуз.',
    aiHint: 'Укажите вуз, цену или число комнат.', recommended: 'Рекомендуем вам',
    viewList: 'Список', viewMap: 'Карта', mapError: 'Не удалось загрузить карту. Проверьте интернет.',
    mapApprox: 'Точки показывают примерное расположение рядом с вузом.', filterBtn: 'Фильтры', applyBtn: 'Показать',
    newBadge: 'Новое', browse: 'Смотреть жильё', statListings: 'объявлений', statUnis: 'вузов', statLangs: 'языка', statFrom: 'от',
    photos: 'Фото', addPhotos: 'Добавить фото', photosHint: 'Максимум 5. Первое — обложка.', cover: 'Обложка',
    storageFull: 'Память заполнена. Загрузите меньше или меньшие по размеру фото.',
    chatPlaceholder: 'Напишите сообщение...', chatEmpty: 'Сообщений пока нет. Напишите первым!', chatOnline: 'активны'
  }
};



const useStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null, // { id, name, phone, role }
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

      darkMode: false,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      lang: 'uz',
      setLang: (lang) => set({ lang }),
      t: (key) => (translations[get().lang] && translations[get().lang][key]) || translations.uz[key] || key,

      favorites: [],
      toggleFavorite: (id) => {
        const exists = get().favorites.includes(id);
        if (exists) {
          set({ favorites: get().favorites.filter((f) => f !== id) });
          toast.error(get().t('favRemoved'));
        } else {
          set({ favorites: [...get().favorites, id] });
          toast.success(get().t('favAdded'));
        }
      },

      searchQuery: '', selectedUniversity: 'Barchasi', selectedType: 'Barchasi',
      selectedRooms: 'Barchasi', sortBy: 'default', maxPrice: 500,
      setSearchQuery: (v) => set({ searchQuery: v }),
      setSelectedUniversity: (v) => set({ selectedUniversity: v }),
      setSelectedType: (v) => set({ selectedType: v }),
      setSelectedRooms: (v) => set({ selectedRooms: v }),
      setSortBy: (v) => set({ sortBy: v }),
      setMaxPrice: (v) => set({ maxPrice: v }),
      resetFilters: () => set({
        searchQuery: '', selectedUniversity: 'Barchasi', selectedType: 'Barchasi',
        selectedRooms: 'Barchasi', sortBy: 'default', maxPrice: 500
      })
    }),
    {
      name: 'talabauy_student_app_state_v5',
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated, user: s.user, darkMode: s.darkMode, lang: s.lang,
        favorites: s.favorites, searchQuery: s.searchQuery, selectedUniversity: s.selectedUniversity,
        selectedType: s.selectedType, selectedRooms: s.selectedRooms, sortBy: s.sortBy, maxPrice: s.maxPrice
      })
    }
  )
);



function useSEO({ title, description, image } = {}) {
  const lang = useStore((s) => s.lang);
  const location = useLocation();
  useEffect(() => {
    const desc = description || translations[lang].heroSub;
    const fullTitle = title ? `${title} | TalabaUy` : `TalabaUy — ${translations[lang].heroTitle}`;
    document.documentElement.lang = lang;
    document.title = fullTitle;
    const meta = (attr, name, content) => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    meta('name', 'description', String(desc).slice(0, 160));
    meta('property', 'og:title', fullTitle);
    meta('property', 'og:description', String(desc).slice(0, 200));
    meta('property', 'og:type', 'website');
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    if (image) meta('property', 'og:image', image);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
    link.setAttribute('href', window.location.origin + location.pathname);
  }, [title, description, image, lang, location.pathname]);
}



const gridVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};

function PageTransition({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="h-52 tu-skeleton" />
          <div className="p-5 space-y-3">
            <div className="h-3 tu-skeleton rounded-full w-1/3" />
            <div className="h-5 tu-skeleton rounded-full w-4/5" />
            <div className="h-3 tu-skeleton rounded-full w-3/5" />
            <div className="flex gap-2 pt-1"><div className="h-6 w-16 tu-skeleton rounded-full" /><div className="h-6 w-20 tu-skeleton rounded-full" /></div>
            <div className="h-10 tu-skeleton rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}


const GLOBAL_CSS = `
html body { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
html .font-serif { font-family: 'Fraunces', Georgia, 'Times New Roman', serif; letter-spacing: -0.01em; }
html .text-xs { font-size: 0.8125rem; line-height: 1.25rem; }
html .text-sm { font-size: 0.9375rem; line-height: 1.45rem; }
@media (max-width: 640px) { html input, html select, html textarea { font-size: 16px !important; } }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
.tu-skeleton { background: linear-gradient(90deg, rgba(148,163,184,.18) 25%, rgba(148,163,184,.34) 37%, rgba(148,163,184,.18) 63%); background-size: 400% 100%; animation: tu-shimmer 1.4s ease infinite; }
@keyframes tu-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
.tu-pin { position: relative; background: #0369a1; color: #fff; font: 700 12px Inter, system-ui, sans-serif; padding: 5px 9px; border-radius: 999px; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.35); text-align: center; white-space: nowrap; }
.tu-pin::after { content: ''; position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #0369a1; }
.tu-pin-apt { background: #ea580c; }
.tu-pin-apt::after { border-top-color: #ea580c; }
.leaflet-container { font-family: Inter, system-ui, sans-serif; border-radius: 1rem; }
`;

function GlobalStyle() {
  useEffect(() => {
    if (document.getElementById('tu-fonts')) return;
    const l = document.createElement('link');
    l.id = 'tu-fonts';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(l);
  }, []);
  return <style>{GLOBAL_CSS}</style>;
}

// Raqam 0 dan qiymatgacha sanab chiqadi
function CountUp({ value, prefix = '' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{prefix}{n}</>;
}

const inputCls = 'w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500';
const labelCls = 'block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1';
const errCls = 'text-[11px] text-rose-500 font-bold block mt-1';

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-slate-800 dark:text-white">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-4 h-4" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatusBadge({ status }) {
  const t = useStore((s) => s.t);
  const map = {
    pending: ['bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', 'statusPending'],
    confirmed: ['bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', 'statusConfirmed'],
    cancelled: ['bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', 'statusCancelled'],
  };
  const [cls, key] = map[status] || map.pending;
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${cls}`}>{t(key)}</span>;
}



function Intro({ onDone }) {
  const [open, setOpen] = useState(false);
  const harflar = 'TalabaUy'.split('');

  useEffect(() => {
    const t1 = setTimeout(() => setOpen(true), 1900);
    const t2 = setTimeout(onDone, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      <motion.div className="absolute top-0 left-0 w-1/2 h-full bg-sky-900" animate={{ x: open ? '-100%' : '0%' }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} />
      <motion.div className="absolute top-0 right-0 w-1/2 h-full bg-sky-900" animate={{ x: open ? '100%' : '0%' }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} />
      <motion.div className="absolute inset-0 flex flex-col items-center justify-center" animate={{ opacity: open ? 0 : 1 }} transition={{ duration: 0.3 }}>
        <div className="relative w-24 h-24 flex items-center justify-center mb-6">
          <motion.div className="absolute inset-0 border-2 border-white/40" initial={{ scale: 0, rotate: 45 }} animate={{ scale: 1, rotate: 225 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
          <motion.div className="w-14 h-14 bg-white text-sky-900 rounded-lg flex items-center justify-center font-serif text-3xl font-bold" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}>T</motion.div>
        </div>
        <div className="flex text-white font-serif text-3xl font-bold">
          {harflar.map((h, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.07 }}>{h}</motion.span>
          ))}
        </div>
        <div className="w-40 h-1 bg-white/20 rounded-full mt-6 overflow-hidden">
          <motion.div className="h-full bg-white" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.8, ease: 'easeInOut' }} />
        </div>
      </motion.div>
    </div>
  );
}



function AuthPage({ onSuccess }) {
  const { login, t, darkMode, toggleDarkMode, lang, setLang } = useStore();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, getValues, reset, formState: { errors } } = useForm();
  const loginMutation = useAuthMutation('login');
  const registerMutation = useAuthMutation('register');
  const mutation = mode === 'login' ? loginMutation : registerMutation;
  useSEO({ title: mode === 'login' ? t('tabLogin') : t('tabRegister') });

  useLayoutEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);

  const switchMode = (m) => { setMode(m); reset(); };
  const cycleLang = () => setLang(lang === 'uz' ? 'en' : lang === 'en' ? 'ru' : 'uz');

  const onSubmit = (data) => {
    mutation.mutate(data, {
      onSuccess: (user) => {
        onSuccess();
        login(user);
        toast.success(mode === 'login' ? t('loginTitle') : t('registered'));
      },
      onError: (err) => {
        const map = { exists: 'userExists', wrong: 'wrongCreds', blocked: 'blockedMsg' };
        toast.error(t(map[errCode(err)] || 'errorGeneric'));
      }
    });
  };

  const fieldCls = 'w-full pl-9 pr-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow';

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-sky-900 px-4 py-10 overflow-hidden">
      <motion.svg className="absolute inset-0 w-[120%] h-[120%] -left-[10%] -top-[10%] opacity-[0.06]" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
        animate={{ x: [0, 28, 0], y: [0, 28, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
        <pattern id="tileGridLogin" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M28 0 L56 28 L28 56 L0 28 Z" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#tileGridLogin)" />
      </motion.svg>

      <motion.div aria-hidden="true" className="absolute w-72 h-72 rounded-full bg-orange-600/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />

      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button onClick={cycleLang} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-bold uppercase hover:bg-white/20 transition flex items-center gap-1">
          <Languages className="w-3.5 h-3.5" /> {lang}
        </button>
        <button onClick={toggleDarkMode} className="p-2.5 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">
          {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/5">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-sky-600 to-orange-600" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-5">
            <motion.div initial={{ rotate: -20, scale: 0.7, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="w-11 h-11 bg-sky-600 rounded-lg text-white flex items-center justify-center font-serif text-xl font-bold mb-4">T</motion.div>
            <h1 className="text-xl font-serif font-bold text-slate-800 dark:text-white">{t('loginTitle')}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{mode === 'login' ? t('loginSub') : t('registerSub')}</p>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-xl bg-slate-100 dark:bg-slate-900">
            {[['login', t('tabLogin'), LogIn], ['register', t('tabRegister'), UserPlus]].map(([m, label, Icon]) => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${mode === m ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" key={mode}>
            {mode === 'register' && (
              <div>
                <label className={labelCls}>{t('nameLabel')}</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" autoComplete="name" {...register('name', { required: t('nameRequired'), validate: (v) => v.trim().length > 0 || t('nameRequired') })} className={fieldCls} />
                </div>
                {errors.name && <span className={errCls}>{errors.name.message}</span>}
              </div>
            )}

            <div>
              <label className={labelCls}>{t('phoneLabel')}</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="+998 90 123 45 67" autoComplete="tel"
                  {...register('phone', { required: t('phoneRequired'), validate: (v) => isValidPhone(v) || t('phoneInvalid') })} className={fieldCls} />
              </div>
              {errors.phone && <span className={errCls}>{errors.phone.message}</span>}
            </div>

            <div>
              <label className={labelCls}>{t('passwordLabel')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  {...register('password', { required: t('passwordRequired'), minLength: { value: 4, message: t('passwordMin') } })} className={`${fieldCls} pr-9`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <span className={errCls}>{errors.password.message}</span>}
            </div>

            {mode === 'register' && (
              <div>
                <label className={labelCls}>{t('confirmLabel')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                    {...register('confirm', { validate: (v) => v === getValues('password') || t('passwordMismatch') })} className={fieldCls} />
                </div>
                {errors.confirm && <span className={errCls}>{errors.confirm.message}</span>}
              </div>
            )}

            <motion.button type="submit" disabled={mutation.isPending} whileTap={{ scale: mutation.isPending ? 1 : 0.97 }}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2">
              {mutation.isPending && <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full" />}
              {mutation.isPending ? t('loggingIn') : mode === 'login' ? t('loginBtn') : t('registerBtn')}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}



function Navbar() {
  const { darkMode, toggleDarkMode, lang, setLang, favorites, t, user, logout } = useStore();
  const cycleLang = () => setLang(lang === 'uz' ? 'en' : lang === 'en' ? 'ru' : 'uz');
  const handleLogout = () => { if (window.confirm(t('logoutConfirm'))) logout(); };
  const linkCls = (isActive) => `hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' : 'text-slate-600 dark:text-slate-300 hover:text-sky-600'}`;
  const label = (text) => <span className="hidden xl:inline">{text}</span>;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-sky-600 rounded-lg text-white shadow-sm flex items-center justify-center font-serif text-lg font-bold group-hover:bg-sky-700 transition-colors">T</div>
          <div>
            <span className="text-lg font-serif font-bold text-slate-900 dark:text-white leading-none">TalabaUy</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t('brandTag')}</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5">
          <NavLink to="/" end title={t('home')} className={({ isActive }) => linkCls(isActive)}><HomeIcon className="w-4 h-4" />{label(t('home'))}</NavLink>
          <NavLink to="/favorites" title={t('favorites')} className={({ isActive }) => linkCls(isActive)}>
            <Heart className="w-4 h-4 text-rose-500" />{label(t('favorites'))}
            {favorites.length > 0 && <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-500 text-white">{favorites.length}</span>}
          </NavLink>
          <NavLink to="/add" title={t('addListing')} className={({ isActive }) => linkCls(isActive)}><PlusCircle className="w-4 h-4" />{label(t('addListing'))}</NavLink>
          <NavLink to="/chat" title={t('chat')} className={({ isActive }) => linkCls(isActive)}><MessageCircle className="w-4 h-4" />{label(t('chat'))}</NavLink>
          <NavLink to="/cabinet" title={t('cabinet')} className={({ isActive }) => linkCls(isActive)}><User className="w-4 h-4" />{label(t('cabinet'))}</NavLink>
          {user && user.role === 'admin' && (
            <NavLink to="/admin" title={t('adminPanel')} className={({ isActive }) => linkCls(isActive)}><ShieldCheck className="w-4 h-4 text-orange-600" />{label(t('adminPanel'))}</NavLink>
          )}

          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200 dark:border-slate-800">
            <button onClick={cycleLang} className="px-2.5 py-1.5 text-xs font-bold uppercase rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 hover:border-sky-500 transition">
              <Languages className="w-3.5 h-3.5 text-sky-600" /> {lang}
            </button>
            <button onClick={toggleDarkMode} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <button onClick={handleLogout} title={user ? `${user.name} — ${t('logoutBtn')}` : t('logoutBtn')}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 rounded-xl transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const { favorites, t } = useStore();
  const cls = (isActive) => `flex flex-col items-center gap-1 p-2 text-[11px] font-bold rounded-xl min-w-[3.5rem] ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' : 'text-slate-500'}`;
  return (
    <div className="sm:hidden fixed left-3 right-3 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xl flex justify-around items-center"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
      <NavLink to="/" end className={({ isActive }) => cls(isActive)}><HomeIcon className="w-5 h-5" /><span>{t('home')}</span></NavLink>
      <NavLink to="/favorites" className={({ isActive }) => `relative ${cls(isActive)}`}>
        <Heart className="w-5 h-5 text-rose-500" /><span>{t('favorites')}</span>
        {favorites.length > 0 && <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500" />}
      </NavLink>
      <NavLink to="/add" className={({ isActive }) => cls(isActive)}><PlusCircle className="w-5 h-5 text-sky-600" /><span>{t('addListing').split(' ')[0]}</span></NavLink>
      <NavLink to="/chat" className={({ isActive }) => cls(isActive)}><MessageCircle className="w-5 h-5 text-sky-600" /><span>Chat</span></NavLink>
      <NavLink to="/cabinet" className={({ isActive }) => cls(isActive)}><User className="w-5 h-5 text-sky-600" /><span>{t('cabinet')}</span></NavLink>
    </div>
  );
}



const typeLabel = (t, type) => t(type === 'Xonadon' ? 'apartment' : 'roommate');

const ListingCard = React.memo(function ListingCard({ item }) {
  const { favorites, toggleFavorite, t } = useStore();
  const isFav = favorites.includes(item.id);
  const isNew = item.ownerId && Date.now() - new Date(item.createdAt).getTime() < 14 * 864e5;

  return (
    <motion.div layout variants={cardVariants} initial="hidden" animate="visible" exit="hidden" whileHover={{ y: -4 }} transition={{ layout: { duration: 0.3 } }}
      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="relative">
        <Link to={`/listing/${item.id}`} className="block relative h-52 bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover dark:brightness-90 group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {item.verified && <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 text-sky-700 text-[11px] font-bold shadow-sm"><CheckCircle2 className="w-3 h-3" /> {t('verified')}</span>}
            {isNew && <span className="px-2 py-1 rounded-full bg-orange-600 text-white text-[11px] font-bold shadow-sm">{t('newBadge')}</span>}
          </div>
          <div className="absolute bottom-3 left-4 text-white drop-shadow">
            <span className="text-2xl font-serif font-bold">${item.price}</span>
            <span className="text-xs opacity-90"> / {t('monthly')}</span>
          </div>
        </Link>
        <motion.button onClick={() => toggleFavorite(item.id)} whileTap={{ scale: 0.85 }} aria-label="favorite"
          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 dark:bg-slate-900/85 backdrop-blur-sm shadow-md">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={isFav ? 'fav' : 'unfav'} initial={{ scale: 0.5, rotate: -15, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }} className="block">
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-200'}`} />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'Xonadon' ? 'bg-sky-600' : 'bg-orange-600'}`} />
          <span>{typeLabel(t, item.type)}</span>
        </div>
        <h3 className="text-base font-serif font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-2 group-hover:text-sky-600 transition-colors min-h-[2.75rem]">{item.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" /> <span className="line-clamp-1">{item.address}</span>
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-[11px] font-semibold text-slate-600 dark:text-slate-200"><GraduationCap className="w-3 h-3 text-sky-600" /> {item.university}</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-[11px] font-semibold text-slate-600 dark:text-slate-200"><DoorOpen className="w-3 h-3 text-sky-600" /> {item.rooms} {t('roomsShort')}</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-[11px] font-semibold text-slate-600 dark:text-slate-200"><Navigation className="w-3 h-3 text-sky-600" /> {(item.distance || t('nearby')).split(' (')[0]}</span>
        </div>
        <Link to={`/listing/${item.id}`} className="mt-auto flex items-center justify-center gap-1 py-2.5 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 dark:hover:text-white rounded-xl transition">
          {t('details')} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
});




function ListingsMap({ items }) {
  const t = useStore((s) => s.t);
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !boxRef.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(boxRef.current, { scrollWheelZoom: false }).setView([41.3111, 69.2797], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }
      layerRef.current.clearLayers();
      const points = [];
      items.forEach((item) => {
        const [lat, lng] = listingCoords(item);
        points.push([lat, lng]);
        const icon = L.divIcon({
          className: '',
          html: `<div class="tu-pin ${item.type === 'Xonadon' ? 'tu-pin-apt' : ''}">$${Number(item.price)}</div>`,
          iconSize: [56, 30], iconAnchor: [28, 34], popupAnchor: [0, -30]
        });

        const box = document.createElement('div');
        const title = document.createElement('div');
        title.textContent = item.title;
        title.style.cssText = 'font-weight:700;margin-bottom:4px;max-width:200px';
        const meta = document.createElement('div');
        meta.textContent = `${item.university} · ${item.rooms} ${t('roomsShort')} · $${item.price}`;
        meta.style.cssText = 'font-size:12px;color:#64748b;margin-bottom:8px';
        const btn = document.createElement('button');
        btn.textContent = t('details');
        btn.style.cssText = 'background:#0369a1;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer';
        btn.addEventListener('click', () => navigate(`/listing/${item.id}`));
        box.append(title, meta, btn);
        L.marker([lat, lng], { icon }).bindPopup(box).addTo(layerRef.current);
      });
      if (points.length) mapRef.current.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 60);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [items, navigate, t]);

  useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);

  if (error) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <MapIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('mapError')}</p>
      </div>
    );
  }
  return <div className="isolate relative z-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg"><div ref={boxRef} className="h-[65vh] min-h-[360px] w-full" /></div>;
}



function FilterFields() {
  const {
    t, selectedUniversity, setSelectedUniversity, selectedType, setSelectedType,
    selectedRooms, setSelectedRooms, sortBy, setSortBy, maxPrice, setMaxPrice
  } = useStore();
  const selectCls = 'w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none';
  const lbl = 'block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div>
        <label className={lbl}>{t('university')}</label>
        <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)} className={selectCls}>
          {universitiesList.map((u) => <option key={u} value={u}>{u === 'Barchasi' ? t('all') : u}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>{t('type')}</label>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={selectCls}>
          <option value="Barchasi">{t('all')}</option>
          <option value="Xonadosh">{t('roommate')}</option>
          <option value="Xonadon">{t('apartment')}</option>
        </select>
      </div>
      <div>
        <label className={lbl}>{t('rooms')}</label>
        <select value={selectedRooms} onChange={(e) => setSelectedRooms(e.target.value)} className={selectCls}>
          <option value="Barchasi">{t('all')}</option>
          <option value="1">1</option><option value="2">2</option><option value="3">3</option>
        </select>
      </div>
      <div>
        <label className={lbl}>{t('sort')}</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
          <option value="default">{t('newest')}</option>
          <option value="price-low">{t('priceLow')}</option>
          <option value="price-high">{t('priceHigh')}</option>
        </select>
      </div>
      <div>
        <div className={`flex justify-between ${lbl}`}><span>{t('maxPrice')}</span><span className="text-sky-600 font-black">${maxPrice}</span></div>
        <input type="range" min="30" max="500" step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-sky-600 cursor-pointer mt-1" />
      </div>
    </div>
  );
}

function ViewToggle({ view, setView }) {
  const t = useStore((s) => s.t);
  const btn = (key, Icon, label) => (
    <button type="button" onClick={() => setView(key)}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${view === key ? 'bg-sky-600 text-white shadow' : 'text-slate-500 dark:text-slate-300'}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
  return <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900">{btn('list', ListIcon, t('viewList'))}{btn('map', MapIcon, t('viewMap'))}</div>;
}

function Home() {
  const { data: listings = [], isLoading, isError, refetch } = useFetchListings();
  const {
    t, favorites, searchQuery, setSearchQuery, selectedUniversity, setSelectedUniversity,
    selectedType, selectedRooms, sortBy, maxPrice, resetFilters
  } = useStore();
  const [visible, setVisible] = useState(12);
  const [view, setView] = useState('list');
  const [filterOpen, setFilterOpen] = useState(false);
  useSEO();

  const filteredListings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return listings
      .filter((item) => {
        const matchesSearch = item.title.toLowerCase().includes(q) || item.address.toLowerCase().includes(q) || (item.university || '').toLowerCase().includes(q);
        const matchesUni = selectedUniversity === 'Barchasi' || item.university === selectedUniversity;
        const matchesType = selectedType === 'Barchasi' || item.type === selectedType;
        const matchesRooms = selectedRooms === 'Barchasi' || item.rooms === Number(selectedRooms);
        return matchesSearch && matchesUni && matchesType && matchesRooms && item.price <= maxPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [listings, searchQuery, selectedUniversity, selectedType, selectedRooms, maxPrice, sortBy]);

  useEffect(() => { setVisible(12); }, [searchQuery, selectedUniversity, selectedType, selectedRooms, maxPrice, sortBy]);


  const recommended = useMemo(() => {
    const favItems = listings.filter((l) => favorites.includes(l.id));
    if (favItems.length === 0) return [];
    const top = (key) => {
      const counts = favItems.reduce((a, i) => { a[i[key]] = (a[i[key]] || 0) + 1; return a; }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    };
    const uni = top('university');
    const type = top('type');
    const avg = favItems.reduce((s, i) => s + i.price, 0) / favItems.length;
    return listings
      .filter((l) => !favorites.includes(l.id))
      .map((l) => ({ l, score: (l.university === uni ? 3 : 0) + (l.type === type ? 2 : 0) - Math.abs(l.price - avg) / 100 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.l);
  }, [listings, favorites]);

  const activeFilters = [selectedUniversity !== 'Barchasi', selectedType !== 'Barchasi', selectedRooms !== 'Barchasi', sortBy !== 'default', maxPrice < 500].filter(Boolean).length;
  const minPrice = listings.length ? Math.min(...listings.map((l) => l.price)) : 0;

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 sm:pb-20 bg-slate-50 dark:bg-slate-900 transition-colors">
        <section className="relative bg-sky-900 text-white pt-14 pb-16 sm:pt-20 sm:pb-20 px-4 text-center overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <pattern id="tileGrid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M28 0 L56 28 L28 56 L0 28 Z" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#tileGrid)" />
          </svg>
          <div className="max-w-3xl mx-auto relative z-10">
            <p className="text-sky-200 text-xs font-semibold mb-3 tracking-wide">{t('heroKicker')}</p>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">{t('heroTitle')}</h1>
            <p className="text-slate-200 text-sm max-w-xl mx-auto mb-8 leading-relaxed">{t('heroSub')}</p>
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-2xl flex items-center border border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input type="text" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2.5 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600 mr-2"><X className="w-4 h-4" /></button>
              )}
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1 justify-start sm:justify-center max-w-2xl mx-auto">
              {universitiesList.map((u) => (
                <button key={u} onClick={() => setSelectedUniversity(u)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${selectedUniversity === u ? 'bg-white text-sky-900 border-white' : 'bg-white/10 text-white border-white/25 hover:bg-white/20'}`}>
                  {u === 'Barchasi' ? t('all') : u}
                </button>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-4 gap-2 max-w-xl mx-auto">
              {[
                [<CountUp key="a" value={listings.length} />, t('statListings')],
                [<CountUp key="b" value={universitiesList.length - 1} />, t('statUnis')],
                [<CountUp key="c" value={3} />, t('statLangs')],
                [<CountUp key="d" value={minPrice} prefix="$" />, t('statFrom')],
              ].map(([num, label], i) => (
                <div key={i}>
                  <div className="text-2xl sm:text-3xl font-serif font-bold">{num}</div>
                  <div className="text-[11px] text-sky-200">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">

          <div className="lg:hidden bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 shadow-xl mb-6 flex items-center justify-between gap-3">
            <button onClick={() => setFilterOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold">
              <SlidersHorizontal className="w-4 h-4" /> {t('filterBtn')}
              {activeFilters > 0 && <span className="px-1.5 rounded-full bg-white text-sky-700 text-[11px]">{activeFilters}</span>}
            </button>
            <ViewToggle view={view} setView={setView} />
          </div>


          <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 mb-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold text-sm"><SlidersHorizontal className="w-4 h-4 text-sky-600" /> {t('filters')}</div>
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"><RotateCcw className="w-3.5 h-3.5" /> {t('reset')}</button>
            </div>
            <FilterFields />
          </div>
          <div className="hidden lg:flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{filteredListings.length} {t('shown')}</p>
            <ViewToggle view={view} setView={setView} />
          </div>

          <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title={t('filters')}>
            <FilterFields />
            <div className="flex gap-2 mt-6">
              <button onClick={resetFilters} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">{t('reset')}</button>
              <button onClick={() => setFilterOpen(false)} className="flex-[2] py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold">{t('applyBtn')} ({filteredListings.length})</button>
            </div>
          </Modal>

          {view === 'map' ? (
            isLoading ? <SkeletonLoader /> : (
              <>
                <ListingsMap items={filteredListings} />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">{t('mapApprox')}</p>
              </>
            )
          ) : (
            <>
              {recommended.length > 0 && (
                <section className="mb-10">
                  <h2 className="flex items-center gap-2 text-lg font-serif font-bold text-slate-800 dark:text-white mb-4">
                    <Sparkles className="w-4 h-4 text-orange-600" /> {t('recommended')}
                  </h2>
                  <motion.div variants={gridVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommended.map((item) => <ListingCard key={item.id} item={item} />)}
                  </motion.div>
                </section>
              )}

              {isLoading ? (
                <SkeletonLoader />
              ) : isError ? (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl">
                  <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                  <p className="text-sm font-bold">{t('errorGeneric')}</p>
                  <button onClick={() => refetch()} className="mt-2 text-xs text-sky-600 font-bold underline">{t('retry')}</button>
                </div>
              ) : filteredListings.length > 0 ? (
                <>
                  <motion.div variants={gridVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {filteredListings.slice(0, visible).map((item) => <ListingCard key={item.id} item={item} />)}
                    </AnimatePresence>
                  </motion.div>
                  <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{Math.min(visible, filteredListings.length)} / {filteredListings.length} {t('shown')}</p>
                    {visible < filteredListings.length && (
                      <button onClick={() => setVisible((v) => v + 12)} className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-lg transition">{t('loadMore')}</button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4"><Filter className="w-7 h-7 text-slate-400" /></div>
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-3">{t('notFound')}</h3>
                  <button onClick={resetFilters} className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold">{t('reset')}</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </PageTransition>
  );
}


const paymentProviders = [
  { id: 'click', name: 'Click', dot: 'bg-sky-500' },
  { id: 'payme', name: 'Payme', dot: 'bg-cyan-500' },
  { id: 'uzum', name: 'Uzum Bank', dot: 'bg-violet-600' },
];

function PaymentPanel({ order, onDone }) {
  const { t, user } = useStore();
  const [provider, setProvider] = useState('click');
  const { mutate: pay, isPending } = usePayOrder();
  const amount = depositUZS(order.price);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-sky-50 dark:bg-slate-900 border border-sky-100 dark:border-slate-700">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 line-clamp-1">{order.listingTitle}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('payDeposit')}</p>
        <p className="text-2xl font-serif font-bold text-slate-900 dark:text-white mt-1">{formatUZS(amount)} <span className="text-sm font-sans font-medium text-slate-400">{t('sum')}</span></p>
      </div>

      <div>
        <p className={labelCls}>{t('chooseProvider')}</p>
        <div className="grid grid-cols-3 gap-2">
          {paymentProviders.map((p) => (
            <button key={p.id} type="button" onClick={() => setProvider(p.id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-bold transition ${provider === p.id ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <span className={`w-3 h-3 rounded-full ${p.dot}`} />{p.name}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">{t('payDemo')}</p>

      <div className="flex gap-2">
        <button type="button" onClick={onDone} disabled={isPending} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50">{t('payLater')}</button>
        <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={isPending}
          onClick={() => pay({ orderId: order.id, provider, userId: user.id }, { onSuccess: onDone })}
          className="flex-[2] py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-2">
          {isPending ? t('paying') : <><CreditCard className="w-4 h-4" /> {t('payBtn')}</>}
        </motion.button>
      </div>
    </div>
  );
}

function BookingModal({ listing, open, onClose }) {
  const { t, user } = useStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!open) { setOrder(null); reset(); }
  }, [open, reset]);

  const onSubmit = (f) => {
    createOrder({
      listingId: listing.id, listingTitle: listing.title, image: (listing.image || '').startsWith('data:') ? '' : listing.image, price: listing.price,
      userId: user.id, userName: user.name, userPhone: user.phone, moveIn: f.moveIn, note: f.note || ''
    }, { onSuccess: (o) => setOrder(o) });
  };

  return (
    <Modal open={open} onClose={onClose} title={order ? t('payTitle') : t('bookTitle')}>
      {order ? (
        <PaymentPanel order={order} onDone={onClose} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 line-clamp-2">{listing.title}</p>
          <div>
            <label className={labelCls}>{t('moveInLabel')}</label>
            <input type="date" min={todayKey()} {...register('moveIn', { required: t('moveInRequired') })} className={inputCls} />
            {errors.moveIn && <span className={errCls}>{errors.moveIn.message}</span>}
          </div>
          <div>
            <label className={labelCls}>{t('noteLabel')}</label>
            <textarea rows="3" maxLength={300} {...register('note')} className={inputCls} />
          </div>
          <motion.button type="submit" disabled={isPending} whileTap={{ scale: 0.97 }} className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl disabled:opacity-60">
            {isPending ? t('sending') : t('sendRequest')}
          </motion.button>
        </form>
      )}
    </Modal>
  );
}



function Gallery({ images, title, children }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const count = images.length;

  useEffect(() => { setIndex(0); }, [count]);

  const go = (d) => { setDir(d); setIndex((i) => (i + d + count) % count); };

  return (
    <div>
      <div className="relative h-72 sm:h-[26rem] rounded-2xl overflow-hidden bg-slate-900 shadow-lg">
        <AnimatePresence initial={false}>
          <motion.img
            key={index}
            src={images[index]}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover dark:brightness-90 select-none"
            initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            drag={count > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
            onDragEnd={(e, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1); }}
          />
        </AnimatePresence>
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="prev" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/85 hover:bg-white text-slate-700 shadow-md"><ChevronLeft className="w-5 h-5" /></button>
            <button type="button" onClick={() => go(1)} aria-label="next" className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/85 hover:bg-white text-slate-700 shadow-md"><ChevronRight className="w-5 h-5" /></button>
            <span className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-bold">{index + 1} / {count}</span>
          </>
        )}
        {children}
      </div>
      {count > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {images.map((src, i) => (
            <button key={i} type="button" onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }}
              className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition ${i === index ? 'border-sky-600' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-200">
      <Icon className="w-3.5 h-3.5 text-sky-600" /> {children}
    </span>
  );
}

function BookingCard({ item, isOwner, onBook }) {
  const t = useStore((s) => s.t);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
      <div>
        <span className="text-3xl font-serif font-bold text-slate-900 dark:text-white">${item.price}</span>
        <span className="text-xs text-slate-400 font-medium"> / {t('monthly')}</span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t('payDeposit')}: {formatUZS(depositUZS(item.price))} {t('sum')}</p>
      <div className="mt-4 flex flex-col gap-2">
        {!isOwner && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onBook}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-lg transition">
            <CalendarDays className="w-4 h-4" /> {t('book')}
          </motion.button>
        )}
        <a href={`tel:${item.phone}`} className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition">
          <Phone className="w-4 h-4" /> {t('call')}
        </a>
      </div>
    </div>
  );
}

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading, isError } = useFetchSingleListing(id);
  const { mutate: deleteListing } = useRemoveListing();
  const { favorites, toggleFavorite, t, user } = useStore();
  const [bookOpen, setBookOpen] = useState(false);
  useSEO({ title: item && item.title, description: item && item.description, image: item && item.image });

  if (isLoading) return <div className="p-10 max-w-5xl mx-auto"><SkeletonLoader /></div>;
  if (isError || !item) return <div className="p-10 text-center text-rose-500 font-bold">{t('listingNotFound')}</div>;

  const isFav = favorites.includes(item.id);
  const isOwner = !!item.ownerId && item.ownerId === user.id;
  const canDelete = isOwner || user.role === 'admin';
  const images = getImages(item);
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(item.address + ' Tashkent')}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const handleDelete = () => {
    if (window.confirm(t('deleteConfirm'))) deleteListing(item.id, { onSuccess: () => navigate('/') });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 pb-28 sm:pb-12 transition-colors">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 mb-6 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </button>

          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <Gallery images={images} title={item.title}>
                <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
                  <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-sky-600 text-white shadow-lg">{typeLabel(t, item.type)}</span>
                  {item.verified && <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-white/95 text-sky-700 shadow-lg flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {t('verified')}</span>}
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => toggleFavorite(item.id)} className="p-3 rounded-full bg-white/90 dark:bg-slate-900/85 backdrop-blur-md shadow-lg">
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-700 dark:text-slate-200'}`} />
                  </button>
                </div>
              </Gallery>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">{item.title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {item.address}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <InfoChip icon={GraduationCap}>{t('nearUni').replace('{uni}', item.university)}</InfoChip>
                  <InfoChip icon={DoorOpen}>{item.rooms} {t('roomsShort')}</InfoChip>
                  <InfoChip icon={Navigation}>{item.distance}</InfoChip>
                </div>

                <div className="lg:hidden mt-6"><BookingCard item={item} isOwner={isOwner} onBook={() => setBookOpen(true)} /></div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <h3 className="text-base font-serif font-bold text-slate-800 dark:text-slate-200 mb-2">{t('descLabel')}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <h3 className="text-base font-serif font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><Compass className="w-4 h-4 text-sky-600" /> {t('locationOnMap')}</h3>
                  <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                    <iframe title="Google Map" width="100%" height="100%" frameBorder="0" scrolling="no" loading="lazy" src={mapUrl} />
                  </div>
                </div>

                {canDelete && (
                  <div className="pt-6 flex justify-end">
                    <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold rounded-xl transition">
                      <Trash2 className="w-4 h-4" /> {t('deleteBtn')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <aside className="hidden lg:block lg:sticky lg:top-24">
              <BookingCard item={item} isOwner={isOwner} onBook={() => setBookOpen(true)} />
            </aside>
          </div>
        </div>
      </div>
      <BookingModal listing={item} open={bookOpen} onClose={() => setBookOpen(false)} />
    </PageTransition>
  );
}


function AddListing() {
  const { user, t } = useStore();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { rooms: '1', university: 'TATU', type: 'Xonadosh', phone: formatPhone(user.phone) }
  });
  const { mutate: createListing, isPending } = useCreateListing();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  useSEO({ title: t('addTitle') });

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - images.length);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => fileToDataUrl(f)));
      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      toast.error(t('errorGeneric'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (formData) => {
    const fallback = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
    createListing({
      ...formData,
      price: Number(formData.price),
      rooms: Number(formData.rooms),
      verified: false,           // admin tasdiqlaydi
      ownerId: user.id,
      ownerName: user.name,
      distance: '400 m',
      image: images[0] || fallback,
      images: images.length ? images : [fallback]
    }, { onSuccess: () => { reset(); setImages([]); navigate('/'); } });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 pb-28 sm:pb-10 transition-colors">
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-bold text-sky-600 mb-6"><ArrowLeft className="w-4 h-4" /> {t('back')}</button>
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white mb-6">{t('addTitle')}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={labelCls}>{t('photos')}</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {images.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-sky-600 text-white text-[11px] font-bold">{t('cover')}</span>}
                    <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button type="button" onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-sky-500 hover:text-sky-600 transition disabled:opacity-50">
                    <Camera className="w-5 h-5" />
                    <span className="text-[11px] font-semibold text-center leading-tight px-1">{uploading ? '...' : t('addPhotos')}</span>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
              <p className="text-[11px] text-slate-400 mt-1.5">{t('photosHint')}</p>
            </div>

            <div>
              <label className={labelCls}>{t('titleLabel')}</label>
              <input type="text" {...register('title', { required: t('titleRequired') })} className={inputCls} />
              {errors.title && <span className={errCls}>{errors.title.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('priceLabel')}</label>
                <input type="number" min="1" {...register('price', { required: true })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('rooms')}</label>
                <select {...register('rooms')} className={inputCls}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('university')}</label>
                <select {...register('university')} className={inputCls}>
                  {universitiesList.filter((u) => u !== 'Barchasi').map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('type')}</label>
                <select {...register('type')} className={inputCls}>
                  <option value="Xonadosh">{t('roommate')}</option>
                  <option value="Xonadon">{t('apartment')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('phoneLabel')}</label>
              <input type="text" placeholder="+998 90 123 45 67" {...register('phone', { required: true })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('addressLabel')}</label>
              <input type="text" {...register('address', { required: true })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('descLabel')}</label>
              <textarea rows="3" {...register('description')} className={inputCls} />
            </div>
            <motion.button type="submit" disabled={isPending || uploading} whileTap={{ scale: 0.97 }} className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-60">
              {isPending ? t('saving') : t('submitBtn')}
            </motion.button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}



function Favorites() {
  const { data: listings = [] } = useFetchListings();
  const { favorites, t } = useStore();
  useSEO({ title: t('favorites') });
  const favListings = listings.filter((item) => favorites.includes(item.id));

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 pb-28 sm:pb-10 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-serif font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> {t('favorites')}
          </h1>
          {favListings.length > 0 ? (
            <motion.div variants={gridVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favListings.map((item) => <ListingCard key={item.id} item={item} />)}
            </motion.div>
          ) : (
            <EmptyState icon={Heart} text={t('noFavs')} action={{ to: '/', label: t('browse') }} />
          )}
        </div>
      </div>
    </PageTransition>
  );
}



const providerName = (id) => (paymentProviders.find((p) => p.id === id) || { name: id }).name;

function EmptyState({ icon: Icon, text, action }) {
  return (
    <div className="text-center py-14 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4"><Icon className="w-7 h-7 text-slate-400" /></div>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{text}</p>
      {action && <Link to={action.to} className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition">{action.label}</Link>}
    </div>
  );
}

function Cabinet() {
  const navigate = useNavigate();
  const { t, user, logout, updateUser } = useStore();
  useSEO({ title: t('cabinet') });
  const [tab, setTab] = useState('profile');
  const [payOrder, setPayOrder] = useState(null);
  const { data: orders = [] } = useFetchOrders(user.id);
  const { data: payments = [] } = useFetchPayments(user.id);
  const { data: listings = [] } = useFetchListings();
  const { mutate: removeListing } = useRemoveListing();
  const { mutate: saveUser, isPending: saving } = useUpdateUser();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { name: user.name, password: '' } });

  const myListings = listings.filter((l) => l.ownerId === user.id);
  const handleLogout = () => { if (window.confirm(t('logoutConfirm'))) logout(); };

  const onSaveProfile = (f) => {
    saveUser({ id: user.id, patch: { name: f.name.trim() }, password: f.password || undefined }, {
      onSuccess: () => { updateUser({ name: f.name.trim() }); reset({ name: f.name.trim(), password: '' }); toast.success(t('saved')); }
    });
  };

  const tabs = [
    ['profile', t('profile'), User],
    ['orders', t('myOrders'), ClipboardList],
    ['listings', t('myListings'), HomeIcon],
    ['history', t('history'), Wallet],
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 pb-28 sm:pb-12 transition-colors">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-serif text-2xl font-bold">{(user.name || '?').charAt(0).toUpperCase()}</div>
            <div className="min-w-0">
              <h1 className="text-xl font-serif font-bold text-slate-800 dark:text-white truncate">{user.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatPhone(user.phone)}</p>
            </div>
          </div>

          <div className="flex gap-1 p-1 mb-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-x-auto">
            {tabs.map(([key, label, Icon]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${tab === key ? 'bg-sky-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {tab === 'profile' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
                <div>
                  <label className={labelCls}>{t('nameLabel')}</label>
                  <input type="text" {...register('name', { required: t('nameRequired'), validate: (v) => v.trim().length > 0 || t('nameRequired') })} className={inputCls} />
                  {errors.name && <span className={errCls}>{errors.name.message}</span>}
                </div>
                <div>
                  <label className={labelCls}>{t('phoneLabel')}</label>
                  <input type="text" value={formatPhone(user.phone)} disabled className={`${inputCls} opacity-60`} readOnly />
                </div>
                <div>
                  <label className={labelCls}>{t('newPassword')}</label>
                  <input type="password" autoComplete="new-password" {...register('password', { minLength: { value: 4, message: t('passwordMin') } })} className={inputCls} />
                  {errors.password && <span className={errCls}>{errors.password.message}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{t('role')}: <b className="text-slate-700 dark:text-slate-200">{user.role === 'admin' ? t('roleAdmin') : t('roleUser')}</b></span>
                </div>
                <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }} className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl disabled:opacity-60">
                  {saving ? t('saving') : t('saveBtn')}
                </motion.button>
              </form>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {user.role === 'admin' && (
                  <button onClick={() => navigate('/admin')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 text-white text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" /> {t('adminPanel')}
                  </button>
                )}
                <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  <LogOut className="w-4 h-4" /> {t('logoutBtn')}
                </button>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            orders.length === 0 ? <EmptyState icon={ClipboardList} text={t('noOrders')} action={{ to: '/', label: t('browse') }} /> : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex gap-4">
                    <img src={(listings.find((l) => l.id === o.listingId) || {}).image || o.image} alt="" loading="lazy" className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-700" />
                    <div className="flex-1 min-w-0">
                      <Link to={`/listing/${o.listingId}`} className="text-sm font-serif font-bold text-slate-800 dark:text-slate-100 hover:text-sky-600 line-clamp-1">{o.listingTitle}</Link>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t('moveInLabel')}: {o.moveIn} · ${o.price}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <StatusBadge status={o.status} />
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${o.paid ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>{o.paid ? t('paidBadge') : t('unpaidBadge')}</span>
                        {!o.paid && o.status !== 'cancelled' && (
                          <button onClick={() => setPayOrder(o)} className="ml-auto px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center gap-1"><CreditCard className="w-3 h-3" /> {t('payNow')}</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'listings' && (
            myListings.length === 0 ? <EmptyState icon={HomeIcon} text={t('noListings')} action={{ to: '/add', label: t('addListing') }} /> : (
              <div className="space-y-3">
                {myListings.map((l) => (
                  <div key={l.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                    <img src={l.image} alt="" loading="lazy" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link to={`/listing/${l.id}`} className="text-sm font-serif font-bold text-slate-800 dark:text-slate-100 hover:text-sky-600 line-clamp-1">{l.title}</Link>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${l.price} · {l.university}{l.verified ? ` · ${t('verified')}` : ''}</p>
                    </div>
                    <button onClick={() => { if (window.confirm(t('deleteConfirm'))) removeListing(l.id); }} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'history' && (
            payments.length === 0 ? <EmptyState icon={Wallet} text={t('noPayments')} /> : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{p.listingTitle}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{providerName(p.provider)} · {formatDate(p.createdAt)}</p>
                    </div>
                    <span className="text-sm font-serif font-bold text-slate-900 dark:text-white whitespace-nowrap">{formatUZS(p.amountUZS)} {t('sum')}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <Modal open={!!payOrder} onClose={() => setPayOrder(null)} title={t('payTitle')}>
        {payOrder && <PaymentPanel order={payOrder} onDone={() => setPayOrder(null)} />}
      </Modal>
    </PageTransition>
  );
}



function StatCard({ icon: Icon, label, value, tone = 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tone}`}><Icon className="w-4 h-4" /></div>
      <p className="text-2xl font-serif font-bold text-slate-900 dark:text-white leading-none">{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">{label}</p>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{d.value}</span>
          <motion.div className="w-full rounded-t-md bg-sky-600" initial={{ height: 0 }} animate={{ height: Math.max(3, Math.round((d.value / max) * 100)) }} transition={{ duration: 0.5 }} />
          <span className="text-[10px] text-slate-400 truncate">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function HBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-[11px]">
          <span className="w-12 font-bold text-slate-600 dark:text-slate-300 shrink-0">{d.label}</span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <motion.div className="h-full bg-orange-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${(d.value / max) * 100}%` }} transition={{ duration: 0.5 }} />
          </div>
          <span className="w-5 text-right font-bold text-slate-600 dark:text-slate-300">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

const thCls = 'text-left text-[11px] font-bold uppercase tracking-wide text-slate-400 px-3 py-2 whitespace-nowrap';
const tdCls = 'px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 align-middle';
const smallBtn = 'px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition';

function AdminInner() {
  const { t, user } = useStore();
  const [tab, setTab] = useState('stats');
  const { data: stats } = useFetchStats();
  const { data: listings = [] } = useFetchListings();
  const { data: users = [] } = useFetchUsers();
  const { data: orders = [] } = useFetchOrders();
  const { mutate: updateListing } = useUpdateListing();
  const { mutate: removeListing } = useRemoveListing();
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();
  const { mutate: updateOrder } = useUpdateOrder();

  const tabs = [['stats', t('tabStats'), BarChart3], ['listings', t('tabListings'), HomeIcon], ['users', t('tabUsers'), Users], ['orders', t('tabOrders'), ClipboardList]];
  const tableWrap = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto';

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 pb-28 sm:pb-12 transition-colors">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-serif font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><LayoutDashboard className="w-6 h-6 text-sky-600" /> {t('adminPanel')}</h1>

          <div className="flex gap-1 p-1 mb-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-x-auto">
            {tabs.map(([key, label, Icon]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${tab === key ? 'bg-sky-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {tab === 'stats' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={Eye} label={t('visitsToday')} value={stats.visitsToday} />
                <StatCard icon={Users} label={t('totalUsers')} value={stats.users} tone="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" />
                <StatCard icon={HomeIcon} label={t('totalListings')} value={stats.listings} tone="text-violet-600 bg-violet-50 dark:bg-violet-950/40" />
                <StatCard icon={ClipboardList} label={`${t('totalOrders')} (${stats.pendingOrders} ${t('pendingOrders').toLowerCase()})`} value={stats.orders} tone="text-amber-600 bg-amber-50 dark:bg-amber-950/40" />
                <div className="col-span-2 lg:col-span-1"><StatCard icon={Wallet} label={t('revenue')} value={`${formatUZS(stats.revenue)}`} tone="text-orange-600 bg-orange-50 dark:bg-orange-950/40" /></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">{t('visits7')}</h3>
                  <BarChart data={stats.visits} />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">{t('byUniversity')}</h3>
                  <HBars data={stats.byUniversity} />
                </div>
              </div>
            </div>
          )}

          {tab === 'listings' && (
            <div className={tableWrap}>
              <table className="w-full min-w-[640px]">
                <thead><tr className="border-b border-slate-100 dark:border-slate-700"><th className={thCls}>{t('colTitle')}</th><th className={thCls}>{t('colOwner')}</th><th className={thCls}>{t('colPrice')}</th><th className={thCls}>{t('colStatus')}</th><th className={thCls}>{t('colActions')}</th></tr></thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                      <td className={`${tdCls} max-w-[240px]`}><Link to={`/listing/${l.id}`} className="font-semibold hover:text-sky-600 line-clamp-1">{l.title}</Link></td>
                      <td className={tdCls}>{l.ownerName || '—'}</td>
                      <td className={tdCls}>${l.price}</td>
                      <td className={tdCls}>{l.verified ? <span className="text-sky-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {t('verified')}</span> : <span className="text-slate-400">—</span>}</td>
                      <td className={tdCls}>
                        <div className="flex gap-1.5">
                          <button onClick={() => updateListing({ id: l.id, patch: { verified: !l.verified } })} className={`${smallBtn} bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300`}>{l.verified ? t('unverifyBtn') : t('verifyBtn')}</button>
                          <button onClick={() => { if (window.confirm(t('deleteConfirm'))) removeListing(l.id); }} className={`${smallBtn} bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400`}>{t('deleteShort')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'users' && (
            <div className={tableWrap}>
              <table className="w-full min-w-[640px]">
                <thead><tr className="border-b border-slate-100 dark:border-slate-700"><th className={thCls}>{t('colName')}</th><th className={thCls}>{t('colPhone')}</th><th className={thCls}>{t('colRole')}</th><th className={thCls}>{t('colDate')}</th><th className={thCls}>{t('colActions')}</th></tr></thead>
                <tbody>
                  {users.map((u) => {
                    const me = u.id === user.id;
                    return (
                      <tr key={u.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                        <td className={`${tdCls} font-semibold`}>{u.name}{u.blocked && <span className="ml-2 text-[11px] text-rose-500 font-bold">BLOCK</span>}</td>
                        <td className={tdCls}>{formatPhone(u.phone)}</td>
                        <td className={tdCls}>{u.role === 'admin' ? t('roleAdmin') : t('roleUser')}</td>
                        <td className={tdCls}>{formatDate(u.createdAt)}</td>
                        <td className={tdCls}>
                          {me ? <span className="text-slate-300">—</span> : (
                            <div className="flex gap-1.5">
                              <button onClick={() => updateUser({ id: u.id, patch: { role: u.role === 'admin' ? 'user' : 'admin' } })} className={`${smallBtn} bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300`}>{u.role === 'admin' ? t('makeUser') : t('makeAdmin')}</button>
                              <button onClick={() => updateUser({ id: u.id, patch: { blocked: !u.blocked } })} className={`${smallBtn} bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300`}>{u.blocked ? t('unblockBtn') : t('blockBtn')}</button>
                              <button onClick={() => { if (window.confirm(t('deleteUserConfirm'))) deleteUser(u.id); }} className={`${smallBtn} bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400`}>{t('deleteShort')}</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'orders' && (
            orders.length === 0 ? <EmptyState icon={ClipboardList} text={t('noData')} /> : (
              <div className={tableWrap}>
                <table className="w-full min-w-[720px]">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-700"><th className={thCls}>{t('colListing')}</th><th className={thCls}>{t('colUser')}</th><th className={thCls}>{t('moveInLabel')}</th><th className={thCls}>{t('colPaid')}</th><th className={thCls}>{t('colStatus')}</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                        <td className={`${tdCls} max-w-[220px]`}><span className="font-semibold line-clamp-1">{o.listingTitle}</span><span className="text-[11px] text-slate-400">${o.price} · {formatDate(o.createdAt)}</span></td>
                        <td className={tdCls}>{o.userName}<br /><span className="text-[11px] text-slate-400">{formatPhone(o.userPhone)}</span></td>
                        <td className={tdCls}>{o.moveIn}</td>
                        <td className={tdCls}>{o.paid ? <span className="text-emerald-600 font-bold">{t('paidBadge')}</span> : <span className="text-slate-400">{t('unpaidBadge')}</span>}</td>
                        <td className={tdCls}>
                          <select value={o.status} onChange={(e) => updateOrder({ id: o.id, status: e.target.value })} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px] font-semibold">
                            <option value="pending">{t('statusPending')}</option>
                            <option value="confirmed">{t('statusConfirmed')}</option>
                            <option value="cancelled">{t('statusCancelled')}</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function AdminPanel() {
  const { t, user } = useStore();
  useSEO({ title: t('adminPanel') });
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t('accessDenied')}</p>
        </div>
      </div>
    );
  }
  return <AdminInner />;
}


const uniAliases = {
  tatu: 'TATU', ozmu: "O'zMU", nuu: "O'zMU", tdtu: 'TDTU', politeh: 'TDTU', politex: 'TDTU',
  tdiu: 'TDIU', wiut: 'WIUT', inha: 'INHA', tpti: 'TPTI', toshmi: 'TPTI'
};

function parseQuery(text) {
  const s = text.toLowerCase().replace(/[’‘`ʻʼ']/g, '');
  const c = {};
  const budget = s.match(/\b(\d{2,4})\b/);
  if (budget) c.budget = Number(budget[1]);
  const rooms = s.match(/\b([1-3])\s*(?:xona|room|комн|bedroom)/);
  if (rooms) c.rooms = Number(rooms[1]);
  const uniKey = Object.keys(uniAliases).find((k) => s.includes(k));
  if (uniKey) c.university = uniAliases[uniKey];
  if (/(xonadosh|roommate|sosed|сосед|sherik)/.test(s)) c.type = 'Xonadosh';
  else if (/(kvartira|xonadon|apartment|квартир|studiya|studio|студи)/.test(s)) c.type = 'Xonadon';
  return c;
}

function searchListings(listings, c) {
  return listings
    .filter((l) => (c.budget === undefined || l.price <= c.budget)
      && (c.rooms === undefined || l.rooms === c.rooms)
      && (!c.university || l.university === c.university)
      && (!c.type || l.type === c.type))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || a.price - b.price)
    .slice(0, 3);
}

function AIAssistant() {
  const { t } = useStore();
  const location = useLocation();
  const { data: listings = [] } = useFetchListings();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([{ role: 'ai', key: 'aiGreeting' }]);
  const endRef = useRef(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  if (location.pathname === '/chat') return null;

  const send = (e) => {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    const criteria = parseQuery(q);
    let reply;
    if (Object.keys(criteria).length === 0) reply = { role: 'ai', key: 'aiHint' };
    else {
      const items = searchListings(listings, criteria);
      reply = items.length ? { role: 'ai', key: 'aiFound', items } : { role: 'ai', key: 'aiNone' };
    }
    setMessages((m) => [...m, { role: 'user', text: q.slice(0, 200) }, reply]);
    setText('');
  };

  return (
    <>
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setOpen((o) => !o)} aria-label={t('aiTitle')}
        className="fixed right-4 bottom-28 sm:bottom-6 z-50 w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl flex items-center justify-center">
        {open ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed right-4 bottom-44 sm:bottom-24 z-50 w-[calc(100vw-2rem)] max-w-sm h-[26rem] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-sky-900 text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-300" /><span className="text-sm font-serif font-bold">{t('aiTitle')}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-sky-600 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-bl-sm'}`}>
                    {m.role === 'user' ? m.text : t(m.key)}
                    {m.items && (
                      <div className="mt-2 space-y-1.5">
                        {m.items.map((l) => (
                          <Link key={l.id} to={`/listing/${l.id}`} onClick={() => setOpen(false)} className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 transition">
                            <img src={l.image} alt="" loading="lazy" className="w-10 h-10 rounded-md object-cover shrink-0" />
                            <span className="min-w-0 flex-1"><span className="block font-bold truncate text-slate-800 dark:text-slate-100">{l.title}</span><span className="text-[11px] text-slate-500">{l.university} · ${l.price}</span></span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form onSubmit={send} className="p-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('aiPlaceholder')} maxLength={200}
                className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <button type="submit" disabled={!text.trim()} className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white"><Send className="w-4 h-4" /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}



function getAvatarColor(name) {
  const palette = ['bg-sky-600', 'bg-orange-600', 'bg-emerald-600', 'bg-rose-500'];
  const sum = (name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[sum % palette.length];
}
function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

function Chat() {
  const { data: messages = [] } = useFetchMessages();
  const { mutate: sendMessage, isPending } = useSendMessage();
  const { t, user } = useStore();
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  useSEO({ title: t('chat') });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    sendMessage({ author: user.name, phone: user.phone, text: trimmed.slice(0, 500) });
    setText('');
  };

  const activeCount = (() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    const set = new Set(messages.filter((m) => new Date(m.createdAt).getTime() > cutoff).map((m) => m.phone || m.author));
    set.add(user.phone);
    return set.size;
  })();

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 pb-28 sm:pb-0 transition-colors">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex items-center gap-3 sticky top-16 z-20">
          <div className="w-10 h-10 bg-sky-600 rounded-lg text-white flex items-center justify-center shrink-0"><MessageCircle className="w-5 h-5" /></div>
          <div>
            <h1 className="text-sm font-serif font-bold text-slate-800 dark:text-white">{t('chat')}</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
              {activeCount} {t('chatOnline')}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 max-w-3xl mx-auto w-full space-y-3">
          {messages.length === 0 && <p className="text-center text-xs text-slate-400 mt-10">{t('chatEmpty')}</p>}
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.phone ? msg.phone === user.phone : msg.author === user.name;
              return (
                <motion.div key={msg.id} layout initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25 }}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full ${getAvatarColor(msg.author)} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>{(msg.author || '?').trim().charAt(0).toUpperCase()}</div>
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwn && <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 px-1">{msg.author}</span>}
                    <div className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words ${isOwn ? 'bg-sky-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm'}`}>{msg.text}</div>
                    <span className="text-[10px] text-slate-400 mt-0.5 px-1">{formatTime(msg.createdAt)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="sticky bottom-24 sm:bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center gap-2 max-w-3xl mx-auto w-full">
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chatPlaceholder')} maxLength={500}
            className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <motion.button type="submit" disabled={!text.trim() || isPending} whileTap={{ scale: 0.9 }} className="p-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0">
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </PageTransition>
  );
}



function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const darkMode = useStore((s) => s.darkMode);
  const isAuthenticated = useStore((s) => s.isAuthenticated && !!s.user);
  const t = useStore((s) => s.t);
  const [showIntro, setShowIntro] = useState(false);

  useLayoutEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
  useEffect(() => { recordVisit(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyle />
      <Router>
        {!isAuthenticated ? (
          <AuthPage onSuccess={() => setShowIntro(true)} />
        ) : (
          <>
            <ScrollToTop />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors">
              {showIntro && <Intro onDone={() => setShowIntro(false)} />}
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/add" element={<AddListing />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/cabinet" element={<Cabinet />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="*" element={<div className="p-10 text-center font-bold">{t('pageNotFound')}</div>} />
              </Routes>
              <MobileBottomNav />
              <AIAssistant />
            </div>
          </>
        )}
      </Router>
      <Toaster position="bottom-right" toastOptions={{
        duration: 3000,
        style: { borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: darkMode ? '#1e293b' : '#ffffff', color: darkMode ? '#f1f5f9' : '#0f172a', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }
      }} />
    </QueryClientProvider>
  );
}