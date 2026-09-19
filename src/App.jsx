import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useParams, useNavigate } from 'react-router-dom';
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
  Eye, EyeOff, MessageCircle, Send
} from 'lucide-react';


const api = axios.create({ baseURL: '/api' });
const mock = new MockAdapter(api, { delayResponse: 300 });
const LOCAL_STORAGE_KEY = 'talabauy_listings_db_v4';


const initialListings = [
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


function readStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {

  }
}

function getListingsFromStorage() { return readStorage(LOCAL_STORAGE_KEY, initialListings); }
function saveListingsToStorage(listings) { writeStorage(LOCAL_STORAGE_KEY, listings); }


mock.onGet('/listings').reply(() => [200, getListingsFromStorage()]);

mock.onGet(/\/listings\/\w+/).reply((config) => {
  const id = config.url.split('/').pop();
  const listing = getListingsFromStorage().find((item) => item.id === id);
  return listing ? [200, listing] : [404, { message: 'Topilmadi' }];
});

mock.onPost('/listings').reply((config) => {
  const data = JSON.parse(config.data);
  const newListing = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
  saveListingsToStorage([newListing, ...getListingsFromStorage()]);
  return [201, newListing];
});

mock.onDelete(/\/listings\/\w+/).reply((config) => {
  const id = config.url.split('/').pop();
  saveListingsToStorage(getListingsFromStorage().filter((item) => item.id !== id));
  return [200, { success: true }];
});


const CHAT_STORAGE_KEY = 'talabauy_chat_messages_v2';
const MAX_MESSAGES = 200;

function getMessagesFromStorage() { return readStorage(CHAT_STORAGE_KEY, []); }
function saveMessagesToStorage(messages) { writeStorage(CHAT_STORAGE_KEY, messages.slice(-MAX_MESSAGES)); }

mock.onGet('/messages').reply(() => [200, getMessagesFromStorage()]);

mock.onPost('/messages').reply((config) => {
  const data = JSON.parse(config.data);
  const newMessage = {
    ...data,
    id: 'm' + Date.now().toString() + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString()
  };
  saveMessagesToStorage([...getMessagesFromStorage(), newMessage]);
  return [201, newMessage];
});

const queryClient = new QueryClient();


function useFetchListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => (await api.get('/listings')).data
  });
}

function useFetchSingleListing(id) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => (await api.get(`/listings/${id}`)).data
  });
}

function useCreateListing() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (newListing) => (await api.post('/listings', newListing)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['listings'] });
      toast.success("E'lon muvaffaqiyatli saqlandi!");
    },
    onError: () => toast.error("Xatolik yuz berdi!")
  });
}

