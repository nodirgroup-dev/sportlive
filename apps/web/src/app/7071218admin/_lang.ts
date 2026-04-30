'use client';
import { useEffect, useState } from 'react';

export const ADMIN_LANGS = ['uz', 'ru', 'en'] as const;
export type AdminLang = (typeof ADMIN_LANGS)[number];

const STORAGE_KEY = 'sl_admin_lang';
const EVENT = 'sl:adminLang';

export function readAdminLang(): AdminLang {
  if (typeof window === 'undefined') return 'ru';
  try {
    const v = (localStorage.getItem(STORAGE_KEY) ?? '').toLowerCase();
    if (v === 'uz' || v === 'ru' || v === 'en') return v;
  } catch {
    // ignore
  }
  return 'ru';
}

export function writeAdminLang(lang: AdminLang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.dataset.adminLang = lang;
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { lang } }));
  } catch {
    // ignore
  }
}

/**
 * Subscribes to admin-language changes. Components that render translated
 * labels read this and re-render when the user clicks RU/UZ/EN in the topbar.
 */
export function useAdminLang(): AdminLang {
  const [lang, setLang] = useState<AdminLang>('ru');
  useEffect(() => {
    setLang(readAdminLang());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.lang) setLang(detail.lang as AdminLang);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return lang;
}

// =================== Translations ===================

export type AdminStrings = {
  // Topbar
  searchPlaceholder: string;
  notifications: string;
  noNotifications: string;
  toModeration: string;
  settings: string;
  openSite: string;
  logout: string;
  changeTheme: string;
  // Sidebar sections
  sec_main: string;
  sec_content: string;
  sec_sport: string;
  sec_community: string;
  sec_marketing: string;
  sec_analytics: string;
  sec_system: string;
  // Sidebar items
  nav_dashboard: string;
  nav_news: string;
  nav_calendar: string;
  nav_categories: string;
  nav_static: string;
  nav_media: string;
  nav_matches: string;
  nav_live: string;
  nav_standings: string;
  nav_teams: string;
  nav_comments: string;
  nav_users: string;
  nav_authors: string;
  nav_push: string;
  nav_newsletter: string;
  nav_rss: string;
  nav_banners: string;
  nav_analytics: string;
  nav_seo: string;
  nav_audit: string;
  nav_backups: string;
  nav_settings: string;
  // Crumbs labels (subset that show in breadcrumb)
  crumb_dashboard: string;
  crumb_news_new: string;
  crumb_news_edit: string;
  crumb_news: string;
  crumb_categories_new: string;
  crumb_categories_edit: string;
  crumb_categories: string;
  crumb_static_new: string;
  crumb_static_edit: string;
  crumb_static: string;
  crumb_media: string;
  crumb_matches: string;
  crumb_standings: string;
  crumb_teams: string;
  crumb_comments: string;
  crumb_users: string;
  crumb_authors: string;
  crumb_push: string;
  crumb_newsletter: string;
  crumb_rss: string;
  crumb_banners_new: string;
  crumb_banners_edit: string;
  crumb_banners: string;
  crumb_analytics: string;
  crumb_seo: string;
  crumb_settings: string;
  crumb_audit: string;
  crumb_backups: string;
  crumb_calendar: string;
  crumb_live: string;
  crumb_admin: string;
};

export const ADMIN_T: Record<AdminLang, AdminStrings> = {
  ru: {
    searchPlaceholder: 'Поиск по новостям…',
    notifications: 'Уведомления',
    noNotifications: 'Новых уведомлений нет',
    toModeration: 'К комментариям на модерации →',
    settings: 'Настройки',
    openSite: 'Открыть сайт',
    logout: 'Выйти',
    changeTheme: 'Сменить тему',
    sec_main: 'Главная',
    sec_content: 'Контент',
    sec_sport: 'Спорт',
    sec_community: 'Сообщество',
    sec_marketing: 'Маркетинг',
    sec_analytics: 'Аналитика',
    sec_system: 'Система',
    nav_dashboard: 'Дашборд',
    nav_news: 'Новости',
    nav_calendar: 'Календарь',
    nav_categories: 'Категории',
    nav_static: 'Статические страницы',
    nav_media: 'Медиатека',
    nav_matches: 'Матчи',
    nav_live: 'Live blog',
    nav_standings: 'Турнирные таблицы',
    nav_teams: 'Команды',
    nav_comments: 'Комментарии',
    nav_users: 'Пользователи',
    nav_authors: 'Авторы',
    nav_push: 'Push-уведомления',
    nav_newsletter: 'Email рассылка',
    nav_rss: 'RSS импорт',
    nav_banners: 'Баннеры',
    nav_analytics: 'Аналитика',
    nav_seo: 'SEO',
    nav_audit: 'Журнал действий',
    nav_backups: 'Бэкапы',
    nav_settings: 'Настройки',
    crumb_dashboard: 'Дашборд',
    crumb_news_new: 'Новая статья',
    crumb_news_edit: 'Редактирование статьи',
    crumb_news: 'Новости',
    crumb_categories_new: 'Новая категория',
    crumb_categories_edit: 'Редактирование категории',
    crumb_categories: 'Категории',
    crumb_static_new: 'Новая страница',
    crumb_static_edit: 'Редактирование страницы',
    crumb_static: 'Статические страницы',
    crumb_media: 'Медиатека',
    crumb_matches: 'Матчи',
    crumb_standings: 'Турнирные таблицы',
    crumb_teams: 'Команды',
    crumb_comments: 'Комментарии',
    crumb_users: 'Пользователи',
    crumb_authors: 'Авторы',
    crumb_push: 'Push-уведомления',
    crumb_newsletter: 'Email рассылка',
    crumb_rss: 'RSS импорт',
    crumb_banners_new: 'Новый баннер',
    crumb_banners_edit: 'Редактирование баннера',
    crumb_banners: 'Баннеры',
    crumb_analytics: 'Аналитика',
    crumb_seo: 'SEO',
    crumb_settings: 'Настройки',
    crumb_audit: 'Журнал действий',
    crumb_backups: 'Бэкапы',
    crumb_calendar: 'Календарь',
    crumb_live: 'Live blog',
    crumb_admin: 'Админка',
  },
  uz: {
    searchPlaceholder: 'Yangiliklar boʻyicha qidiruv…',
    notifications: 'Bildirishnomalar',
    noNotifications: 'Yangi bildirishnomalar yoʻq',
    toModeration: 'Moderatsiyadagi izohlarga →',
    settings: 'Sozlamalar',
    openSite: 'Saytni ochish',
    logout: 'Chiqish',
    changeTheme: 'Mavzuni almashtirish',
    sec_main: 'Asosiy',
    sec_content: 'Kontent',
    sec_sport: 'Sport',
    sec_community: 'Hamjamiyat',
    sec_marketing: 'Marketing',
    sec_analytics: 'Analitika',
    sec_system: 'Tizim',
    nav_dashboard: 'Boshqaruv paneli',
    nav_news: 'Yangiliklar',
    nav_calendar: 'Kalendar',
    nav_categories: 'Kategoriyalar',
    nav_static: 'Statik sahifalar',
    nav_media: 'Mediakitoblar',
    nav_matches: 'Oʻyinlar',
    nav_live: 'Jonli blog',
    nav_standings: 'Turnir jadvallari',
    nav_teams: 'Jamoalar',
    nav_comments: 'Izohlar',
    nav_users: 'Foydalanuvchilar',
    nav_authors: 'Mualliflar',
    nav_push: 'Push-bildirishnomalar',
    nav_newsletter: 'Email yuborish',
    nav_rss: 'RSS import',
    nav_banners: 'Bannerlar',
    nav_analytics: 'Analitika',
    nav_seo: 'SEO',
    nav_audit: 'Harakatlar jurnali',
    nav_backups: 'Zaxira nusxalar',
    nav_settings: 'Sozlamalar',
    crumb_dashboard: 'Boshqaruv paneli',
    crumb_news_new: 'Yangi maqola',
    crumb_news_edit: 'Maqolani tahrirlash',
    crumb_news: 'Yangiliklar',
    crumb_categories_new: 'Yangi kategoriya',
    crumb_categories_edit: 'Kategoriyani tahrirlash',
    crumb_categories: 'Kategoriyalar',
    crumb_static_new: 'Yangi sahifa',
    crumb_static_edit: 'Sahifani tahrirlash',
    crumb_static: 'Statik sahifalar',
    crumb_media: 'Mediakitoblar',
    crumb_matches: 'Oʻyinlar',
    crumb_standings: 'Turnir jadvallari',
    crumb_teams: 'Jamoalar',
    crumb_comments: 'Izohlar',
    crumb_users: 'Foydalanuvchilar',
    crumb_authors: 'Mualliflar',
    crumb_push: 'Push-bildirishnomalar',
    crumb_newsletter: 'Email yuborish',
    crumb_rss: 'RSS import',
    crumb_banners_new: 'Yangi banner',
    crumb_banners_edit: 'Bannerni tahrirlash',
    crumb_banners: 'Bannerlar',
    crumb_analytics: 'Analitika',
    crumb_seo: 'SEO',
    crumb_settings: 'Sozlamalar',
    crumb_audit: 'Harakatlar jurnali',
    crumb_backups: 'Zaxira nusxalar',
    crumb_calendar: 'Kalendar',
    crumb_live: 'Jonli blog',
    crumb_admin: 'Admin',
  },
  en: {
    searchPlaceholder: 'Search news…',
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
    toModeration: 'To pending comments →',
    settings: 'Settings',
    openSite: 'Open site',
    logout: 'Sign out',
    changeTheme: 'Toggle theme',
    sec_main: 'Main',
    sec_content: 'Content',
    sec_sport: 'Sport',
    sec_community: 'Community',
    sec_marketing: 'Marketing',
    sec_analytics: 'Analytics',
    sec_system: 'System',
    nav_dashboard: 'Dashboard',
    nav_news: 'News',
    nav_calendar: 'Calendar',
    nav_categories: 'Categories',
    nav_static: 'Static pages',
    nav_media: 'Media library',
    nav_matches: 'Matches',
    nav_live: 'Live blog',
    nav_standings: 'Standings',
    nav_teams: 'Teams',
    nav_comments: 'Comments',
    nav_users: 'Users',
    nav_authors: 'Authors',
    nav_push: 'Push notifications',
    nav_newsletter: 'Newsletter',
    nav_rss: 'RSS import',
    nav_banners: 'Banners',
    nav_analytics: 'Analytics',
    nav_seo: 'SEO',
    nav_audit: 'Audit log',
    nav_backups: 'Backups',
    nav_settings: 'Settings',
    crumb_dashboard: 'Dashboard',
    crumb_news_new: 'New article',
    crumb_news_edit: 'Edit article',
    crumb_news: 'News',
    crumb_categories_new: 'New category',
    crumb_categories_edit: 'Edit category',
    crumb_categories: 'Categories',
    crumb_static_new: 'New page',
    crumb_static_edit: 'Edit page',
    crumb_static: 'Static pages',
    crumb_media: 'Media library',
    crumb_matches: 'Matches',
    crumb_standings: 'Standings',
    crumb_teams: 'Teams',
    crumb_comments: 'Comments',
    crumb_users: 'Users',
    crumb_authors: 'Authors',
    crumb_push: 'Push notifications',
    crumb_newsletter: 'Newsletter',
    crumb_rss: 'RSS import',
    crumb_banners_new: 'New banner',
    crumb_banners_edit: 'Edit banner',
    crumb_banners: 'Banners',
    crumb_analytics: 'Analytics',
    crumb_seo: 'SEO',
    crumb_settings: 'Settings',
    crumb_audit: 'Audit log',
    crumb_backups: 'Backups',
    crumb_calendar: 'Calendar',
    crumb_live: 'Live blog',
    crumb_admin: 'Admin',
  },
};
