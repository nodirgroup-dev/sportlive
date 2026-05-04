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
  // ----- Common actions / labels -----
  save: string;
  saved: string;
  cancel: string;
  edit: string;
  delete: string;
  apply: string;
  add: string;
  create: string;
  search: string;
  remove: string;
  enable: string;
  disable: string;
  yes: string;
  no: string;
  all: string;
  status: string;
  language: string;
  category: string;
  title: string;
  body: string;
  summary: string;
  cover: string;
  tags: string;
  slug: string;
  date: string;
  author: string;
  email: string;
  password: string;
  loading: string;
  empty: string;
  back: string;
  // Status pills
  status_draft: string;
  status_scheduled: string;
  status_published: string;
  status_archived: string;
  // Filters
  all_locales: string;
  all_statuses: string;
  // News form
  news_title_label: string;
  news_slug_label: string;
  news_summary_label: string;
  news_summary_hint: string;
  news_body_label: string;
  news_status_label: string;
  news_publishedAt_label: string;
  news_publishedAt_hint: string;
  news_locale_label: string;
  news_category_label: string;
  news_cover_label: string;
  news_featured_label: string;
  news_featured_hint: string;
  news_sendpush_label: string;
  news_sendpush_hint: string;
  news_tags_label: string;
  news_shortcodes_hint: string;
  news_alt_hint: string;
  news_create_btn: string;
  news_save_btn: string;
  news_history_btn: string;
  news_search_placeholder: string;
  // Login
  login_title: string;
  login_sub: string;
  login_submit: string;
  login_err_invalid: string;
  login_err_empty: string;
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
  // ----- Generic form labels -----
  form_internal_name: string;
  form_image_url: string;
  form_link_url: string;
  form_alt_text: string;
  form_html_snippet: string;
  form_position: string;
  form_sort_order: string;
  form_active: string;
  form_slug_from_name: string;
  form_description_seo: string;
  form_parent_category: string;
  form_no_parent: string;
  form_sort_order_long: string;
  form_url_slug: string;
  form_short_description: string;
  form_body_html: string;
  form_meta_title: string;
  form_meta_description: string;
  form_footer_sort_order: string;
  form_show_in_footer: string;
  form_uzbek: string;
  form_russian: string;
  form_english: string;
  // Banner positions
  pos_header: string;
  pos_sidebar: string;
  pos_in_article_top: string;
  pos_in_article_bottom: string;
  pos_footer: string;
  // Form sub-text (under H1)
  banner_new_sub: string;
  cat_new_sub: string;
  static_new_sub: string;
  // Per-page translations bar
  translations_label: string;
  translation_create: string;
  translation_current: string;
  translation_missing_hint: string;
  // ----- Bulk action / news list -----
  bulk_action_label: string;
  bulk_action_choose: string;
  bulk_publish: string;
  bulk_unpublish: string;
  bulk_archive: string;
  bulk_apply_to_selected: string;
  bulk_hint_checkboxes: string;
  bulk_done_publish: string;
  bulk_done_unpublish: string;
  bulk_done_archive: string;
  bulk_done_delete: string;
  news_create_article_btn: string;
  news_count_articles: string;
  news_empty_filtered: string;
  news_pin_homepage: string;
  news_unpin_homepage: string;
  news_pinned_homepage_title: string;
  news_unpublish_action: string;
  news_publish_action: string;
  news_duplicate: string;
  // ----- Table headers -----
  th_id: string;
  th_photo: string;
  th_logo: string;
  th_league: string;
  th_type: string;
  th_country: string;
  th_season: string;
  th_preview: string;
  th_name: string;
  th_position: string;
  th_role: string;
  th_verified: string;
  th_created: string;
  th_url: string;
  th_in_footer: string;
  th_team: string;
  th_team_home: string;
  th_file: string;
  th_target: string;
  th_action: string;
  th_when: string;
  th_actor: string;
  th_object: string;
  th_ip: string;
  th_revision_title: string;
  th_name_url: string;
  th_parent: string;
  th_description: string;
  th_views: string;
  th_published: string;
  th_open: string;
  th_email_user: string;
  th_matches: string;
  th_impressions: string;
  th_clicks: string;
  th_enabled_short: string;
  th_ai: string;
  th_last_import: string;
  th_score: string;
  th_articles_short: string;
  th_subscribed: string;
  th_unsubscribed: string;
  th_entries: string;
  th_size: string;
  empty_no_records: string;
  // ----- Audit -----
  audit_search_placeholder: string;
  audit_action_placeholder: string;
  audit_entity_placeholder: string;
  audit_count_suffix: string;
  // ----- Settings -----
  settings_account: string;
  settings_name: string;
  settings_role: string;
  settings_change_password: string;
  settings_password_updated: string;
  settings_current_password: string;
  settings_new_password: string;
  settings_confirm_password: string;
  settings_update_password: string;
  settings_site_info: string;
  settings_url: string;
  settings_site_name: string;
  settings_supported_langs: string;
  settings_cache_strategy: string;
  settings_cache_strategy_text: string;
  settings_external_feeds: string;
  settings_err_empty: string;
  settings_err_weak: string;
  settings_err_mismatch: string;
  settings_err_wrong: string;
  // ----- Comments -----
  comments_pending: string;
  comments_approved: string;
  comments_spam: string;
  comments_rejected: string;
  comments_no_in_tab: string;
  comments_anonymous: string;
  comments_to_post: string;
  comments_approve_btn: string;
  comments_spam_btn: string;
  comments_no_title: string;
  comments_no_sub: string;
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

// =================== Per-page info banners ===================

export type PageInfoEntry = { title: string; sub?: string; info: string };
export type PageId =
  | 'dashboard'
  | 'news'
  | 'news_new'
  | 'news_edit'
  | 'news_revisions'
  | 'calendar'
  | 'categories'
  | 'static'
  | 'media'
  | 'matches'
  | 'live'
  | 'standings'
  | 'teams'
  | 'comments'
  | 'users'
  | 'authors'
  | 'push'
  | 'newsletter'
  | 'rss'
  | 'banners'
  | 'analytics'
  | 'seo'
  | 'audit'
  | 'backups'
  | 'settings';