function useRemoveListing() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/listings/${id}`)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['listings'] });
      toast.success("E'lon o'chirildi!");
    }
  });
}


function useFetchMessages() {
  const client = useQueryClient();

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CHAT_STORAGE_KEY) client.invalidateQueries({ queryKey: ['messages'] });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [client]);

  return useQuery({
    queryKey: ['messages'],
    queryFn: async () => (await api.get('/messages')).data,
    refetchInterval: 2000,
  });
}

function useSendMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (message) => (await api.post('/messages', message)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['messages'] }),
    onError: () => toast.error("Xabar yuborilmadi!")
  });
}

// Tarjima so'zlari
const translations = {
  uz: {
    home: 'Bosh sahifa', favorites: 'Saralanganlar', addListing: "E'lon berish",
    heroTitle: 'Talabalar uchun Shinam va Qulay Uylar',
    heroSub: "O'zingizga mos keladigan hamyonbop xonadon va ishonchli xonadoshlarni osongina toping.",
    searchPlaceholder: 'Metro, tumani yoki oliygoh nomini kiriting...',
    filters: 'Moslashtirish filtri', reset: 'Tozalash', university: 'Oliygoh', type: "E'lon turi",
    rooms: 'Xonalar soni', sort: 'Saralash', maxPrice: 'Maks. narx', all: 'Barchasi',
    roommate: 'Xonadosh kerak', apartment: "To'liq xonadon", newest: "Yangi e'lonlar",
    priceLow: 'Narx: arzonidan', priceHigh: 'Narx: qimmatidan', notFound: "Mos e'lonlar topilmadi",
    details: 'Batafsil', call: "Qo'ng'iroq qilish", monthly: 'oyiga', addTitle: "Yangi e'lon qo'shish",
    titleLabel: "E'lon sarlavhasi", priceLabel: "Narxi ($)", phoneLabel: "Telefon raqam",
    addressLabel: "Manzil", descLabel: "Tavsif", submitBtn: "E'lonni joylash",
    deleteBtn: "E'lonni o'chirish", locationOnMap: "Joylashuv xaritasi",
    loginTitle: "Xush kelibsiz!", loginSub: "Davom etish uchun telefon raqami va parolingizni kiriting",
    passwordLabel: "Parol", loginBtn: "Kirish", loggingIn: "Tekshirilmoqda...",
    phoneRequired: "Telefon raqami kiritilishi shart!", passwordRequired: "Parol kiritilishi shart!",
    passwordMin: "Parol kamida 4 ta belgidan iborat bo'lishi kerak", logoutBtn: "Chiqish",
    chat: "Talabalar chati", chatSub: "Boshqa talabalar bilan bemalol suhbatlashing",
    chatPlaceholder: "Xabar yozing...", chatNamePrompt: "Chatda qanday ism bilan ko'rinishni xohlaysiz?",
    chatNamePlaceholder: "Ismingiz", chatNameSave: "Saqlash va kirish",
    chatEmpty: "Hali xabarlar yo'q. Birinchi bo'lib yozing!", chatOnline: "faol"
  },
  en: {
    home: 'Home', favorites: 'Favorites', addListing: 'Add Listing',
    heroTitle: 'Cozy & Affordable Student Housing',
    heroSub: 'Easily find suitable budget apartments and reliable roommates near your university.',
    searchPlaceholder: 'Search by metro, district or university...',
    filters: 'Custom Filters', reset: 'Reset', university: 'University', type: 'Listing Type',
    rooms: 'Rooms Count', sort: 'Sort By', maxPrice: 'Max Price', all: 'All',
    roommate: 'Roommate needed', apartment: 'Full Apartment', newest: 'Newest first',
    priceLow: 'Price: Low to High', priceHigh: 'Price: High to Low', notFound: 'No listings found',
    details: 'Details', call: 'Call Now', monthly: 'per month', addTitle: 'Add New Listing',
    titleLabel: 'Listing Title', priceLabel: 'Price ($)', phoneLabel: 'Phone Number',
    addressLabel: 'Address', descLabel: 'Description', submitBtn: 'Submit Listing',
    deleteBtn: 'Delete Listing', locationOnMap: "Location Map",
    loginTitle: "Welcome!", loginSub: "Enter your phone number and password to continue",
    passwordLabel: "Password", loginBtn: "Sign In", loggingIn: "Checking...",
    phoneRequired: "Phone number is required!", passwordRequired: "Password is required!",
    passwordMin: "Password must be at least 4 characters", logoutBtn: "Log out",
    chat: "Student Chat", chatSub: "Chat freely with other students",
    chatPlaceholder: "Write a message...", chatNamePrompt: "What name should appear in the chat?",
    chatNamePlaceholder: "Your name", chatNameSave: "Save and join",
    chatEmpty: "No messages yet. Be the first to write!", chatOnline: "active"
  },
  ru: {
    home: 'Главная', favorites: 'Избранное', addListing: 'Добавить объявление',
    heroTitle: 'Уютное жильё для студентов',
    heroSub: 'Легко найдите бюджетную квартиру и надёжных соседей рядом с университетом.',
    searchPlaceholder: 'Поиск по метро, району или университету...',
    filters: 'Настроить фильтр', reset: 'Сбросить', university: 'Университет', type: 'Тип объявления',
    rooms: 'Количество комнат', sort: 'Сортировка', maxPrice: 'Макс. цена', all: 'Все',
    roommate: 'Нужен сосед', apartment: 'Вся квартира', newest: 'Сначала новые',
    priceLow: 'Цена: по возрастанию', priceHigh: 'Цена: по убыванию', notFound: 'Объявления не найдены',
    details: 'Подробнее', call: 'Позвонить', monthly: 'в месяц', addTitle: 'Добавить объявление',
    titleLabel: 'Заголовок', priceLabel: 'Цена ($)', phoneLabel: 'Номер телефона',
    addressLabel: 'Адрес', descLabel: 'Описание', submitBtn: 'Опубликовать',
    deleteBtn: 'Удалить объявление', locationOnMap: "Карта расположения",
    loginTitle: "Добро пожаловать!", loginSub: "Введите номер телефона и пароль, чтобы продолжить",
    passwordLabel: "Пароль", loginBtn: "Войти", loggingIn: "Проверка...",
    phoneRequired: "Введите номер телефона!", passwordRequired: "Введите пароль!",
    passwordMin: "Пароль должен содержать минимум 4 символа", logoutBtn: "Выйти",
    chat: "Чат студентов", chatSub: "Свободно общайтесь с другими студентами",
    chatPlaceholder: "Напишите сообщение...", chatNamePrompt: "Какое имя показывать в чате?",
    chatNamePlaceholder: "Ваше имя", chatNameSave: "Сохранить и войти",
    chatEmpty: "Сообщений пока нет. Напишите первым!", chatOnline: "активны"
  }
};


const useStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userPhone: null,
      login: (phone) => set({ isAuthenticated: true, userPhone: phone }),
      logout: () => set({ isAuthenticated: false, userPhone: null }),

      chatName: null,
      setChatName: (name) => set({ chatName: name }),

      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      lang: 'uz',
      setLang: (lang) => set({ lang }),
      t: (key) => translations[get().lang]?.[key] || key,

      favorites: [],
      toggleFavorite: (id) => {
        const exists = get().favorites.includes(id);
        if (exists) {
          set({ favorites: get().favorites.filter((fId) => fId !== id) });
          toast.error("Saralanganlardan olib tashlandi");
        } else {
          set({ favorites: [...get().favorites, id] });
          toast.success("Saralanganlarga qo'shildi!");
        }
      },

      searchQuery: '',
      selectedUniversity: 'Barchasi',
      selectedType: 'Barchasi',
      selectedRooms: 'Barchasi',
      sortBy: 'default',
      maxPrice: 500,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedUniversity: (uni) => set({ selectedUniversity: uni }),
      setSelectedType: (type) => set({ selectedType: type }),
      setSelectedRooms: (rooms) => set({ selectedRooms: rooms }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setMaxPrice: (price) => set({ maxPrice: price }),

      resetFilters: () => set({
        searchQuery: '',
        selectedUniversity: 'Barchasi',
        selectedType: 'Barchasi',
        selectedRooms: 'Barchasi',
        sortBy: 'default',
        maxPrice: 500
      })
    }),
    {
      name: 'talabauy_student_app_state_v4',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userPhone: state.userPhone,
        chatName: state.chatName,
        darkMode: state.darkMode,
        lang: state.lang,
        favorites: state.favorites,
        searchQuery: state.searchQuery,
        selectedUniversity: state.selectedUniversity,
        selectedType: state.selectedType,
        selectedRooms: state.selectedRooms,
        sortBy: state.sortBy,
        maxPrice: state.maxPrice
      })
    }
  )
);

const universitiesList = ['Barchasi', 'TATU', "O'zMU", 'TDTU', 'TDIU', 'WIUT', 'INHA', 'TPTI'];


function Intro({ onDone }) {
  const [open, setOpen] = useState(false);
  const harflar = 'TalabaUy'.split('');

  useEffect(() => {
    const t1 = setTimeout(() => setOpen(true), 1900);
    const t2 = setTimeout(onDone, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };

  }, []);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full bg-sky-900"
        animate={{ x: open ? '-100%' : '0%' }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full bg-sky-900"
        animate={{ x: open ? '100%' : '0%' }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative w-24 h-24 flex items-center justify-center mb-6">
          <motion.div
            className="absolute inset-0 border-2 border-white/40"
            initial={{ scale: 0, rotate: 45 }}
            animate={{ scale: 1, rotate: 225 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <motion.div
            className="w-14 h-14 bg-white text-sky-900 rounded-lg flex items-center justify-center font-serif text-3xl font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            T
          </motion.div>
        </div>

        <div className="flex text-white font-serif text-3xl font-bold">
          {harflar.map((h, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.07 }}
            >
              {h}
            </motion.span>
          ))}
        </div>

        <div className="w-40 h-1 bg-white/20 rounded-full mt-6 overflow-hidden">
          <motion.div
            className="h-full bg-white"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}


function Login({ onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, t, darkMode, toggleDarkMode } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const onSubmit = (formData) => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      onSuccess();               // intro animatsiyasini yoqadi
      login(formData.phone);
      toast.success("Xush kelibsiz!");
    }, 600);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-sky-900 px-4 py-10 overflow-hidden">
      <motion.svg
        className="absolute inset-0 w-[120%] h-[120%] -left-[10%] -top-[10%] opacity-[0.06]"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        animate={{ x: [0, 28, 0], y: [0, 28, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        <pattern id="tileGridLogin" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M28 0 L56 28 L28 56 L0 28 Z" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#tileGridLogin)" />
      </motion.svg>

      <motion.div
        aria-hidden="true"
        className="absolute w-72 h-72 rounded-full bg-terracotta-500/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2.5 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition z-10"
      >
        {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/5"
      >
        <div className="h-1 bg-gradient-to-r from-sky-500 via-sky-600 to-terracotta-500" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <motion.div
              initial={{ rotate: -20, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="w-11 h-11 bg-sky-600 rounded-lg text-white flex items-center justify-center font-serif text-xl font-bold mb-4"
            >
              T
            </motion.div>
            <h1 className="text-xl font-serif font-bold text-slate-800 dark:text-white">{t('loginTitle')}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('loginSub')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('phoneLabel')}</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  autoComplete="tel"
                  {...register('phone', { required: t('phoneRequired') })}
                  className="w-full pl-9 pr-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                />
              </div>
              {errors.phone && (
                <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-rose-500 font-bold block mt-1">
                  {errors.phone.message}
                </motion.span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('passwordLabel')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', {
                    required: t('passwordRequired'),
                    minLength: { value: 4, message: t('passwordMin') }
                  })}
                  className="w-full pl-9 pr-9 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-rose-500 font-bold block mt-1">
                  {errors.password.message}
                </motion.span>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isChecking}
              whileHover={{ scale: isChecking ? 1 : 1.01 }}
              whileTap={{ scale: isChecking ? 1 : 0.97 }}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              {isChecking && (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                />
              )}
              {isChecking ? t('loggingIn') : t('loginBtn')}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}


function Navbar() {
  const { darkMode, toggleDarkMode, lang, setLang, favorites, t, userPhone, logout } = useStore();

  const changeLang = () => {
    if (lang === 'uz') setLang('en');
    else if (lang === 'en') setLang('ru');
    else setLang('uz');
  };

  const handleLogout = () => {
    if (window.confirm("Rostdan ham chiqmoqchimisiz?")) logout();
  };

  const linkCls = (isActive) => `hidden sm:flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' : 'text-slate-600 dark:text-slate-300 hover:text-sky-600'}`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-sky-600 rounded-lg text-white shadow-sm flex items-center justify-center font-serif text-lg font-bold group-hover:bg-sky-700 transition-colors">T</div>
          <div>
            <span className="text-lg font-serif font-bold text-slate-900 dark:text-white leading-none">TalabaUy</span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Toshkent talabalar portali</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <NavLink to="/" end className={({ isActive }) => linkCls(isActive)}>
            <HomeIcon className="w-4 h-4" /> <span>{t('home')}</span>
          </NavLink>
          <NavLink to="/favorites" className={({ isActive }) => linkCls(isActive)}>
            <Heart className="w-4 h-4 text-rose-500" />
            <span>{t('favorites')}</span>
            {favorites.length > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">{favorites.length}</span>}
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => linkCls(isActive)}>
            <PlusCircle className="w-4 h-4" /> <span>{t('addListing')}</span>
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => linkCls(isActive)}>
            <MessageCircle className="w-4 h-4" /> <span>{t('chat')}</span>
          </NavLink>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button onClick={changeLang} className="px-2.5 py-1.5 text-xs font-bold uppercase rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 hover:border-sky-500 transition">
              <Languages className="w-3.5 h-3.5 text-sky-600" /> {lang}
            </button>
            <button onClick={toggleDarkMode} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <button
              onClick={handleLogout}
              title={userPhone ? `${userPhone} — ${t('logoutBtn')}` : t('logoutBtn')}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 rounded-xl transition"
            >
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
  const cls = (isActive) => `flex flex-col items-center gap-1 p-2 text-[10px] font-bold rounded-xl ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' : 'text-slate-500'}`;
  return (
    <div
      className="sm:hidden fixed left-4 right-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl flex justify-around items-center"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <NavLink to="/" end className={({ isActive }) => cls(isActive)}>
        <HomeIcon className="w-5 h-5" /> <span>{t('home')}</span>
      </NavLink>
      <NavLink to="/favorites" className={({ isActive }) => `relative ${cls(isActive)}`}>
        <Heart className="w-5 h-5 text-rose-500" /> <span>{t('favorites')}</span>
        {favorites.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500" />}
      </NavLink>
      <NavLink to="/add" className={({ isActive }) => cls(isActive)}>
        <PlusCircle className="w-5 h-5 text-sky-600" /> <span>{t('addListing')}</span>
      </NavLink>
      <NavLink to="/chat" className={({ isActive }) => cls(isActive)}>
        <MessageCircle className="w-5 h-5 text-sky-600" /> <span>Chat</span>
      </NavLink>
    </div>
  );
}


