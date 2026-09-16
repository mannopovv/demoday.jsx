import React, { useState, useEffect } from 'react';
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
    Building2, Home as HomeIcon, PlusCircle, Sun, Moon, Search,
    SlidersHorizontal, Heart, MapPin, GraduationCap, CheckCircle2,
    ArrowLeft, Trash2, Phone, Sparkles, Filter, X, RotateCcw,
    AlertTriangle, Languages, FileQuestion
} from 'lucide-react';


const api = axios.create({ baseURL: '/api' });
const mock = new MockAdapter(api, { delayResponse: 500 });
const LOCAL_STORAGE_KEY = 'talabauy_listings_student_db';

const initialListings = [
    {
        id: '1',
        title: "TATU yaqinida 2 xonali kvartirada 1 ta joy",
        type: 'Xonadosh',
        price: 80,
        university: 'TATU',
        address: 'Yunusobod tumani, Bodomzor metro yaqinida',
        distance: '300 metr (5 min piyoda)',
        phone: '+998 90 123 45 67',
        rooms: 2,
        verified: true,
        description: 'Wi-Fi, muzlatgich, kir yuvish mashinasi bor. Faqat intizomli talabalar uchun.',
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-01-01T10:00:00.000Z',
    },
    {
        id: '2',
        title: "O'zMU va TDTU talabalari uchun shinam xonadon",
        type: 'Xonadon',
        price: 220,
        university: "O'zMU",
        address: "Olmazor tumani, Beruniy metro yo'nalishida",
        distance: '600 metr',
        phone: '+998 93 987 65 43',
        rooms: 3,
        verified: true,
        description: 'Yangi remontdan chiqqan xonadon. Kombi tizimi o\'rnatilgan.',
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-01-02T10:00:00.000Z',
    },
    {
        id: '3',
        title: 'TDIU atrofida qizlar uchun sheriklik',
        type: 'Xonadosh',
        price: 95,
        university: 'TDIU',
        address: 'Mirobod tumani, Oybek metro yaqinida',
        distance: '400 metr',
        phone: '+998 97 555 11 22',
        rooms: 2,
        verified: true,
        description: "O'qishga mas'uliyatli qizlarni taklif qilamiz.",
        image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-01-03T10:00:00.000Z',
    }
];

function getListingsFromStorage() {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialListings));
        return initialListings;
    }
    return JSON.parse(data);
}

function saveListingsToStorage(listings) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(listings));
}

mock.onGet('/listings').reply(() => {
    const listings = getListingsFromStorage();
    return [200, listings];
});

mock.onPost('/listings').reply((config) => {
    const data = JSON.parse(config.data);
    const listings = getListingsFromStorage();
    const newListing = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
    };
    const updated = [newListing, ...listings];
    saveListingsToStorage(updated);
    return [201, newListing];
});

mock.onDelete(/\/listings\/\w+/).reply((config) => {
    const id = config.url.split('/').pop();
    const listings = getListingsFromStorage();
    const filtered = listings.filter((item) => item.id !== id);
    saveListingsToStorage(filtered);
    return [200, { success: true }];
});


const queryClient = new QueryClient();

function useFetchListings() {
    return useQuery({
        queryKey: ['listings'],
        queryFn: async () => {
            const response = await api.get('/listings');
            return response.data;
        }
    });
}

function useCreateListing() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (newListing) => {
            const response = await api.post('/listings', newListing);
            return response.data;
        },
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ['listings'] });
            toast.success("E'lon muvaffaqiyatli saqlandi!");
        },
        onError: () => {
            toast.error("Xatolik: e'lonni saqlab bo'lmadi!");
        }
    });
}

function useRemoveListing() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const response = await api.delete(`/listings/${id}`);
            return response.data;
        },
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ['listings'] });
            toast.success("E'lon muvaffaqiyatli o'chirildi!");
        },
        onError: () => {
            toast.error("Xatolik: e'lonni o'chirib bo'lmadi!");
        }
    });
}