export const PAGE_INFO: Record<AdminLang, Record<PageId, PageInfoEntry>> = {
  ru: {
    dashboard: { title: 'Дашборд', sub: 'Обзор контента и аудитории', info: 'Сводка по сайту: просмотры, очередь модерации, подписки, ТОП-статьи. Сюда смотрите утром, чтобы понять, что нужно срочно сделать.' },
    news: { title: 'Новости', info: 'Все статьи во всех языках. Здесь можно создать новую, опубликовать, закрепить на главной, продублировать, или массово обработать выделенные.' },
    news_new: { title: 'Новая статья', info: 'Заголовок, лид и тело — обязательные поля. Если оставить лид пустым, он сгенерируется из первого абзаца. Шорткоды [fixture id=N], [team id=N], [youtube id=...], [tweet id=...], [bet match=N] заменяются на карточки на сайте.' },
    news_edit: { title: 'Редактирование статьи', info: 'Все изменения сохраняются как новая ревизия — можно откатить через «История». Чтобы запланировать публикацию, поставьте статус «Запланировать» и укажите дату.' },
    news_revisions: { title: 'История изменений', info: 'Снимки тела/заголовка перед каждым сохранением. «Восстановить» сначала сохранит текущую версию (откат сам обратим), затем вернёт выбранную.' },
    calendar: { title: 'Календарь', info: 'Все опубликованные и запланированные статьи по дням. Цветная полоска слева: зелёный — опубликовано, оранжевый — запланировано, серый — черновик.' },
    categories: { title: 'Категории', info: 'Иерархия рубрик. Slug категории формирует URL статьи, поэтому переименование сломает существующие ссылки — используйте редиректы.' },
    static: { title: 'Статические страницы', info: 'Страницы вроде «О сайте» или «Политика конфиденциальности». Включите «Показать в подвале», чтобы ссылка появилась внизу сайта.' },
    media: { title: 'Медиатека', info: 'Загруженные изображения. Все картинки автоматически конвертируются в WebP и уменьшаются до 1600px ширины при загрузке.' },
    matches: { title: 'Матчи', info: 'Календарь матчей из API-Football. Cron «*/30 * * * *» обновляет статус и счёт. Откройте матч, чтобы вести live-блог.' },
    live: { title: 'Live blog', info: 'Список ближайших матчей с количеством записей. Откройте, чтобы добавлять минутные комментарии: гол, карточки, замены.' },
    standings: { title: 'Турнирные таблицы', info: 'Текущие таблицы лиг (премьер-лига, ла лига и т.д.). Cron «15 */6 * * *» обновляет очки и места.' },
    teams: { title: 'Команды', info: 'Команды из API-Football. Логотип, страна, год основания и стадион подтягиваются автоматически. Cron «0 4 * * 0» обновляет данные.' },
    comments: { title: 'Комментарии', info: 'Очередь модерации. AI-фильтр автоматически помечает спам (score ≥ 80) и одобряет чистые (< 30). Между ними — на ручной модерации.' },
    users: { title: 'Пользователи', info: 'Учётные записи администраторов и редакторов. Роль admin может всё, editor — публиковать, author — только свои статьи.' },
    authors: { title: 'Авторы', info: 'Метрики продуктивности авторов: за 7 дней, всего опубликовано, суммарные просмотры. Биографии и аватары видны на странице автора.' },
    push: { title: 'Push-уведомления', info: 'Активные подписчики на push в браузере. Кнопка «Отправить» рассылает уведомление с заголовком и обложкой статьи на их устройства.' },
    newsletter: { title: 'Email рассылка', info: 'Подписчики на еженедельный дайджест. Cron «0 9 * * 1» (понедельник 9:00) рассылает письма. Кнопка «Экспорт CSV» — скачать список.' },
    rss: { title: 'RSS импорт', info: 'Импорт статей из RSS-источников конкурентов в виде черновиков. Если включён AI — текст переписывается через Claude, чтобы избежать дублирования.' },
    banners: { title: 'Баннеры', info: 'Рекламные блоки. Позиции: header, sidebar, in_article_top/bottom. Можно загрузить картинку или вставить HTML (для AdSense слотов).' },
    analytics: { title: 'Аналитика', info: 'Метрики просмотров, источников трафика, популярных статей. Подтягивается из Cloudflare Web Analytics, если настроен токен.' },
    seo: { title: 'SEO', info: 'Карта сайта, sitemap.xml, RSS, Google News XML, robots.txt — статус генерации и индекс покрытия.' },
    audit: { title: 'Журнал действий', info: 'Все действия редакторов: публикации, удаления, модерация комментариев, push-рассылки, входы в систему. Используйте поиск, чтобы найти конкретное действие.' },
    backups: { title: 'Бэкапы', info: 'Ежедневные дампы базы (cron «30 3 * * *»). Хранятся 14 дней локально на VPS. Если настроен offsite-target, дублируются на S3/B2/rsync.' },
    settings: { title: 'Настройки', info: 'Глобальные параметры сайта: название, описание, контакты, ключи API. Изменения применяются после перезапуска контейнера.' },
  },
  uz: {
    dashboard: { title: 'Boshqaruv paneli', sub: 'Kontent va auditoriya umumiy ko‘rinishi', info: 'Sayt bo‘yicha umumiy: ko‘rishlar, moderatsiya navbati, obunalar, eng ko‘p o‘qilgan maqolalar. Ertalab nimaga e’tibor berish kerakligini ko‘rish uchun shu yerga kiring.' },
    news: { title: 'Yangiliklar', info: 'Barcha tilllardagi maqolalar. Yangi maqola yaratish, nashr etish, bosh sahifaga biriktirish, dublikat qilish yoki tanlanganlarni ommaviy boshqarish.' },
    news_new: { title: 'Yangi maqola', info: 'Sarlavha, lid va asosiy matn — majburiy. Lidni bo‘sh qoldirsangiz, birinchi xatboshidan avtomatik olinadi. Shortcodelar: [fixture id=N], [team id=N], [youtube id=...], [tweet id=...], [bet match=N] saytda kartochkalarga aylanadi.' },
    news_edit: { title: 'Maqolani tahrirlash', info: 'Har bir saqlash yangi reviziya yaratadi — «Tarix» orqali qaytarish mumkin. Nashrni rejalashtirish uchun statusni «Запланировать»ga qo‘ying va sanani belgilang.' },
    news_revisions: { title: 'Tahrirlar tarixi', info: 'Har saqlashdan oldingi tan/sarlavha snapshotlari. «Qayta tiklash» avval joriy versiyani saqlaydi (qaytarish ham reversible), keyin tanlanganini tiklaydi.' },
    calendar: { title: 'Kalendar', info: 'Barcha nashr qilingan va rejalashtirilgan maqolalar kun bo‘yicha. Chap chiziq rangi: yashil — nashr qilingan, sariq — rejalashtirilgan, kulrang — qoralama.' },
    categories: { title: 'Kategoriyalar', info: 'Rubrikalar ierarxiyasi. Kategoriya slug-i maqola URL’ini shakllantiradi, shu sababli nomini o‘zgartirish eski havolalarni buzadi — redirektlardan foydalaning.' },
    static: { title: 'Statik sahifalar', info: 'Sayt haqida yoki Maxfiylik siyosati kabi sahifalar. Saytning quyi qismida ko‘rinishi uchun «Подвалда ko‘rsatish»ni yoqing.' },
    media: { title: 'Mediakitoblar', info: 'Yuklangan rasmlar. Barcha rasmlar avtomatik WebP formatiga o‘tkaziladi va 1600px gacha kichraytiriladi.' },
    matches: { title: 'O‘yinlar', info: 'API-Football’dan o‘yin kalendari. Cron «*/30 * * * *» status va hisobni yangilaydi. Live blog yuritish uchun matchni oching.' },
    live: { title: 'Jonli blog', info: 'Yaqin o‘yinlar va yozuvlar soni. Daqiqalik sharhlar qo‘shish uchun matchni oching: gol, kartochkalar, almashuvlar.' },
    standings: { title: 'Turnir jadvallari', info: 'Liga jadvallari (Premier liga, La liga va h.k.). Cron «15 */6 * * *» ochkolar va o‘rinlarni yangilaydi.' },
    teams: { title: 'Jamoalar', info: 'API-Football’dan jamoalar. Logotip, mamlakat, asos solingan yili va stadion avtomatik tortiladi. Cron «0 4 * * 0» ma’lumotni yangilaydi.' },
    comments: { title: 'Izohlar', info: 'Moderatsiya navbati. AI-filtr avtomatik spam belgilaydi (score ≥ 80) va toza bo‘lganlarni tasdiqlaydi (< 30). Oraliqdagilar — qo‘l moderatsiyasida.' },
    users: { title: 'Foydalanuvchilar', info: 'Adminstratorlar va muharrirlar. admin roli — barchasi mumkin, editor — nashr etish, author — faqat o‘z maqolalari.' },
    authors: { title: 'Mualliflar', info: 'Mualliflarning produktivlik metriklari: 7 kunda, jami nashr qilingan, jami ko‘rishlar. Bio va avatar sayt muallif sahifasida ko‘rinadi.' },
    push: { title: 'Push-bildirishnomalar', info: 'Brauzerda push uchun faol obunachilar. «Yuborish» tugmasi maqola sarlavhasi va muqovasini ularning qurilmasiga yuboradi.' },
    newsletter: { title: 'Email yuborish', info: 'Haftalik dayjest obunachilari. Cron «0 9 * * 1» (Du 9:00) yuboradi. «CSV eksport» tugmasi ro‘yxatni yuklaydi.' },
    rss: { title: 'RSS import', info: 'Raqobatchilar RSS’idan maqolalarni qoralama sifatida import qilish. AI yoqilgan bo‘lsa — matn Claude orqali qayta yoziladi.' },
    banners: { title: 'Bannerlar', info: 'Reklama bloklari. Pozitsiyalar: header, sidebar, in_article_top/bottom. Rasm yuklash yoki HTML (AdSense slotlari uchun) qo‘yish mumkin.' },
    analytics: { title: 'Analitika', info: 'Ko‘rishlar, trafik manbalari, mashhur maqolalar. Cloudflare Web Analytics token sozlangan bo‘lsa, undan tortiladi.' },
    seo: { title: 'SEO', info: 'Sayt xaritasi, sitemap.xml, RSS, Google News XML, robots.txt — generatsiya holati va indekslash qoplama.' },
    audit: { title: 'Harakatlar jurnali', info: 'Muharrirlar barcha harakatlari: nashr, o‘chirish, izoh moderatsiyasi, push yuborish, kirishlar. Aniq harakatni topish uchun qidiruvdan foydalaning.' },
    backups: { title: 'Zaxira nusxalar', info: 'Bazaning kunlik dampi (cron «30 3 * * *»). VPS’da 14 kun saqlanadi. Offsite-target sozlangan bo‘lsa, S3/B2/rsync’ga ham yuboriladi.' },
    settings: { title: 'Sozlamalar', info: 'Sayt umumiy parametrlari: nom, tavsif, aloqalar, API kalitlar. O‘zgarishlar konteyner qayta ishga tushgandan keyin qo‘llaniladi.' },
  },
  en: {
    dashboard: { title: 'Dashboard', sub: 'Content & audience overview', info: 'Site-wide summary: views, moderation queue, subscriptions, top stories. Check here in the morning to see what needs attention.' },
    news: { title: 'News', info: 'All articles across all locales. Create new ones, publish, pin to homepage, duplicate, or run bulk actions on selections.' },
    news_new: { title: 'New article', info: 'Title, lede and body are required. If you leave the lede empty, the first paragraph is used. Shortcodes [fixture id=N], [team id=N], [youtube id=...], [tweet id=...], [bet match=N] render rich cards on the public site.' },
    news_edit: { title: 'Edit article', info: 'Every save creates a revision — roll back via "History". To schedule publication, set status to "Schedule" and pick a date.' },
    news_revisions: { title: 'Revision history', info: 'Snapshots of body/title before each save. "Restore" first snapshots the current version (so restore is reversible), then applies the chosen one.' },
    calendar: { title: 'Calendar', info: 'All published & scheduled articles by day. Left stripe colour: green — published, amber — scheduled, gray — draft.' },
    categories: { title: 'Categories', info: 'Section hierarchy. Category slug shapes the article URL, so renaming will break old links — use redirects.' },
    static: { title: 'Static pages', info: 'Pages like "About" or "Privacy". Toggle "Show in footer" to surface the link at the bottom of the public site.' },
    media: { title: 'Media library', info: 'Uploaded images. All uploads are auto-converted to WebP and resized to 1600px wide.' },
    matches: { title: 'Matches', info: 'Fixture calendar from API-Football. Cron "*/30 * * * *" updates status and score. Open a match to run a live blog.' },
    live: { title: 'Live blog', info: 'Upcoming matches with entry counts. Open a match to post minute-by-minute commentary: goals, cards, subs.' },
    standings: { title: 'Standings', info: 'Current league tables (Premier League, La Liga…). Cron "15 */6 * * *" updates points and positions.' },
    teams: { title: 'Teams', info: 'Teams from API-Football. Logo, country, founding year and stadium are auto-pulled. Cron "0 4 * * 0" refreshes metadata.' },
    comments: { title: 'Comments', info: 'Moderation queue. AI filter marks spam (score ≥ 80) and auto-approves clean ones (< 30). Anything in between waits for human review.' },
    users: { title: 'Users', info: 'Admin and editor accounts. admin can do anything, editor can publish, author can manage their own articles only.' },
    authors: { title: 'Authors', info: 'Author productivity metrics: last 7 days, total published, total views. Bios & avatars show on the public author page.' },
    push: { title: 'Push notifications', info: 'Active browser-push subscribers. "Send" pushes a notification with the article title and cover image to their devices.' },
    newsletter: { title: 'Newsletter', info: 'Weekly digest subscribers. Cron "0 9 * * 1" (Mon 9:00) sends the digest. "Export CSV" downloads the list.' },
    rss: { title: 'RSS import', info: 'Import articles from competitor RSS feeds as drafts. If AI is enabled, text is rewritten via Claude to avoid duplication.' },
    banners: { title: 'Banners', info: 'Ad slots. Positions: header, sidebar, in_article_top/bottom. Upload an image or paste HTML (for AdSense slots).' },
    analytics: { title: 'Analytics', info: 'Pageviews, traffic sources, top stories. Pulled from Cloudflare Web Analytics if a token is configured.' },
    seo: { title: 'SEO', info: 'Sitemap, sitemap.xml, RSS, Google News XML, robots.txt — generation status and indexing coverage.' },
    audit: { title: 'Audit log', info: 'Every editor action: publishes, deletes, comment moderation, push broadcasts, sign-ins. Use search to find a specific action.' },
    backups: { title: 'Backups', info: 'Daily DB dumps (cron "30 3 * * *"). Kept 14 days locally on VPS. If an offsite target is set, also pushed to S3/B2/rsync.' },
    settings: { title: 'Settings', info: 'Site-wide parameters: name, description, contacts, API keys. Changes apply after the container restarts.' },
  },
};