const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};


function ListingCard({ item }) {
  const { favorites, toggleFavorite, t } = useStore();
  const isFav = favorites.includes(item.id);

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      whileHover={{ y: -4 }}
      transition={{ layout: { duration: 0.3 } }}
      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between"
    >
      <div>
        <div className="relative h-52 bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <motion.button
            onClick={() => toggleFavorite(item.id)}
            whileTap={{ scale: 0.85 }}
            className="absolute top-3 right-3 p-2.5 rounded-lg bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm shadow-sm"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isFav ? 'fav' : 'unfav'}
                initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="block"
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-200'}`} />
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex-wrap">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.type === 'Xonadon' ? 'bg-sky-600' : 'bg-terracotta-500'}`} />
            <span>{item.type}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1 truncate"><GraduationCap className="w-3.5 h-3.5 shrink-0" /> {item.university}</span>
            {item.verified && (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tasdiqlangan
                </span>
              </>
            )}
          </div>
          <h3 className="text-base font-serif font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-2 group-hover:text-sky-600 transition-colors">{item.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-4">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" /> <span className="truncate">{item.address} · {item.rooms} xona · {item.distance || 'Yaqinida'}</span>
          </p>
        </div>
      </div>
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <div>
          <span className="text-2xl font-serif font-bold text-slate-900 dark:text-white">${item.price}</span>
          <span className="text-xs text-slate-400 font-medium"> / {t('monthly')}</span>
        </div>
        <Link to={`/listing/${item.id}`} className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition flex items-center gap-1">
          {t('details')} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}