const translations = {
    uz: {
        home: 'Bosh sahifa',
        favorites: 'Saralanganlar',
        addListing: "E'lon berish",
        heroTitle: 'Talabalar uchun Shinam va Qulay Uylar',
        heroSub: "O'zingizga mos keladigan hamyonbop xonadon va ishonchli xonadoshlarni osongina toping.",
        searchPlaceholder: 'Metro, tuman yoki oliygoh nomini kiriting...',
        filters: 'Moslashtirish filtri',
        reset: 'Tozalash',
        university: 'Oliygoh',
        type: "E'lon turi",
        rooms: 'Xonalar soni',
        sort: 'Saralash',
        maxPrice: 'Maks. narx',
        all: 'Barchasi',
        roommate: 'Xonadosh kerak',
        apartment: "To'liq xonadon",
        newest: "Yangi e'lonlar",
        priceLow: 'Narx: arzonidan',
        priceHigh: 'Narx: qimmatidan',
        notFound: "Mos e'lonlar topilmadi",
        details: 'Batafsil',
        call: "Qo'ng'iroq qilish",
        monthly: 'oyiga',
        notFoundTitle: 'Sahifa topilmadi',
        backHome: 'Bosh sahifaga qaytish',
        addTitle: "Yangi e'lon qo'shish",
        titleLabel: "E'lon sarlavhasi",
        priceLabel: "Narxi ($)",
        phoneLabel: "Telefon raqam",
        addressLabel: "Manzil",
        descLabel: "Tavsif",
        submitBtn: "E'lonni joylash",
        deleteBtn: "E'lonni o'chirish"
    },
    en: {
        home: 'Home',
        favorites: 'Favorites',
        addListing: 'Add Listing',
        heroTitle: 'Cozy & Affordable Student Housing',
        heroSub: 'Easily find suitable budget apartments and reliable roommates near your university.',
        searchPlaceholder: 'Search by metro, district or university...',
        filters: 'Custom Filters',
        reset: 'Reset',
        university: 'University',
        type: 'Listing Type',
        rooms: 'Rooms Count',
        sort: 'Sort By',
        maxPrice: 'Max Price',
        all: 'All',
        roommate: 'Roommate needed',
        apartment: 'Full Apartment',
        newest: 'Newest first',
        priceLow: 'Price: Low to High',
        priceHigh: 'Price: High to Low',
        notFound: 'No listings found',
        details: 'Details',
        call: 'Call Now',
        monthly: 'per month',
        notFoundTitle: 'Page not found',
        backHome: 'Back to Home',
        addTitle: 'Add New Listing',
        titleLabel: 'Listing Title',
        priceLabel: 'Price ($)',
        phoneLabel: 'Phone Number',
        addressLabel: 'Address',
        descLabel: 'Description',
        submitBtn: 'Submit Listing',
        deleteBtn: 'Delete Listing'
    },
    ru: {
        home: 'Главная',
        favorites: 'Избранное',
        addListing: 'Добавить объявление',
        heroTitle: 'Уютное жильё для студентов',
        heroSub: 'Легко найдите бюджетную квартиру и надёжных соседей рядом с университетом.',
        searchPlaceholder: 'Поиск по метро, району или университету...',
        filters: 'Настроить фильтр',
        reset: 'Сбросить',
        university: 'Университет',
        type: 'Тип объявления',
        rooms: 'Количество комнат',
        sort: 'Сортировка',
        maxPrice: 'Макс. цена',
        all: 'Все',
        roommate: 'Нужен сосед',
        apartment: 'Вся квартира',
        newest: 'Сначала новые',
        priceLow: 'Цена: по возрастанию',
        priceHigh: 'Цена: по убыванию',
        notFound: 'Объявления не найдены',
        details: 'Подробнее',
        call: 'Позвонить',
        monthly: 'в месяц',
        notFoundTitle: 'Страница не найдена',
        backHome: 'На главную',
        addTitle: 'Добавить объявление',
        titleLabel: 'Заголовок',
        priceLabel: 'Цена ($)',
        phoneLabel: 'Номер телефона',
        addressLabel: 'Адрес',
        descLabel: 'Описание',
        submitBtn: 'Опубликовать',
        deleteBtn: 'Удалить объявление'
    }
};

