'use strict';

// ── Форматирование цены ────────────────────────────────────
function formatPrice(price) {
  return Number(price).toLocaleString('ru-RU') + '\u00A0₽';
}

// ── Плейсхолдер SVG ────────────────────────────────────────
var PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg width='56' height='56' viewBox='0 0 56 56' fill='none'%3E%3Crect x='3' y='3' width='50' height='50' rx='8' stroke='%23C8CDD4' stroke-width='1.5' fill='none'/%3E%3Cpath d='M14 42 L22 28 L29 36 L35 24 L44 42 H14Z' fill='%23C8CDD4' opacity='0.55'/%3E%3Ccircle cx='36' cy='19' r='5' fill='%23C8CDD4' opacity='0.55'/%3E%3C/svg%3E";

// ── Мобильное меню ─────────────────────────────────────────
function initMobileMenu() {
  var burger = document.getElementById('burger');
  var mobileNav = document.getElementById('mobile-nav');
  var header = document.getElementById('header');

  if (!burger || !mobileNav) return;

  burger.addEventListener('click', function() {
    var isOpen = mobileNav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', function(e) {
    if (header && !header.contains(e.target) && mobileNav.classList.contains('is-open')) {
      mobileNav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Фильтрация товаров ─────────────────────────────────────
function initFilters() {
  var filtersEl = document.getElementById('filters');
  if (!filtersEl) return;

  var grid = document.getElementById('products-grid');
  var noResults = document.getElementById('no-results');
  var selects = filtersEl.querySelectorAll('.filters__select[data-filter]');
  var resetBtn = document.getElementById('filter-reset');

  function applyFilters() {
    var filters = {};
    selects.forEach(function(sel) {
      var filterKey = sel.getAttribute('data-filter');
      filters[filterKey] = sel.value;
    });

    var cards = grid ? grid.querySelectorAll('.product-card') : [];
    var visibleCount = 0;

    cards.forEach(function(card) {
      var show = true;

      if (filters.color && card.dataset.color !== filters.color) show = false;
      if (filters.shape && card.dataset.shape !== filters.shape) show = false;
      if (filters.size && card.dataset.size !== filters.size) show = false;

      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  selects.forEach(function(sel) {
    sel.addEventListener('change', applyFilters);
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      selects.forEach(function(sel) { sel.value = ''; });
      applyFilters();
    });
  }
}

// ── Инициализация ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initMobileMenu();
  initFilters();
});