function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 animate-pulse">
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl mb-4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3 mb-2" />
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-4" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full" />
        </div>
      ))}
    </div>
  );
}


function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}


function Home() {
  const { data: listings = [], isLoading, isError, refetch } = useFetchListings();
  const {
    t, searchQuery, setSearchQuery, selectedUniversity, setSelectedUniversity,
    selectedType, setSelectedType, selectedRooms, setSelectedRooms, sortBy, setSortBy,
    maxPrice, setMaxPrice, resetFilters
  } = useStore();

  const q = searchQuery.toLowerCase();
  const filteredListings = listings
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(q) || item.address.toLowerCase().includes(q) || (item.university || '').toLowerCase().includes(q);
      const matchesUni = selectedUniversity === 'Barchasi' || item.university === selectedUniversity;
      const matchesType = selectedType === 'Barchasi' || item.type === selectedType;
      const matchesRooms = selectedRooms === 'Barchasi' || item.rooms === Number(selectedRooms);
      const matchesPrice = item.price <= maxPrice;
      return matchesSearch && matchesUni && matchesType && matchesRooms && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const selectCls = "w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none";

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 sm:pb-20 bg-slate-50 dark:bg-slate-900 transition-colors">
        <section className="relative bg-sky-900 text-white py-14 sm:py-20 px-4 text-center overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <pattern id="tileGrid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M28 0 L56 28 L28 56 L0 28 Z" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#tileGrid)" />
          </svg>
          <div className="max-w-3xl mx-auto relative z-10">
            <p className="text-sky-200 text-xs font-medium mb-3">Toshkentdagi oliygohlar uchun</p>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight mb-4 leading-tight">{t('heroTitle')}</h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">{t('heroSub')}</p>
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xl flex items-center border border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600 mr-2">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 mb-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-sky-600" /> {t('filters')}
              </div>
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400">
                <RotateCcw className="w-3.5 h-3.5" /> {t('reset')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('university')}</label>
                <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)} className={selectCls}>
                  {universitiesList.map((uni) => <option key={uni} value={uni}>{uni === 'Barchasi' ? t('all') : uni}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('type')}</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={selectCls}>
                  <option value="Barchasi">{t('all')}</option>
                  <option value="Xonadosh">{t('roommate')}</option>
                  <option value="Xonadon">{t('apartment')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('rooms')}</label>
                <select value={selectedRooms} onChange={(e) => setSelectedRooms(e.target.value)} className={selectCls}>
                  <option value="Barchasi">{t('all')}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('sort')}</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
                  <option value="default">{t('newest')}</option>
                  <option value="price-low">{t('priceLow')}</option>
                  <option value="price-high">{t('priceHigh')}</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>{t('maxPrice')}</span>
                  <span className="text-sky-600 font-black">${maxPrice}</span>
                </div>
                <input type="range" min="30" max="500" step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-sky-600 cursor-pointer mt-1" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <SkeletonLoader />
          ) : isError ? (
            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <p className="text-xs font-bold">Xatolik yuz berdi!</p>
              <button onClick={() => refetch()} className="mt-2 text-xs text-sky-600 font-bold underline">Qayta urinish</button>
            </div>
          ) : filteredListings.length > 0 ? (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredListings.map((item) => <ListingCard key={item.id} item={item} />)}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Filter className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">{t('notFound')}</h3>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}