const useStore = create(
    persist(
        (set, get) => ({
            darkMode: false,
            toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

            lang: 'uz',
            setLang: (lang) => set({ lang }),
            t: (key) => translations[get().lang][key] || key,

            favorites: [],
            toggleFavorite: (id) => set((state) => {
                const exists = state.favorites.includes(id);
                if (exists) {
                    toast.error("Saralanganlardan olib tashlandi");
                    return { favorites: state.favorites.filter((fId) => fId !== id) };
                }
                toast.success("Saralanganlarga qo'shildi!");
                return { favorites: [...state.favorites, id] };
            }),

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
        { name: 'talabauy_student_app_state' }
    )
);

const universitiesList = ['Barchasi', 'TATU', "O'zMU", 'TDTU', 'TDIU', 'WIUT', 'INHA', 'TPTI'];


function Navbar() {
    const { darkMode, toggleDarkMode, lang, setLang, favorites, t } = useStore();

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const changeLang = () => {
        if (lang === 'uz') setLang('en');
        else if (lang === 'en') setLang('ru');
        else setLang('uz');
    };

    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-600 rounded-2xl text-white shadow-md">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xl font-black bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">TalabaUy</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">Toshkent Portal</span>
                    </div>
                </Link>

                <nav className="flex items-center gap-3">
                    <NavLink to="/" className={({ isActive }) => `hidden sm:flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' : 'text-slate-600 dark:text-slate-300 hover:text-sky-600'}`}>
                        <HomeIcon className="w-4 h-4" /> <span>{t('home')}</span>
                    </NavLink>
                    <NavLink to="/favorites" className={({ isActive }) => `relative flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' : 'text-slate-600 dark:text-slate-300 hover:text-sky-600'}`}>
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span className="hidden sm:inline">{t('favorites')}</span>
                        {favorites.length > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">{favorites.length}</span>}
                    </NavLink>
                    <NavLink to="/add" className={({ isActive }) => `hidden sm:flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' : 'text-slate-600 dark:text-slate-300 hover:text-sky-600'}`}>
                        <PlusCircle className="w-4 h-4" /> <span>{t('addListing')}</span>
                    </NavLink>

                    <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                        <button onClick={changeLang} className="px-2.5 py-1 text-xs font-bold uppercase rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <Languages className="w-3.5 h-3.5 text-sky-600" /> {lang}
                        </button>
                        <button onClick={toggleDarkMode} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
                            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}


function MobileBottomNav() {
    const { favorites, t } = useStore();
    return (
        <div className="sm:hidden fixed bottom-3 left-4 right-4 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl flex justify-around items-center">
            <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 text-[10px] font-bold rounded-xl ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' : 'text-slate-500'}`}>
                <HomeIcon className="w-5 h-5" /> <span>{t('home')}</span>
            </NavLink>
            <NavLink to="/favorites" className={({ isActive }) => `relative flex flex-col items-center gap-1 p-2 text-[10px] font-bold rounded-xl ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' : 'text-slate-500'}`}>
                <Heart className="w-5 h-5 text-rose-500" /> <span>{t('favorites')}</span>
                {favorites.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500" />}
            </NavLink>
            <NavLink to="/add" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 text-[10px] font-bold rounded-xl ${isActive ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' : 'text-slate-500'}`}>
                <PlusCircle className="w-5 h-5 text-sky-600" /> <span>{t('addListing')}</span>
            </NavLink>
        </div>
    );
}


function ListingCard({ item }) {
    const { favorites, toggleFavorite, t } = useStore();
    const isFav = favorites.includes(item.id);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
        >
            <div>
                <div className="relative h-48 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-sky-600/90 text-white backdrop-blur-md">{item.type}</span>
                        {item.verified && (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/90 text-white backdrop-blur-md flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Tasdiqlangan
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute top-3 right-3 p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md"
                    >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-200'}`} />
                    </button>
                </div>
                <div className="p-5">
                    <div className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 mb-2">
                        <span className="flex items-center gap-1 truncate"><GraduationCap className="w-4 h-4 shrink-0" /> {item.university} ({item.distance || 'Yaqinida'})</span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">{item.rooms} xona</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1 mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-4">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" /> <span className="truncate">{item.address}</span>
                    </p>
                </div>
            </div>
            <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">${item.price}</span>
                    <span className="text-xs text-slate-400 font-medium"> / {t('monthly')}</span>
                </div>
                <Link to={`/listing/${item.id}`} className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-md shadow-sky-500/20">
                    {t('details')}
                </Link>
            </div>
        </motion.div>
    );
}


function SkeletonLoader() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 animate-pulse">
                    <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl mb-4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3 mb-2" />
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-4" />
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full" />
                </div>
            ))}
        </div>
    );
}

function ErrorState({ onRetry }) {
    return (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-rose-200 dark:border-rose-900/60">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Nimadir xato ketdi</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Ma'lumotlarni yuklab bo'lmadi.</p>
            <button onClick={onRetry} className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition">Qayta urinish</button>
        </div>
    );
}

function Home() {
    const { data: listings = [], isLoading, isError, refetch } = useFetchListings();
    const {
        t, searchQuery, setSearchQuery, selectedUniversity, setSelectedUniversity,
        selectedType, setSelectedType, selectedRooms, setSelectedRooms, sortBy, setSortBy,
        maxPrice, setMaxPrice, resetFilters
    } = useStore();

    const filteredListings = listings
        .filter((item) => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.address.toLowerCase().includes(searchQuery.toLowerCase());
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

    return (
        <div className="min-h-screen pb-28 sm:pb-20 bg-slate-50 dark:bg-slate-900 transition-colors">
            
            <section className="bg-gradient-to-br from-sky-600 via-indigo-600 to-slate-900 text-white py-16 px-4 text-center shadow-lg">
                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-200 text-xs font-semibold mb-4">
                        <Sparkles className="w-4 h-4 text-amber-300" /> Tashkent Student Housing Portal
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">{t('heroTitle')}</h1>
                    <p className="text-slate-200 text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">{t('heroSub')}</p>
                    <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl flex items-center border border-slate-200 dark:border-slate-700">
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
                
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 mb-8 shadow-xl">
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
                            <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                                {universitiesList.map((uni) => <option key={uni} value={uni}>{uni}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('type')}</label>
                            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                                <option value="Barchasi">{t('all')}</option>
                                <option value="Xonadosh">{t('roommate')}</option>
                                <option value="Xonadon">{t('apartment')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('rooms')}</label>
                            <select value={selectedRooms} onChange={(e) => setSelectedRooms(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                                <option value="Barchasi">{t('all')}</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('sort')}</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold">
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
                    <ErrorState onRetry={refetch} />
                ) : filteredListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredListings.map((item) => <ListingCard key={item.id} item={item} />)}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Filter className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">{t('notFound')}</h3>
                    </div>
                )}
            </main>
        </div>
    );
}

