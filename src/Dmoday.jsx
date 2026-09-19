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
    AlertTriangle, Languages, ChevronRight, Compass, ShieldCheck
} from 'lucide-react';


const api = axios.create({ baseURL: '/api' });
const mock = new MockAdapter(api, { delayResponse: 300 });
const LOCAL_STORAGE_KEY = 'talabauy_listings_db_v4';


const initialListings = [
    {
        id: '1',
        title: "TATU yaqinida 2 xonali kvartirada 1 ta joy",
        type: 'Xonadosh',
        price: 80,
        university: 'TATU',
        address: 'Yunusobod tumani, Bodomzor metro yaqinida',
        distance: '300 m (5 min piyoda)',
        phone: '+998 90 123 45 67',
        rooms: 2,
        verified: true,
        description: 'Wi-Fi, muzlatgich, kir yuvish mashinasi bor. Xonadon sharoiti a\'lo. Faqat intizomli va ozoda talabalar uchun.',
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
        distance: '600 m (8 min piyoda)',
        phone: '+998 93 987 65 43',
        rooms: 3,
        verified: true,
        description: 'Yangi remontdan chiqqan xonadon. Kombi isitish tizimi, smart TV va yevro-remont qilingan.',
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
        distance: '400 m (6 min piyoda)',
        phone: '+998 97 555 11 22',
        rooms: 2,
        verified: true,
        description: "O'qishga mas'uliyatli qizlarni taklif qilamiz. Tinch, toza va barcha qulayliklarga ega.",
        image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-01-03T10:00:00.000Z',
    },
    {
        id: '4',
        title: 'WIUT yaqinida lyuks 1 xonali studiya',
        type: 'Xonadon',
        price: 310,
        university: 'WIUT',
        address: 'Yashnobod tumani, Amir Temur maydoni yaqinida',
        distance: '200 m (3 min piyoda)',
        phone: '+998 94 444 00 11',
        rooms: 1,
        verified: true,
        description: 'Zamonaviy dizayndagi studiya kvartira. Talaba yoki yosh mutassis uchun juda qulay.',
        image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-01-04T10:00:00.000Z',
    },
    {
        id: '5',
        title: "TDTU (Politeh) binosidan 5 minutlik uy",
        type: 'Xonadosh',
        price: 75,
        university: 'TDTU',
        address: 'Olmazor tumani, Talabalar shaharchasi',
        distance: '250 m',
        phone: '+998 99 111 22 33',
        rooms: 3,
        verified: false,
        description: 'Boshqa ogil bolalar yoniga 1 kishi kerak. Sharoiti yaxshi, internet bor.',
        image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-01-05T10:00:00.000Z',
    },
    {
        id: '6',
        title: "INHA Universiteti qarshisidagi novostroyka",
        type: 'Xonadon',
        price: 280,
        university: 'INHA',
        address: 'Mirzo Ulugbek tumani, Buyuk Ipak Yoli',
        distance: '150 m',
        phone: '+998 91 777 88 99',
        rooms: 2,
        verified: true,
        description: 'Yangi binoda joylashgan, lifty bor, xavfsiz hudud va tinch hovli.',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-01-06T10:00:00.000Z',
    },
    {
        id: '7',
        title: "TPTI talaba qizlari uchun 2 xonali uy",
        type: 'Xonadosh',
        price: 85,
        university: 'TPTI',
        address: 'Shayxontohur tumani, Toshmi yaqinida',
        distance: '500 m',
        phone: '+998 95 333 44 55',
        rooms: 2,
        verified: true,
        description: 'Toshmi oquvchilariga juda qulay joy. Uyda hamma texnika bor.',
        image: 'https://images.unsplash.com/photo-1540518614846-7ede433c517a?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-01-07T10:00:00.000Z',
    },
    {
        id: '8',
        title: "TATU shaharchasida 1 xonali alohida uy",
        type: 'Xonadon',
        price: 180,
        university: 'TATU',
        address: 'Yunusobod 4-mavze',
        distance: '450 m',
        phone: '+998 90 999 00 11',
        rooms: 1,
        verified: false,
        description: 'Alohida yashashni xohlaydigan talabaga mo\'ljallangan ixcham uy.',
        image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-01-08T10:00:00.000Z',
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


mock.onGet('/listings').reply(() => [200, getListingsFromStorage()]);

mock.onGet(/\/listings\/\w+/).reply((config) => {
    const id = config.url.split('/').pop();
    const listings = getListingsFromStorage();
    const listing = listings.find((item) => item.id === id);
    return listing ? [200, listing] : [404, { message: 'Topilmadi' }];
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

// React Query Hooks
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

// Tarjima so'zlari
const translations = {
    uz: {
        home: 'Bosh sahifa',
        favorites: 'Saralanganlar',
        addListing: "E'lon berish",
        heroTitle: 'Talabalar uchun Shinam va Qulay Uylar',
        heroSub: "O'zingizga mos keladigan hamyonbop xonadon va ishonchli xonadoshlarni osongina toping.",
        searchPlaceholder: 'Metro, tumani yoki oliygoh nomini kiriting...',
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
        addTitle: "Yangi e'lon qo'shish",
        titleLabel: "E'lon sarlavhasi",
        priceLabel: "Narxi ($)",
        phoneLabel: "Telefon raqam",
        addressLabel: "Manzil",
        descLabel: "Tavsif",
        submitBtn: "E'lonni joylash",
        deleteBtn: "E'lonni o'chirish",
        locationOnMap: "Joylashuv xaritasi"
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
        addTitle: 'Add New Listing',
        titleLabel: 'Listing Title',
        priceLabel: 'Price ($)',
        phoneLabel: 'Phone Number',
        addressLabel: 'Address',
        descLabel: 'Description',
        submitBtn: 'Submit Listing',
        deleteBtn: 'Delete Listing',
        locationOnMap: "Location Map"
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
        addTitle: 'Добавить объявление',
        titleLabel: 'Заголовок',
        priceLabel: 'Цена ($)',
        phoneLabel: 'Номер телефона',
        addressLabel: 'Адрес',
        descLabel: 'Описание',
        submitBtn: 'Опубликовать',
        deleteBtn: 'Удалить объявление',
        locationOnMap: "Карта расположения"
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
        { name: 'talabauy_student_app_state_v4' }
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
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="p-2.5 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl text-white shadow-md group-hover:scale-105 transition-transform">
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
                        <button onClick={changeLang} className="px-2.5 py-1.5 text-xs font-bold uppercase rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 hover:border-sky-500 transition">
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
        <div className="sm:hidden fixed bottom-3 left-4 right-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl flex justify-around items-center">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
        >
            <div>
                <div className="relative h-52 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-sky-600/90 text-white backdrop-blur-md shadow-md">{item.type}</span>
                        {item.verified && (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/90 text-white backdrop-blur-md flex items-center gap-1 shadow-md">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Tasdiqlangan
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute top-3 right-3 p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md hover:scale-110 transition-transform"
                    >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-200'}`} />
                    </button>
                </div>
                <div className="p-5">
                    <div className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 mb-2">
                        <span className="flex items-center gap-1 truncate"><GraduationCap className="w-4 h-4 shrink-0" /> {item.university} ({item.distance || 'Yaqinida'})</span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">{item.rooms} xona</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1 mb-2 group-hover:text-sky-600 transition-colors">{item.title}</h3>
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
                <Link to={`/listing/${item.id}`} className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-md shadow-sky-500/20 flex items-center gap-1">
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

            <section className="bg-gradient-to-br from-sky-600 via-indigo-600 to-slate-900 text-white py-16 px-4 text-center shadow-lg relative overflow-hidden">
                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-200 text-xs font-semibold mb-4 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-amber-300" /> Toshkent Talabalar Portal platformasi
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">{t('heroTitle')}</h1>
                    <p className="text-slate-200 text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">{t('heroSub')}</p>
                    <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-2xl flex items-center border border-slate-200 dark:border-slate-700">
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
                            <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none">
                                {universitiesList.map((uni) => <option key={uni} value={uni}>{uni}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('type')}</label>
                            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none">
                                <option value="Barchasi">{t('all')}</option>
                                <option value="Xonadosh">{t('roommate')}</option>
                                <option value="Xonadon">{t('apartment')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('rooms')}</label>
                            <select value={selectedRooms} onChange={(e) => setSelectedRooms(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none">
                                <option value="Barchasi">{t('all')}</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{t('sort')}</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none">
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 pb-28 sm:pb-12 transition-colors">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 mb-6 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <ArrowLeft className="w-4 h-4" /> Ortga qaytish
                </button>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
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
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{item.title}</h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2">
                                    <MapPin className="w-4 h-4 text-slate-400" /> {item.address}
                                </p>
                            </div>
                            <div className="text-left md:text-right">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">${item.price}</span>
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
                        {errors.title && <span className="text-[10px] text-rose-500 font-bold">{errors.title.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('priceLabel')}</label>
                            <input
                                type="number"
                                {...register('price', { required: true })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('rooms')}</label>
                            <select {...register('rooms')} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500">
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('university')}</label>
                            <select {...register('university')} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500">
                                {universitiesList.filter(u => u !== 'Barchasi').map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('type')}</label>
                            <select {...register('type')} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500">
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
                            {...register('phone', { required: true })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('addressLabel')}</label>
                        <input
                            type="text"
                            {...register('address', { required: true })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
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
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
                    >
                        {isPending ? 'Saqlanmoqda...' : t('submitBtn')}
                    </button>
                </form>
            </div>
        </div>
    );
}


function Favorites() {
    const { data: listings = [] } = useFetchListings();
    const { favorites, t } = useStore();

    const favListings = listings.filter((item) => favorites.includes(item.id));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 transition-colors">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> {t('favorites')}
                </h1>
                {favListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favListings.map((item) => <ListingCard key={item.id} item={item} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-600 dark:text-slate-400">Hozircha saralangan uylar yo'q</h3>
                    </div>
                )}
            </div>
        </div>
    );
}


export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/listing/:id" element={<ListingDetail />} />
                        <Route path="/add" element={<AddListing />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="*" element={<div className="p-10 text-center font-bold">Sahifa topilmadi</div>} />
                    </Routes>
                    <MobileBottomNav />
                    <Toaster position="bottom-right" />
                </div>
            </Router>
        </QueryClientProvider>
    );
}