export const ADMIN_T: Record<AdminLang, AdminStrings> = {
  ru: {
    save: 'Сохранить',
    saved: 'Сохранено',
    cancel: 'Отмена',
    edit: 'Изменить',
    delete: 'Удалить',
    apply: 'Применить',
    add: 'Добавить',
    create: 'Создать',
    search: 'Поиск',
    remove: 'Удалить',
    enable: 'Включить',
    disable: 'Отключить',
    yes: 'Да',
    no: 'Нет',
    all: 'Все',
    status: 'Статус',
    language: 'Язык',
    category: 'Категория',
    title: 'Заголовок',
    body: 'Тело',
    summary: 'Лид',
    cover: 'Обложка',
    tags: 'Теги',
    slug: 'URL-slug',
    date: 'Дата',
    author: 'Автор',
    email: 'Email',
    password: 'Пароль',
    loading: 'Загрузка…',
    empty: 'Нет данных',
    back: 'Назад',
    status_draft: 'Черновик',
    status_scheduled: 'Запланировано',
    status_published: 'Опубликовано',
    status_archived: 'В архиве',
    all_locales: 'Все языки',
    all_statuses: 'Все статусы',
    news_title_label: 'Заголовок',
    news_slug_label: 'URL-slug (опционально, генерируется из заголовка)',
    news_summary_label: 'Лид / краткое описание (HTML, опционально)',
    news_summary_hint: 'Если оставить пустым — автоматически возьмётся первый абзац статьи',
    news_body_label: 'Тело статьи',
    news_status_label: 'Статус',
    news_publishedAt_label: 'Дата публикации (для «Запланировать»)',
    news_publishedAt_hint: 'Если статус = «Запланировать», укажите будущую дату — cron автоматически опубликует',
    news_locale_label: 'Язык',
    news_category_label: 'Категория',
    news_cover_label: 'Обложка',
    news_featured_label: 'Закрепить на главной',
    news_featured_hint: 'Самая свежая закреплённая статья показывается как герой главной',
    news_sendpush_label: 'Отправить push после сохранения',
    news_sendpush_hint: 'Только если статья будет опубликована (status = published)',
    news_tags_label: 'Теги (через запятую)',
    news_shortcodes_hint: 'Шорткоды: [img]URL[/img] · [fixture id=N] · [team id=N] · [youtube id=ABC] · [tweet id=NNNN] · [bet match=N]',
    news_alt_hint: 'Alt-текст: вставленные изображения должны иметь описание — обязательно для SEO и accessibility',
    news_create_btn: 'Создать',
    news_save_btn: 'Сохранить',
    news_history_btn: 'История',
    news_search_placeholder: 'Поиск по заголовку…',
    login_title: 'Вход в админку',
    login_sub: 'Введите свои учётные данные.',
    login_submit: 'Войти',
    login_err_invalid: 'Неверный email или пароль',
    login_err_empty: 'Заполните все поля',
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
    form_internal_name: 'Название (внутреннее)',
    form_image_url: 'URL изображения',
    form_link_url: 'Ссылка при клике',
    form_alt_text: 'Alt-текст',
    form_html_snippet: 'HTML/JS-сниппет (опционально, например AdSense)',
    form_position: 'Позиция',
    form_sort_order: 'Порядок',
    form_active: 'Активен',
    form_slug_from_name: 'URL-slug (опционально, генерируется из названия)',
    form_description_seo: 'Описание (для SEO и страницы рубрики)',
    form_parent_category: 'Родительская категория',
    form_no_parent: '— нет —',
    form_sort_order_long: 'Порядок сортировки',
    form_url_slug: 'URL-slug',
    form_short_description: 'Краткое описание',
    form_body_html: 'Тело страницы (HTML)',
    form_meta_title: 'Meta title',
    form_meta_description: 'Meta description',
    form_footer_sort_order: 'Порядок в подвале',
    form_show_in_footer: 'Показать в подвале',
    form_uzbek: 'Узбекский',
    form_russian: 'Русский',
    form_english: 'English',
    pos_header: 'Шапка',
    pos_sidebar: 'Сайдбар',
    pos_in_article_top: 'В статье — сверху',
    pos_in_article_bottom: 'В статье — снизу',
    pos_footer: 'Подвал',
    banner_new_sub: 'Создание нового баннера',
    cat_new_sub: 'Создание новой рубрики',
    static_new_sub: 'Страница для подвала / служебная',
    translations_label: 'Переводы',
    translation_create: 'Создать перевод',
    translation_current: 'Текущая версия',
    translation_missing_hint: 'Сохраните страницу, потом можно создавать переводы',
    bulk_action_label: 'Массовое действие:',
    bulk_action_choose: '— выбрать —',
    bulk_publish: 'Опубликовать',
    bulk_unpublish: 'Снять с публикации',
    bulk_archive: 'В архив',
    bulk_apply_to_selected: 'Применить к выбранным',
    bulk_hint_checkboxes: 'Используйте чекбоксы в таблице',
    bulk_done_publish: 'Опубликовано',
    bulk_done_unpublish: 'Снято с публикации',
    bulk_done_archive: 'Перемещено в архив',
    bulk_done_delete: 'Удалено',
    news_create_article_btn: 'Создать статью',
    news_count_articles: 'статей',
    news_empty_filtered: 'Нет статей по выбранным фильтрам',
    news_pin_homepage: 'Закрепить на главной',
    news_unpin_homepage: 'Снять с главной',
    news_pinned_homepage_title: 'Закреплено на главной',
    news_unpublish_action: 'Снять с публикации',
    news_publish_action: 'Опубликовать',
    news_duplicate: 'Дублировать',
    th_id: 'ID',
    th_photo: 'Фото',
    th_logo: 'Лого',
    th_league: 'Турнир',
    th_type: 'Тип',
    th_country: 'Страна',
    th_season: 'Сезон',
    th_preview: 'Превью',
    th_name: 'Название',
    th_position: 'Позиция',
    th_role: 'Роль',
    th_verified: 'Подтверждён',
    th_created: 'Создан',
    th_url: 'URL',
    th_in_footer: 'В подвале',
    th_team: 'Команда',
    th_team_home: 'Команда (хозяева)',
    th_file: 'Файл',
    th_target: 'Назначение',
    th_action: 'Действие',
    th_when: 'Когда',
    th_actor: 'Автор',
    th_object: 'Объект',
    th_ip: 'IP',
    th_revision_title: 'Заголовок снапшота',
    th_name_url: 'Название / URL',
    th_parent: 'Родитель',
    th_description: 'Описание',
    th_views: 'Просмотры',
    th_published: 'Опубликован',
    th_open: 'Открыть',
    th_email_user: 'Email',
    th_matches: 'Матчей',
    th_impressions: 'Показы',
    th_clicks: 'Клики',
    th_enabled_short: 'Вкл',
    th_ai: 'AI',
    th_last_import: 'Послед. импорт',
    th_score: 'Счёт',
    th_articles_short: 'Статей',
    th_subscribed: 'Подписан',
    th_unsubscribed: 'Отписан',
    th_entries: 'Записей',
    th_size: 'Размер',
    empty_no_records: 'Записей нет',
    audit_search_placeholder: 'Поиск по описанию или автору…',
    audit_action_placeholder: 'action (post.publish)',
    audit_entity_placeholder: 'entity (post, comment)',
    audit_count_suffix: 'последних записей',
    settings_account: 'Аккаунт',
    settings_name: 'Имя',
    settings_role: 'Роль',
    settings_change_password: 'Изменить пароль',
    settings_password_updated: 'Пароль обновлён',
    settings_current_password: 'Текущий пароль',
    settings_new_password: 'Новый пароль (мин. 8 символов)',
    settings_confirm_password: 'Повторите новый пароль',
    settings_update_password: 'Обновить пароль',
    settings_site_info: 'Информация о сайте',
    settings_url: 'URL',
    settings_site_name: 'Название',
    settings_supported_langs: 'Поддерживаемые языки',
    settings_cache_strategy: 'Кеш-стратегия',
    settings_cache_strategy_text: 'Главная и категории — ISR 60 сек. Статьи — динамические. Cloudflare фронт-кэш.',
    settings_external_feeds: 'Внешние ленты',
    settings_err_empty: 'Заполните все поля',
    settings_err_weak: 'Минимум 8 символов',
    settings_err_mismatch: 'Новые пароли не совпадают',
    settings_err_wrong: 'Текущий пароль неверный',
    comments_pending: 'На модерации',
    comments_approved: 'Одобрены',
    comments_spam: 'Спам',
    comments_rejected: 'Отклонены',
    comments_no_in_tab: 'В этой вкладке пока ничего нет',
    comments_anonymous: 'Аноним',
    comments_to_post: 'К статье:',
    comments_approve_btn: 'Одобрить',
    comments_spam_btn: 'Спам',
    comments_no_title: 'Нет комментариев',
    comments_no_sub: 'В этой вкладке пока ничего нет',
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
    save: 'Saqlash',
    saved: 'Saqlandi',
    cancel: 'Bekor qilish',
    edit: 'Tahrirlash',
    delete: 'O‘chirish',
    apply: 'Qo‘llash',
    add: 'Qo‘shish',
    create: 'Yaratish',
    search: 'Qidirish',
    remove: 'O‘chirish',
    enable: 'Yoqish',
    disable: 'O‘chirish',
    yes: 'Ha',
    no: 'Yo‘q',
    all: 'Barchasi',
    status: 'Status',
    language: 'Til',
    category: 'Kategoriya',
    title: 'Sarlavha',
    body: 'Matn',
    summary: 'Lid',
    cover: 'Muqova',
    tags: 'Teglar',
    slug: 'URL-slug',
    date: 'Sana',
    author: 'Muallif',
    email: 'Email',
    password: 'Parol',
    loading: 'Yuklanmoqda…',
    empty: 'Ma’lumot yo‘q',
    back: 'Orqaga',
    status_draft: 'Qoralama',
    status_scheduled: 'Rejalashtirilgan',
    status_published: 'Nashr qilingan',
    status_archived: 'Arxivlangan',
    all_locales: 'Barcha tillar',
    all_statuses: 'Barcha statuslar',
    news_title_label: 'Sarlavha',
    news_slug_label: 'URL-slug (ixtiyoriy, sarlavhadan avtomatik shakllanadi)',
    news_summary_label: 'Lid / qisqa tavsif (HTML, ixtiyoriy)',
    news_summary_hint: 'Bo‘sh qoldirilsa — birinchi xatboshidan avtomatik olinadi',
    news_body_label: 'Maqola matni',
    news_status_label: 'Status',
    news_publishedAt_label: 'Nashr sanasi («Rejalashtirish» uchun)',
    news_publishedAt_hint: 'Status = «Rejalashtirish» bo‘lsa, kelajak sanani belgilang — cron avtomatik nashr etadi',
    news_locale_label: 'Til',
    news_category_label: 'Kategoriya',
    news_cover_label: 'Muqova',
    news_featured_label: 'Bosh sahifaga biriktirish',
    news_featured_hint: 'Eng so‘nggi biriktirilgan maqola bosh sahifa qahramoni sifatida ko‘rsatiladi',
    news_sendpush_label: 'Saqlashdan keyin push yuborish',
    news_sendpush_hint: 'Faqat status = published bo‘lganda yuboriladi',
    news_tags_label: 'Teglar (vergul bilan)',
    news_shortcodes_hint: 'Shortcodelar: [img]URL[/img] · [fixture id=N] · [team id=N] · [youtube id=ABC] · [tweet id=NNNN] · [bet match=N]',
    news_alt_hint: 'Alt-matn: rasmlar tavsifga ega bo‘lishi shart — SEO va accessibility uchun majburiy',
    news_create_btn: 'Yaratish',
    news_save_btn: 'Saqlash',
    news_history_btn: 'Tarix',
    news_search_placeholder: 'Sarlavha bo‘yicha qidiruv…',
    login_title: 'Adminkaga kirish',
    login_sub: 'O‘z ma’lumotlaringizni kiriting.',
    login_submit: 'Kirish',
    login_err_invalid: 'Email yoki parol noto‘g‘ri',
    login_err_empty: 'Barcha maydonlarni to‘ldiring',
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
    form_internal_name: 'Nomi (ichki)',
    form_image_url: 'Rasm URL',
    form_link_url: 'Bosilganda havola',
    form_alt_text: 'Alt-matn',
    form_html_snippet: 'HTML/JS-snippet (ixtiyoriy, masalan AdSense)',
    form_position: 'Pozitsiya',
    form_sort_order: 'Tartib',
    form_active: 'Faol',
    form_slug_from_name: 'URL-slug (ixtiyoriy, nomdan avtomatik shakllanadi)',
    form_description_seo: 'Tavsif (SEO va rubrika sahifasi uchun)',
    form_parent_category: 'Ota-ona kategoriya',
    form_no_parent: '— yo‘q —',
    form_sort_order_long: 'Saralash tartibi',
    form_url_slug: 'URL-slug',
    form_short_description: 'Qisqa tavsif',
    form_body_html: 'Sahifa matni (HTML)',
    form_meta_title: 'Meta title',
    form_meta_description: 'Meta description',
    form_footer_sort_order: 'Saytning quyi qismida tartib',
    form_show_in_footer: 'Sayt quyisida ko‘rsatish',
    form_uzbek: 'O‘zbek',
    form_russian: 'Rus',
    form_english: 'Inglizcha',
    pos_header: 'Tepa qism',
    pos_sidebar: 'Yon panel',
    pos_in_article_top: 'Maqola ichida — yuqori',
    pos_in_article_bottom: 'Maqola ichida — pastda',
    pos_footer: 'Sayt quyisida',
    banner_new_sub: 'Yangi banner yaratish',
    cat_new_sub: 'Yangi rubrika yaratish',
    static_new_sub: 'Sayt quyi qismi / xizmat sahifasi',
    translations_label: 'Tarjimalar',
    translation_create: 'Tarjima yaratish',
    translation_current: 'Joriy versiya',
    translation_missing_hint: 'Sahifani saqlang, keyin tarjima yaratish mumkin',
    bulk_action_label: 'Ommaviy harakat:',
    bulk_action_choose: '— tanlang —',
    bulk_publish: 'Nashr qilish',
    bulk_unpublish: 'Nashrdan olib tashlash',
    bulk_archive: 'Arxivga',
    bulk_apply_to_selected: 'Tanlanganlarga qo‘llash',
    bulk_hint_checkboxes: 'Jadvaldagi tanlash katakchalaridan foydalaning',
    bulk_done_publish: 'Nashr qilindi',
    bulk_done_unpublish: 'Nashrdan olindi',
    bulk_done_archive: 'Arxivga ko‘chirildi',
    bulk_done_delete: 'O‘chirildi',
    news_create_article_btn: 'Maqola yaratish',
    news_count_articles: 'ta maqola',
    news_empty_filtered: 'Tanlangan filtrlar bo‘yicha maqolalar yo‘q',
    news_pin_homepage: 'Bosh sahifaga biriktirish',
    news_unpin_homepage: 'Bosh sahifadan olib tashlash',
    news_pinned_homepage_title: 'Bosh sahifaga biriktirilgan',
    news_unpublish_action: 'Nashrdan olib tashlash',
    news_publish_action: 'Nashr qilish',
    news_duplicate: 'Nusxa olish',
    th_id: 'ID',
    th_photo: 'Rasm',
    th_logo: 'Logo',
    th_league: 'Turnir',
    th_type: 'Tur',
    th_country: 'Mamlakat',
    th_season: 'Mavsum',
    th_preview: 'Ko‘rinish',
    th_name: 'Nomi',
    th_position: 'Pozitsiya',
    th_role: 'Roli',
    th_verified: 'Tasdiqlangan',
    th_created: 'Yaratilgan',
    th_url: 'URL',
    th_in_footer: 'Quyi qismida',
    th_team: 'Jamoa',
    th_team_home: 'Jamoa (uy)',
    th_file: 'Fayl',
    th_target: 'Maqsad',
    th_action: 'Harakat',
    th_when: 'Qachon',
    th_actor: 'Muallif',
    th_object: 'Obyekt',
    th_ip: 'IP',
    th_revision_title: 'Snapshot sarlavhasi',
    th_name_url: 'Nomi / URL',
    th_parent: 'Ota-ona',
    th_description: 'Tavsif',
    th_views: 'Ko‘rishlar',
    th_published: 'Nashr qilingan',
    th_open: 'Ochish',
    th_email_user: 'Email',
    th_matches: 'O‘yinlar',
    th_impressions: 'Ko‘rsatishlar',
    th_clicks: 'Bosishlar',
    th_enabled_short: 'Yoq',
    th_ai: 'AI',
    th_last_import: 'Oxirgi import',
    th_score: 'Hisob',
    th_articles_short: 'Maqolalar',
    th_subscribed: 'Obuna',
    th_unsubscribed: 'Bekor qilingan',
    th_entries: 'Yozuvlar',
    th_size: 'Hajmi',
    empty_no_records: 'Yozuvlar yo‘q',
    audit_search_placeholder: 'Tavsif yoki muallif bo‘yicha qidirish…',
    audit_action_placeholder: 'action (post.publish)',
    audit_entity_placeholder: 'entity (post, comment)',
    audit_count_suffix: 'oxirgi yozuvlar',
    settings_account: 'Hisob',
    settings_name: 'Ism',
    settings_role: 'Roli',
    settings_change_password: 'Parolni o‘zgartirish',
    settings_password_updated: 'Parol yangilandi',
    settings_current_password: 'Joriy parol',
    settings_new_password: 'Yangi parol (kamida 8 belgi)',
    settings_confirm_password: 'Yangi parolni takrorlang',
    settings_update_password: 'Parolni yangilash',
    settings_site_info: 'Sayt haqida ma’lumot',
    settings_url: 'URL',
    settings_site_name: 'Nomi',
    settings_supported_langs: 'Qo‘llab-quvvatlanadigan tillar',
    settings_cache_strategy: 'Kesh strategiyasi',
    settings_cache_strategy_text: 'Bosh sahifa va kategoriyalar — ISR 60 soniya. Maqolalar — dinamik. Cloudflare front-kesh.',
    settings_external_feeds: 'Tashqi lentalar',
    settings_err_empty: 'Barcha maydonlarni to‘ldiring',
    settings_err_weak: 'Kamida 8 belgi',
    settings_err_mismatch: 'Yangi parollar mos kelmaydi',
    settings_err_wrong: 'Joriy parol noto‘g‘ri',
    comments_pending: 'Moderatsiyada',
    comments_approved: 'Tasdiqlangan',
    comments_spam: 'Spam',
    comments_rejected: 'Rad etilgan',
    comments_no_in_tab: 'Bu yorliqda hali hech narsa yo‘q',
    comments_anonymous: 'Anonim',
    comments_to_post: 'Maqolaga:',
    comments_approve_btn: 'Tasdiqlash',
    comments_spam_btn: 'Spam',
    comments_no_title: 'Izohlar yo‘q',
    comments_no_sub: 'Bu yorliqda hali hech narsa yo‘q',
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
    save: 'Save',
    saved: 'Saved',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    apply: 'Apply',
    add: 'Add',
    create: 'Create',
    search: 'Search',
    remove: 'Remove',
    enable: 'Enable',
    disable: 'Disable',
    yes: 'Yes',
    no: 'No',
    all: 'All',
    status: 'Status',
    language: 'Language',
    category: 'Category',
    title: 'Title',
    body: 'Body',
    summary: 'Summary',
    cover: 'Cover',
    tags: 'Tags',
    slug: 'URL slug',
    date: 'Date',
    author: 'Author',
    email: 'Email',
    password: 'Password',
    loading: 'Loading…',
    empty: 'No data',
    back: 'Back',
    status_draft: 'Draft',
    status_scheduled: 'Scheduled',
    status_published: 'Published',
    status_archived: 'Archived',
    all_locales: 'All languages',
    all_statuses: 'All statuses',
    news_title_label: 'Title',
    news_slug_label: 'URL slug (optional, derived from title)',
    news_summary_label: 'Lede / short description (HTML, optional)',
    news_summary_hint: 'Leave empty to auto-derive from the first paragraph',
    news_body_label: 'Article body',
    news_status_label: 'Status',
    news_publishedAt_label: 'Publish date (for "Schedule")',
    news_publishedAt_hint: 'When status = "Schedule", set a future date — cron will auto-publish',
    news_locale_label: 'Language',
    news_category_label: 'Category',
    news_cover_label: 'Cover',
    news_featured_label: 'Pin to homepage',
    news_featured_hint: 'The most recently pinned article shows as the homepage hero',
    news_sendpush_label: 'Send push after save',
    news_sendpush_hint: 'Only fires when status = published',
    news_tags_label: 'Tags (comma-separated)',
    news_shortcodes_hint: 'Shortcodes: [img]URL[/img] · [fixture id=N] · [team id=N] · [youtube id=ABC] · [tweet id=NNNN] · [bet match=N]',
    news_alt_hint: 'Alt text: every embedded image must have a description — required for SEO and accessibility',
    news_create_btn: 'Create',
    news_save_btn: 'Save',
    news_history_btn: 'History',
    news_search_placeholder: 'Search by title…',
    login_title: 'Sign in to Admin',
    login_sub: 'Enter your credentials.',
    login_submit: 'Sign in',
    login_err_invalid: 'Wrong email or password',
    login_err_empty: 'Fill in both fields',
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
    form_internal_name: 'Name (internal)',
    form_image_url: 'Image URL',
    form_link_url: 'Click-through URL',
    form_alt_text: 'Alt text',
    form_html_snippet: 'HTML/JS snippet (optional, e.g. AdSense)',
    form_position: 'Position',
    form_sort_order: 'Order',
    form_active: 'Active',
    form_slug_from_name: 'URL slug (optional, derived from name)',
    form_description_seo: 'Description (for SEO and category page)',
    form_parent_category: 'Parent category',
    form_no_parent: '— none —',
    form_sort_order_long: 'Sort order',
    form_url_slug: 'URL slug',
    form_short_description: 'Short description',
    form_body_html: 'Page body (HTML)',
    form_meta_title: 'Meta title',
    form_meta_description: 'Meta description',
    form_footer_sort_order: 'Order in footer',
    form_show_in_footer: 'Show in footer',
    form_uzbek: 'Uzbek',
    form_russian: 'Russian',
    form_english: 'English',
    pos_header: 'Header',
    pos_sidebar: 'Sidebar',
    pos_in_article_top: 'In article — top',
    pos_in_article_bottom: 'In article — bottom',
    pos_footer: 'Footer',
    banner_new_sub: 'Creating a new banner',
    cat_new_sub: 'Creating a new section',
    static_new_sub: 'Footer / utility page',
    translations_label: 'Translations',
    translation_create: 'Create translation',
    translation_current: 'Current version',
    translation_missing_hint: 'Save the page first, then you can create translations',
    bulk_action_label: 'Bulk action:',
    bulk_action_choose: '— choose —',
    bulk_publish: 'Publish',
    bulk_unpublish: 'Unpublish',
    bulk_archive: 'Archive',
    bulk_apply_to_selected: 'Apply to selected',
    bulk_hint_checkboxes: 'Use checkboxes in the table',
    bulk_done_publish: 'Published',
    bulk_done_unpublish: 'Unpublished',
    bulk_done_archive: 'Moved to archive',
    bulk_done_delete: 'Deleted',
    news_create_article_btn: 'Create article',
    news_count_articles: 'articles',
    news_empty_filtered: 'No articles match the selected filters',
    news_pin_homepage: 'Pin to homepage',
    news_unpin_homepage: 'Unpin from homepage',
    news_pinned_homepage_title: 'Pinned to homepage',
    news_unpublish_action: 'Unpublish',
    news_publish_action: 'Publish',
    news_duplicate: 'Duplicate',
    th_id: 'ID',
    th_photo: 'Photo',
    th_logo: 'Logo',
    th_league: 'League',
    th_type: 'Type',
    th_country: 'Country',
    th_season: 'Season',
    th_preview: 'Preview',
    th_name: 'Name',
    th_position: 'Position',
    th_role: 'Role',
    th_verified: 'Verified',
    th_created: 'Created',
    th_url: 'URL',
    th_in_footer: 'In footer',
    th_team: 'Team',
    th_team_home: 'Team (home)',
    th_file: 'File',
    th_target: 'Target',
    th_action: 'Action',
    th_when: 'When',
    th_actor: 'Actor',
    th_object: 'Object',
    th_ip: 'IP',
    th_revision_title: 'Snapshot title',
    th_name_url: 'Name / URL',
    th_parent: 'Parent',
    th_description: 'Description',
    th_views: 'Views',
    th_published: 'Published',
    th_open: 'Open',
    th_email_user: 'Email',
    th_matches: 'Matches',
    th_impressions: 'Impressions',
    th_clicks: 'Clicks',
    th_enabled_short: 'On',
    th_ai: 'AI',
    th_last_import: 'Last import',
    th_score: 'Score',
    th_articles_short: 'Articles',
    th_subscribed: 'Subscribed',
    th_unsubscribed: 'Unsubscribed',
    th_entries: 'Entries',
    th_size: 'Size',
    empty_no_records: 'No records',
    audit_search_placeholder: 'Search by description or actor…',
    audit_action_placeholder: 'action (post.publish)',
    audit_entity_placeholder: 'entity (post, comment)',
    audit_count_suffix: 'recent records',
    settings_account: 'Account',
    settings_name: 'Name',
    settings_role: 'Role',
    settings_change_password: 'Change password',
    settings_password_updated: 'Password updated',
    settings_current_password: 'Current password',
    settings_new_password: 'New password (min 8 chars)',
    settings_confirm_password: 'Repeat new password',
    settings_update_password: 'Update password',
    settings_site_info: 'Site information',
    settings_url: 'URL',
    settings_site_name: 'Name',
    settings_supported_langs: 'Supported languages',
    settings_cache_strategy: 'Cache strategy',
    settings_cache_strategy_text: 'Homepage and categories — ISR 60s. Articles — dynamic. Cloudflare front-cache.',
    settings_external_feeds: 'External feeds',
    settings_err_empty: 'Fill in all fields',
    settings_err_weak: 'At least 8 characters',
    settings_err_mismatch: 'New passwords do not match',
    settings_err_wrong: 'Current password is wrong',
    comments_pending: 'Pending',
    comments_approved: 'Approved',
    comments_spam: 'Spam',
    comments_rejected: 'Rejected',
    comments_no_in_tab: 'Nothing here yet',
    comments_anonymous: 'Anonymous',
    comments_to_post: 'On article:',
    comments_approve_btn: 'Approve',
    comments_spam_btn: 'Spam',
    comments_no_title: 'No comments',
    comments_no_sub: 'Nothing here yet',
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