function AddListing() {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const { mutate: createListing, isPending } = useCreateListing();
    const navigate = useNavigate();
    const { t } = useStore();

    const onSubmit = (formData) => {
        const payload = {
            ...formData,
            price: Number(formData.price),
            rooms: Number(formData.rooms),
            verified: true,
            distance: '500 metr',
            image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
        };

        createListing(payload, {
            onSuccess: () => {
                reset();
                navigate('/');
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 transition-colors">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-bold text-sky-600 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Ortga qaytish
                </button>

                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">{t('addTitle')}</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('titleLabel')}</label>
                        <input
                            type="text"
                            {...register('title', { required: "Sarlavha kiritilishi shart!" })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        {errors.title && <span className="text-rose-500 text-[10px] font-bold mt-1 block">{errors.title.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('priceLabel')}</label>
                            <input
                                type="number"
                                {...register('price', { required: "Narx kiritilishi shart!", min: 1 })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            {errors.price && <span className="text-rose-500 text-[10px] font-bold mt-1 block">{errors.price.message}</span>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('rooms')}</label>
                            <select
                                {...register('rooms')}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="1">1 xona</option>
                                <option value="2">2 xona</option>
                                <option value="3">3 xona</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('university')}</label>
                            <select
                                {...register('university')}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                {universitiesList.filter(u => u !== 'Barchasi').map((uni) => (
                                    <option key={uni} value={uni}>{uni}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('type')}</label>
                            <select
                                {...register('type')}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                <option value="Xonadosh">{t('roommate')}</option>
                                <option value="Xonadon">{t('apartment')}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('phoneLabel')}</label>
                        <input
                            type="text"
                            placeholder="+998 90 123 45 67"
                            {...register('phone', { required: "Telefon kiritilishi shart!" })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        {errors.phone && <span className="text-rose-500 text-[10px] font-bold mt-1 block">{errors.phone.message}</span>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('addressLabel')}</label>
                        <input
                            type="text"
                            {...register('address', { required: "Manzil kiritilishi shart!" })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        {errors.address && <span className="text-rose-500 text-[10px] font-bold mt-1 block">{errors.address.message}</span>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('descLabel')}</label>
                        <textarea
                            rows="3"
                            {...register('description')}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
                    >
                        {isPending ? "Saqlanmoqda..." : t('submitBtn')}
                    </button>
                </form>
            </div>
        </div>
    );
}
function ListingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useStore();
    const { data: listings = [], isLoading, isError, refetch } = useFetchListings();
    const { mutate: removeListing, isPending: isDeleting } = useRemoveListing();

    if (isLoading) return <div className="max-w-4xl mx-auto py-10 px-4"><SkeletonLoader /></div>;
    if (isError) return <div className="max-w-4xl mx-auto py-10 px-4"><ErrorState onRetry={refetch} /></div>;

    const item = listings.find((l) => l.id === id);

    if (!item) {
        return (
            <div className="min-h-screen p-10 text-center dark:bg-slate-900 text-slate-800 dark:text-white">
                <h2 className="text-xl font-bold mb-4">E'lon topilmadi!</h2>
                <Link to="/" className="text-sky-600 underline">Bosh sahifaga qaytish</Link>
            </div>
        );
    }

    const handleDelete = () => {
        if (window.confirm("Rostdan ham ushbu e'lonni o'chirmoqchimisiz?")) {
            removeListing(id, {
                onSuccess: () => navigate('/')
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 transition-colors">
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-bold text-sky-600 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Ortga qaytish
                </button>

                <div className="relative h-72 rounded-2xl overflow-hidden mb-6 bg-slate-100">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-sky-600 text-white font-bold text-xs rounded-full">{item.type}</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-sky-50 dark:bg-sky-950 text-sky-600 font-bold text-xs rounded-lg">{item.university} ({item.distance})</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">${item.price} <span className="text-xs font-normal text-slate-400">/ {t('monthly')}</span></span>
                </div>

                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{item.title}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-6">
                    <MapPin className="w-4 h-4 text-slate-400" /> {item.address}
                </p>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-6">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tavsif va sharoitlar</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex gap-4">
                    <a
                        href={`tel:${item.phone}`}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
                    >
                        <Phone className="w-4 h-4" /> {item.phone} {t('call')}
                    </a>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-rose-500/20 disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" /> {isDeleting ? "..." : t('deleteBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
}
function Favorites() {
    const { favorites, t } = useStore();
    const { data: listings = [] } = useFetchListings();
    const favoriteListings = listings.filter((item) => favorites.includes(item.id));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 transition-colors">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6">{t('favorites')}</h1>
                {favoriteListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favoriteListings.map((item) => (
                            <ListingCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Heart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Saralangan e'lonlar mavjud emas</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
function NotFound() {
    const { t } = useStore();
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center transition-colors">
            <div className="w-16 h-16 rounded-3xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center mb-4">
                <FileQuestion className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">404</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('notFoundTitle')}</p>
            <Link to="/" className="px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition">
                {t('backHome')}
            </Link>
        </div>
    );
}
export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors">
                    <Toaster position="top-right" />
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/add" element={<AddListing />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/listing/:id" element={<ListingDetail />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    <MobileBottomNav />
                </div>
            </Router>
        </QueryClientProvider>
    );
}