/**
 * CATALOG.JS — Рендер товаров и фильтрация
 * Подключается только на страницах категорий
 */

// ── SVG плейсхолдер (нет фото) ────────────────────────────
const PLACEHOLDER_SVG = `
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="50" height="50" rx="8" stroke="#C8CDD4" stroke-width="1.5" fill="none"/>
    <path d="M14 42 L22 28 L29 36 L35 24 L44 42 H14Z" fill="#C8CDD4" opacity="0.55"/>
    <circle cx="36" cy="19" r="5" fill="#C8CDD4" opacity="0.55"/>
  </svg>
`;

// ── Состояние фильтров ─────────────────────────────────────
let currentFilters = { color: 'all', shape: 'all', size: 'all', price: 'all' };
let allProducts    = [];
let categoryId     = '';

// ── Инициализация каталога ─────────────────────────────────
function initCatalog() {
  const main = document.querySelector('main[data-category]');
  if (!main) return;

  categoryId  = main.getAttribute('data-category');
  allProducts = SITE_DATA.products[categoryId] || [];

  renderPageTitle();
  renderFilters();
  renderProducts(allProducts);
  renderCatalogNotice();
}

// ── Заголовок страницы ─────────────────────────────────────
function renderPageTitle() {
  const cat = SITE_DATA.categories.find(c => c.id === categoryId);
  if (!cat) return;

  const el = document.getElementById('page-title');
  if (el) {
    el.innerHTML = `
      <p class="page-header__eyebrow">Каталог</p>
      <h1 class="page-header__title">${cat.name}</h1>
    `;
  }

  document.title = `${cat.name} — ${SITE_DATA.site.name}`;
}

// ── Фильтры ────────────────────────────────────────────────
function renderFilters() {
  const container = document.getElementById('filters');
  if (!container) return;

  const shapes = SITE_DATA.filters.shapes[categoryId] || [];

  container.innerHTML = `
    <div class="filters__title">Фильтры</div>
    <div class="filters__groups">

      <div class="filter-group">
        <label class="filter-group__label" for="filter-color">Цвет</label>
        <select class="filter-group__select" id="filter-color" data-filter="color">
          ${SITE_DATA.filters.colors.map(c =>
            `<option value="${c.value}">${c.label}</option>`
          ).join('')}
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-group__label" for="filter-shape">Форма</label>
        <select class="filter-group__select" id="filter-shape" data-filter="shape">
          ${shapes.map(s =>
            `<option value="${s.value}">${s.label}</option>`
          ).join('')}
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-group__label" for="filter-size">Размер</label>
        <select class="filter-group__select" id="filter-size" data-filter="size">
          ${SITE_DATA.filters.sizes.map(s =>
            `<option value="${s.value}">${s.label}</option>`
          ).join('')}
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-group__label" for="filter-price">Цена</label>
        <select class="filter-group__select" id="filter-price" data-filter="price">
          ${SITE_DATA.filters.priceRanges.map(p =>
            `<option value="${p.value}">${p.label}</option>`
          ).join('')}
        </select>
      </div>

      <button class="filters__reset" id="filters-reset">Сбросить</button>
    </div>
  `;

  // Слушатели изменений
  container.querySelectorAll('.filter-group__select').forEach(select => {
    select.addEventListener('change', (e) => {
      currentFilters[e.target.dataset.filter] = e.target.value;
      applyFilters();
    });
  });

  document.getElementById('filters-reset').addEventListener('click', resetFilters);
}

// ── Применение фильтров ────────────────────────────────────
function applyFilters() {
  const filtered = allProducts.filter(product => {
    // Цвет
    if (currentFilters.color !== 'all' && product.color !== currentFilters.color) return false;
    // Форма
    if (currentFilters.shape !== 'all' && product.shape !== currentFilters.shape) return false;
    // Размер
    if (currentFilters.size  !== 'all' && product.size  !== currentFilters.size)  return false;
    // Цена
    if (currentFilters.price !== 'all') {
      const range = SITE_DATA.filters.priceRanges.find(p => p.value === currentFilters.price);
      if (range && (product.price < range.min || product.price > range.max)) return false;
    }
    return true;
  });

  renderProducts(filtered);
}

// ── Сброс фильтров ─────────────────────────────────────────
function resetFilters() {
  currentFilters = { color: 'all', shape: 'all', size: 'all', price: 'all' };
  document.querySelectorAll('.filter-group__select').forEach(s => { s.value = 'all'; });
  renderProducts(allProducts);
}

// ── Рендер товаров ─────────────────────────────────────────
function renderProducts(products) {
  const grid     = document.getElementById('products-grid');
  const empty    = document.getElementById('products-empty');
  const countEl  = document.getElementById('products-count');

  if (countEl) {
    const word = pluralRu(products.length, 'товар', 'товара', 'товаров');
    countEl.innerHTML = `Найдено: <strong>${products.length}</strong> ${word}`;
  }

  if (products.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  grid.innerHTML = products.map(renderCard).join('');
}

// ── Карточка товара ────────────────────────────────────────
function renderCard(product) {
  const imageContent = product.img
    ? `<img src="${product.img}" alt="${product.name}" loading="lazy">`
    : `<div class="product-card__placeholder">${PLACEHOLDER_SVG}</div>`;

  return `
    <div class="product-card">
      <div class="product-card__image">
        ${imageContent}
        <span class="product-card__badge">${product.number}</span>
      </div>
      <div class="product-card__body">
        <div class="product-card__name">${product.name}</div>
        <div class="product-card__meta">
          <div class="product-card__meta-row">
            <span class="product-card__meta-label">Форма:</span>
            <span class="product-card__meta-value">${product.shapeLabel}</span>
          </div>
          <div class="product-card__meta-row">
            <span class="product-card__meta-label">Размер:</span>
            <span class="product-card__meta-value">${product.sizeLabel}</span>
          </div>
          <div class="product-card__meta-row">
            <span class="product-card__meta-label">Цвет:</span>
            <span class="product-card__meta-value">${product.colorLabel}</span>
          </div>
        </div>
        <div class="product-card__footer">
          <span class="product-card__price">${formatPrice(product.price)}</span>
          <span class="product-card__cta">Уточнить →</span>
        </div>
      </div>
    </div>
  `;
}

// ── Блок-уведомление внизу каталога ───────────────────────
function renderCatalogNotice() {
  const el = document.getElementById('catalog-notice');
  if (!el) return;
  el.innerHTML = `
    <div class="notice-block">
      <span class="notice-block__icon">ℹ</span>
      <p>${SITE_DATA.site.notice}</p>
    </div>
  `;
}

// ── Склонение числительных ─────────────────────────────────
function pluralRu(n, one, few, many) {
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
}

// ── Запуск ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initCatalog);
