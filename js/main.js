/**
 * MAIN.JS — Общая логика: шапка, подвал, мобильное меню
 * Подключается на всех страницах после data.js
 */

// ── Форматирование цены ────────────────────────────────────
function formatPrice(price) {
  return price.toLocaleString('ru-RU') + '\u00A0₽';
}

// ── SVG-иконки категорий ───────────────────────────────────
const CATEGORY_ICONS = {
  wreath: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="10" stroke="#2F343A" stroke-width="1.4" fill="none"/>
    <circle cx="14" cy="14" r="5.5" stroke="#2F343A" stroke-width="1.4" fill="none"/>
    <path d="M14 4 Q16 9 14 14 Q12 9 14 4Z" fill="#2F343A" opacity="0.18"/>
    <path d="M24 14 Q19 16 14 14 Q19 12 24 14Z" fill="#2F343A" opacity="0.18"/>
    <path d="M14 24 Q12 19 14 14 Q16 19 14 24Z" fill="#2F343A" opacity="0.18"/>
    <path d="M4 14 Q9 12 14 14 Q9 16 4 14Z" fill="#2F343A" opacity="0.18"/>
  </svg>`,
  basket: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M5 12h18l-1.8 11H6.8L5 12z" stroke="#2F343A" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
    <path d="M9 12L12.5 7M19 12l-3.5-5" stroke="#2F343A" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M3.5 12h21" stroke="#2F343A" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M11 17h6M10 20.5h8" stroke="#2F343A" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
  </svg>`,
  meadow: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="3" y="17" width="22" height="9" rx="2.5" stroke="#2F343A" stroke-width="1.4" fill="none"/>
    <path d="M7 17 Q8.5 10 10 17" stroke="#2F343A" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    <path d="M11 17 Q13 7 15 17" stroke="#2F343A" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    <path d="M16 17 Q17.5 11 19 17" stroke="#2F343A" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    <path d="M20 17 Q21 13 22.5 17" stroke="#2F343A" stroke-width="1.4" stroke-linecap="round" fill="none"/>
  </svg>`,
  tomb: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="5" y="13" width="18" height="13" rx="2" stroke="#2F343A" stroke-width="1.4" fill="none"/>
    <path d="M5 17 Q14 7 23 17" stroke="#2F343A" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
    <path d="M14 17v6M11 20h6" stroke="#2F343A" stroke-width="1.3" stroke-linecap="round" opacity="0.4"/>
  </svg>`,
};

// ── Генерация шапки ────────────────────────────────────────
function renderHeader(activeCategoryId) {
  const header = document.getElementById('header');
  if (!header) return;

  const navItems = [
    { href: 'index.html', label: 'Главная', id: 'home' },
    ...SITE_DATA.categories.map(c => ({ href: c.slug, label: c.name, id: c.id })),
    { href: 'order-info.html', label: 'Условия заказа', id: 'order-info' },
  ];

  header.innerHTML = `
    <div class="container">
      <div class="header__inner">
        <a href="index.html" class="header__logo">${SITE_DATA.site.name}</a>

        <nav class="header__nav" role="navigation" aria-label="Основная навигация">
          ${navItems.map(item => `
            <a href="${item.href}"
               class="header__nav-link${activeCategoryId === item.id ? ' is-active' : ''}">
              ${item.label}
            </a>
          `).join('')}
        </nav>

        <button class="header__burger" id="burger" aria-label="Открыть меню" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>

      <nav class="header__mobile-nav" id="mobile-nav" aria-label="Мобильная навигация">
        ${navItems.map(item => `
          <a href="${item.href}"
             class="header__mobile-nav-link${activeCategoryId === item.id ? ' is-active' : ''}">
            ${item.label}
          </a>
        `).join('')}
      </nav>
    </div>
  `;

  // Мобильное меню
  const burger   = document.getElementById('burger');
  const mobileNav = document.getElementById('mobile-nav');

  burger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  // Закрытие по клику вне меню
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target) && mobileNav.classList.contains('is-open')) {
      mobileNav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Генерация подвала ──────────────────────────────────────
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  const { contacts, site } = SITE_DATA;

  footer.innerHTML = `
    <div class="container">
      <div class="footer__inner">
        <div class="footer__brand">
          ${site.name}
          <span>Каталог ритуальных товаров</span>
        </div>

        <div class="footer__contacts">
          <a href="${contacts.phoneHref}" class="footer__contact-item">
            <svg class="footer__contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372
                   c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293
                   c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21
                   l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5
                   A2.25 2.25 0 002.25 4.5v2.25z"/>
            </svg>
            ${contacts.phone}
          </a>

          <a href="${contacts.telegramHref}" class="footer__contact-item" target="_blank" rel="noopener">
            <svg class="footer__contact-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z
                       m4.64 6.8l-1.68 7.92c-.12.56-.48.7-.96.44l-2.64-1.95-1.28 1.23
                       c-.14.14-.26.26-.52.26l.18-2.64 4.72-4.27c.2-.18-.04-.28-.32-.1
                       L7.32 15.08l-2.56-.8c-.56-.18-.58-.56.12-.82l10.04-3.87c.46-.18.86.1.72.81z"/>
            </svg>
            ${contacts.telegram}
          </a>
        </div>
      </div>
    </div>
  `;
}

// ── Определение активного раздела по URL ───────────────────
function getActivePageId() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '') return 'home';
  if (path === 'order-info.html') return 'order-info';
  const cat = SITE_DATA.categories.find(c => c.slug === path);
  return cat ? cat.id : 'home';
}

// ── Инициализация ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderHeader(getActivePageId());
  renderFooter();
});