function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading, isError } = useFetchSingleListing(id);
  const { mutate: deleteListing } = useRemoveListing();
  const { favorites, toggleFavorite, t } = useStore();

  if (isLoading) return <div className="p-10 max-w-5xl mx-auto"><SkeletonLoader /></div>;
  if (isError || !item) return <div className="p-10 text-center text-rose-500 font-bold">Uy ma'lumoti topilmadi.</div>;

  const isFav = favorites.includes(item.id);
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(item.address + ' Tashkent')}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const handleDelete = () => {
    if (window.confirm("Rostdan ham ushbu e'lonni o'chirmoqchimisiz?")) {
      deleteListing(item.id, { onSuccess: () => navigate('/') });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 pb-28 sm:pb-12 transition-colors">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 mb-6 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <ArrowLeft className="w-4 h-4" /> Ortga qaytish
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="relative h-72 sm:h-96 bg-slate-900">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-sky-600 text-white backdrop-blur-md shadow-lg">{item.type}</span>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => toggleFavorite(item.id)} className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg">
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-700 dark:text-slate-200'}`} />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 mb-2">
                    <GraduationCap className="w-4 h-4" /> {item.university} yaqinida ({item.distance})
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">{item.title}</h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> {item.address}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-3xl font-serif font-bold text-slate-900 dark:text-white">${item.price}</span>
                  <span className="text-xs text-slate-400 font-medium"> / {t('monthly')}</span>
                  <a href={`tel:${item.phone}`} className="mt-3 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition">
                    <Phone className="w-4 h-4" /> {t('call')}
                  </a>
                </div>
              </div>

              <div className="py-6 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-2">{t('descLabel')}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
              </div>

              <div className="py-6">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-600" /> {t('locationOnMap')}
                </h3>
                <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                  <iframe
                    title="Google Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={mapUrl}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold rounded-xl transition">
                  <Trash2 className="w-4 h-4" /> {t('deleteBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function AddListing() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { rooms: '1', university: 'TATU', type: 'Xonadosh' }
  });
  const { mutate: createListing, isPending } = useCreateListing();
  const navigate = useNavigate();
  const { t } = useStore();

  const onSubmit = (formData) => {
    const payload = {
      ...formData,
      price: Number(formData.price),
      rooms: Number(formData.rooms),
      verified: true,
      distance: '400 m',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
    };

    createListing(payload, {
      onSuccess: () => {
        reset();
        navigate('/');
      }
    });
  };

  const inputCls = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500";
  const labelCls = "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1";

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 pb-28 sm:pb-10 transition-colors">
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-bold text-sky-600 mb-6">
            <ArrowLeft className="w-4 h-4" /> Ortga qaytish
          </button>

          <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-white mb-6">{t('addTitle')}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={labelCls}>{t('titleLabel')}</label>
              <input type="text" {...register('title', { required: "Sarlavha kiritilishi shart!" })} className={inputCls} />
              {errors.title && <span className="text-[10px] text-rose-500 font-bold">{errors.title.message}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('priceLabel')}</label>
                <input type="number" min="1" {...register('price', { required: true })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('rooms')}</label>
                <select {...register('rooms')} className={inputCls}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
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

            <motion.button
              type="submit"
              disabled={isPending}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-60"
            >
              {isPending ? 'Saqlanmoqda...' : t('submitBtn')}
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
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-600 dark:text-slate-400">Hozircha saralangan uylar yo'q</h3>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}


function getInitials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

const avatarPalette = ['bg-sky-600', 'bg-terracotta-500', 'bg-emerald-600', 'bg-rose-500'];
function getAvatarColor(name) {
  const sum = (name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return avatarPalette[sum % avatarPalette.length];
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function Chat() {
  const { data: messages = [] } = useFetchMessages();
  const { mutate: sendMessage, isPending } = useSendMessage();
  const { t, chatName, setChatName, userPhone } = useStore();
  const [text, setText] = useState('');
  const [nameInput, setNameInput] = useState('');
  const bottomRef = useRef(null);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    sendMessage({ author: chatName, phone: userPhone, text: trimmed.slice(0, 500) });
    setText('');
  };

  const handleSaveName = (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setChatName(trimmed.slice(0, 24));
  };


  const activeCount = (() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    const set = new Set(
      messages
        .filter((m) => new Date(m.createdAt).getTime() > cutoff)
        .map((m) => m.phone || m.author)
    );
    if (userPhone) set.add(userPhone);
    return set.size;
  })();


  if (!chatName) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 pb-28 sm:pb-0 transition-colors">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 text-center"
          >
            <div className="w-11 h-11 bg-sky-600 rounded-lg text-white flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-serif font-bold text-slate-800 dark:text-white mb-1">{t('chat')}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{t('chatNamePrompt')}</p>
            <form onSubmit={handleSaveName} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t('chatNamePlaceholder')}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                {t('chatNameSave')}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 pb-28 sm:pb-0 transition-colors">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex items-center gap-3 sticky top-16 z-20">
          <div className="w-10 h-10 bg-sky-600 rounded-lg text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-serif font-bold text-slate-800 dark:text-white">{t('chat')}</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              {activeCount} {t('chatOnline')}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 max-w-3xl mx-auto w-full space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-slate-400 mt-10">{t('chatEmpty')}</p>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.phone ? msg.phone === userPhone : msg.author === chatName;
              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full ${getAvatarColor(msg.author)} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>
                    {getInitials(msg.author)}
                  </div>
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwn && (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 px-1">
                        {msg.author}
                      </span>
                    )}
                    <div className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words ${isOwn
                      ? 'bg-sky-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                      }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">{formatTime(msg.createdAt)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="sticky bottom-24 sm:bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center gap-2 max-w-3xl mx-auto w-full"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('chatPlaceholder')}
            maxLength={500}
            className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <motion.button
            type="submit"
            disabled={!text.trim() || isPending}
            whileTap={{ scale: 0.9 }}
            className="p-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </PageTransition>
  );
}


export default function App() {
  const darkMode = useStore((state) => state.darkMode);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const [showIntro, setShowIntro] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (!isAuthenticated) {
    return (
      <>
        <Login onSuccess={() => setShowIntro(true)} />
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors">
          {showIntro && <Intro onDone={() => setShowIntro(false)} />}
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/add" element={<AddListing />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="*" element={<div className="p-10 text-center font-bold">Sahifa topilmadi</div>} />
          </Routes>
          <MobileBottomNav />
          <Toaster position="bottom-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}