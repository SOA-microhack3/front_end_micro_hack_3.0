"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Language } from './types'

const translations = {
  fr: {
    // App
    app_name: "PortFlow Elite",
    app_tagline: "Gestion Intelligente des Acces Portuaires",
    
    // Auth
    login: "Connexion",
    login_title: "Bienvenue",
    login_subtitle: "Connectez-vous a votre espace",
    email: "Email",
    password: "Mot de passe",
    sign_in: "Se connecter",
    sign_out: "Deconnexion",
    remember_me: "Se souvenir de moi",
    forgot_password: "Mot de passe oublie ?",
    
    // Navigation
    dashboard: "Tableau de Bord",
    bookings: "Reservations",
    slots: "Creneaux",
    ai_assistant: "Assistant IA",
    gate: "Portail",
    fleet: "Flotte",
    drivers: "Chauffeurs",
    carriers: "Carriers",
    operators: "Operateurs",
    terminals: "Terminaux",
    audit_logs: "Journal d'Audit",
    settings: "Parametres",
    ports: "Ports",
    notifications: "Notifications",
    
    // Dashboard
    total_bookings_today: "Reservations Aujourd'hui",
    active_trucks: "Camions Actifs",
    gate_entries_today: "Entrees Portail",
    capacity_utilization: "Utilisation Capacite",
    hourly_traffic: "Trafic Horaire",
    terminal_occupancy: "Occupation des Terminaux",
    recent_activity: "Activite Recente",
    quick_actions: "Actions Rapides",
    
    // Bookings
    new_booking: "Nouvelle Reservation",
    booking_id: "ID Reservation",
    booking_status: "Statut",
    booking_date: "Date",
    booking_slot: "Creneau",
    booking_truck: "Camion",
    booking_terminal: "Terminal",
    confirmed: "Confirme",
    pending: "En attente",
    consumed: "Consomme",
    cancelled: "Annule",
    rejected: "Rejete",
    cancel_booking: "Annuler la Reservation",
    view_qr: "Voir QR Code",
    
    // Slots
    slot_availability: "Disponibilite des Creneaux",
    available: "Disponible",
    booked: "Reserve",
    locked: "Verrouille",
    capacity: "Capacite",
    select_date: "Selectionner une Date",
    select_terminal: "Selectionner un Terminal",
    
    // AI
    ai_title: "Assistant IA",
    ai_placeholder: "Demandez la disponibilite des creneaux...",
    ai_greeting: "Bonjour ! Je suis l'assistant IA de PortFlow. Comment puis-je vous aider ?",
    ai_suggestion_1: "Y a-t-il de la place au Terminal A demain 8h-10h ?",
    ai_suggestion_2: "Quels creneaux sont disponibles cette semaine ?",
    ai_suggestion_3: "Reservez 3 camions pour le creneau 9h-10h",
    book_now: "Reserver Maintenant",
    
    // Gate
    gate_title: "Validation Portail",
    gate_subtitle: "Scanner ou saisir le code QR",
    scan_qr: "Scanner QR",
    enter_qr: "Saisir le Code QR",
    validate: "Valider",
    gate_opened: "Portail Ouvert",
    gate_denied: "Acces Refuse",
    gate_success_msg: "Le camion est autorise a entrer",
    gate_error_msg: "Code QR invalide ou expire",
    
    // Fleet
    truck_plate: "Immatriculation",
    truck_model: "Modele",
    truck_status: "Statut",
    add_truck: "Ajouter un Camion",
    available_status: "Disponible",
    in_use: "En Service",
    maintenance: "Maintenance",
    suspended: "Suspendu",
    
    // Drivers
    driver_name: "Nom du Chauffeur",
    driver_license: "Permis",
    driver_status: "Statut",
    add_driver: "Ajouter un Chauffeur",
    active: "Actif",
    
    // Audit
    audit_title: "Journal d'Audit",
    audit_actor: "Acteur",
    audit_action: "Action",
    audit_entity: "Entite",
    audit_time: "Horodatage",
    audit_details: "Details",
    
    // Common
    search: "Rechercher...",
    filter: "Filtrer",
    export: "Exporter",
    refresh: "Actualiser",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    view: "Voir",
    close: "Fermer",
    loading: "Chargement...",
    no_results: "Aucun resultat",
    total: "Total",
    status: "Statut",
    actions: "Actions",
    date: "Date",
    time: "Heure",
    today: "Aujourd'hui",
    this_week: "Cette Semaine",
    this_month: "Ce Mois",
    all: "Tout",
    showing: "Affichage",
    of: "sur",
    results: "resultats",
    entries: "entrees",
    exits: "sorties",
    language: "Langue",
    french: "Francais",
    arabic: "Arabe",
    theme: "Theme",
    light: "Clair",
    dark: "Sombre",
    profile: "Profil",
    welcome_back: "Bienvenue",
    real_time: "Temps Reel",
    live: "En Direct",
    system: "Systeme",
  },
  ar: {
    // App
    app_name: "PortFlow Elite",
    app_tagline: "نظام ذكي لإدارة الوصول إلى الموانئ",
    
    // Auth
    login: "تسجيل الدخول",
    login_title: "مرحبا بك",
    login_subtitle: "سجل دخولك إلى حسابك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    sign_in: "تسجيل الدخول",
    sign_out: "تسجيل الخروج",
    remember_me: "تذكرني",
    forgot_password: "نسيت كلمة المرور؟",
    
    // Navigation
    dashboard: "لوحة التحكم",
    bookings: "الحجوزات",
    slots: "الفترات الزمنية",
    ai_assistant: "مساعد ذكي",
    gate: "البوابة",
    fleet: "الأسطول",
    drivers: "السائقون",
    carriers: "الناقلون",
    operators: "المشغلون",
    terminals: "المحطات",
    audit_logs: "سجل المراجعة",
    settings: "الإعدادات",
    ports: "الموانئ",
    notifications: "الإشعارات",
    
    // Dashboard
    total_bookings_today: "حجوزات اليوم",
    active_trucks: "الشاحنات النشطة",
    gate_entries_today: "دخول البوابة",
    capacity_utilization: "استخدام السعة",
    hourly_traffic: "حركة المرور بالساعة",
    terminal_occupancy: "إشغال المحطات",
    recent_activity: "النشاط الأخير",
    quick_actions: "إجراءات سريعة",
    
    // Bookings
    new_booking: "حجز جديد",
    booking_id: "رقم الحجز",
    booking_status: "الحالة",
    booking_date: "التاريخ",
    booking_slot: "الفترة",
    booking_truck: "الشاحنة",
    booking_terminal: "المحطة",
    confirmed: "مؤكد",
    pending: "قيد الانتظار",
    consumed: "مستهلك",
    cancelled: "ملغي",
    rejected: "مرفوض",
    cancel_booking: "إلغاء الحجز",
    view_qr: "عرض رمز QR",
    
    // Slots
    slot_availability: "توفر الفترات",
    available: "متاح",
    booked: "محجوز",
    locked: "مقفل",
    capacity: "السعة",
    select_date: "اختر التاريخ",
    select_terminal: "اختر المحطة",
    
    // AI
    ai_title: "المساعد الذكي",
    ai_placeholder: "اسأل عن توفر الفترات الزمنية...",
    ai_greeting: "مرحبا! أنا المساعد الذكي لـ PortFlow. كيف يمكنني مساعدتك؟",
    ai_suggestion_1: "هل يوجد مكان في المحطة أ غدا 8-10 صباحا؟",
    ai_suggestion_2: "ما هي الفترات المتاحة هذا الأسبوع؟",
    ai_suggestion_3: "احجز 3 شاحنات للفترة 9-10 صباحا",
    book_now: "احجز الآن",
    
    // Gate
    gate_title: "التحقق من البوابة",
    gate_subtitle: "امسح أو أدخل رمز QR",
    scan_qr: "مسح QR",
    enter_qr: "إدخال رمز QR",
    validate: "تحقق",
    gate_opened: "البوابة مفتوحة",
    gate_denied: "تم رفض الوصول",
    gate_success_msg: "الشاحنة مسموح لها بالدخول",
    gate_error_msg: "رمز QR غير صالح أو منتهي الصلاحية",
    
    // Fleet
    truck_plate: "رقم اللوحة",
    truck_model: "الموديل",
    truck_status: "الحالة",
    add_truck: "إضافة شاحنة",
    available_status: "متاح",
    in_use: "قيد الاستخدام",
    maintenance: "صيانة",
    suspended: "موقوف",
    
    // Drivers
    driver_name: "اسم السائق",
    driver_license: "رخصة القيادة",
    driver_status: "الحالة",
    add_driver: "إضافة سائق",
    active: "نشط",
    
    // Audit
    audit_title: "سجل المراجعة",
    audit_actor: "الفاعل",
    audit_action: "الإجراء",
    audit_entity: "الكيان",
    audit_time: "الوقت",
    audit_details: "التفاصيل",
    
    // Common
    search: "بحث...",
    filter: "تصفية",
    export: "تصدير",
    refresh: "تحديث",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    view: "عرض",
    close: "إغلاق",
    loading: "جار التحميل...",
    no_results: "لا توجد نتائج",
    total: "المجموع",
    status: "الحالة",
    actions: "الإجراءات",
    date: "التاريخ",
    time: "الوقت",
    today: "اليوم",
    this_week: "هذا الأسبوع",
    this_month: "هذا الشهر",
    all: "الكل",
    showing: "عرض",
    of: "من",
    results: "نتائج",
    entries: "دخول",
    exits: "خروج",
    language: "اللغة",
    french: "الفرنسية",
    arabic: "العربية",
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    profile: "الملف الشخصي",
    welcome_back: "مرحبا بعودتك",
    real_time: "الوقت الحقيقي",
    live: "مباشر",
    system: "النظام",
  },
} as const

export type TranslationKey = keyof typeof translations.fr

interface I18nContextType {
  lang: Language
  dir: 'ltr' | 'rtl'
  setLang: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('fr')
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr')
      document.documentElement.setAttribute('lang', newLang)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
  }, [dir, lang])

  const t = useCallback((key: TranslationKey): string => {
    return translations[lang][key] || key
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
