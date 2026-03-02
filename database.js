'use strict';

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// DATABASE_PATH задаётся через переменную окружения (для Railway/хостинга)
// или используется локальный файл по умолчанию
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'catalog.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Создание таблиц ---

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    slug TEXT UNIQUE NOT NULL,
    order_idx INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    slug TEXT NOT NULL,
    order_idx INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    shape TEXT DEFAULT '',
    shape_label TEXT DEFAULT '',
    color TEXT DEFAULT '',
    color_label TEXT DEFAULT '',
    size TEXT DEFAULT '',
    size_label TEXT DEFAULT '',
    price INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT '',
    label TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
`);

// --- Seed: проверяем, есть ли уже данные ---

const categoriesCount = db.prepare('SELECT COUNT(*) as cnt FROM categories').get();

if (categoriesCount.cnt === 0) {
  // --- Categories ---
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, description, icon, slug, order_idx)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const categoriesData = [
    ['venki', 'Венки', 'Траурные венки из живых и искусственных цветов', 'venok', 'venki', 1],
    ['korziny', 'Корзины', 'Траурные корзины различных форм и размеров', 'korzina', 'korziny', 2],
    ['polyanki', 'Полянки', 'Траурные полянки для украшения места захоронения', 'polyanka', 'polyanki', 3],
    ['grobnicy', 'Гробницы', 'Траурные гробницы из искусственных цветов', 'grobnitsa', 'grobnicy', 4],
  ];

  const insertCategoriesTx = db.transaction(() => {
    for (const cat of categoriesData) {
      insertCategory.run(...cat);
    }
  });
  insertCategoriesTx();

  // --- Subcategories ---
  const insertSubcategory = db.prepare(`
    INSERT OR IGNORE INTO subcategories (category_id, name, description, slug, order_idx)
    VALUES (?, ?, ?, ?, ?)
  `);

  const subcategoriesData = [
    // venki
    ['venki', 'Классические', '', 'klassicheskie', 1],
    ['venki', 'Премиум', '', 'premium', 2],
    ['venki', 'Из живых цветов', '', 'zhivye', 3],
    ['venki', 'Из искусственных цветов', '', 'iskusstvennye', 4],
    // korziny
    ['korziny', 'Малые', '', 'malye', 1],
    ['korziny', 'Средние', '', 'srednie', 2],
    ['korziny', 'Большие', '', 'bolshie', 3],
    // polyanki
    ['polyanki', 'Стандартные', '', 'standartnye', 1],
    ['polyanki', 'Премиальные', '', 'premialnye', 2],
    // grobnicy
    ['grobnicy', 'Классические', '', 'klassicheskie', 1],
    ['grobnicy', 'С аркой', '', 's-arkoj', 2],
    ['grobnicy', 'Крестообразные', '', 'krestoobrazye', 3],
  ];

  const insertSubcategoriesTx = db.transaction(() => {
    for (const sub of subcategoriesData) {
      insertSubcategory.run(...sub);
    }
  });
  insertSubcategoriesTx();

  // --- Helper to get subcategory id ---
  const getSubId = (catId, slug) => {
    const row = db.prepare('SELECT id FROM subcategories WHERE category_id = ? AND slug = ?').get(catId, slug);
    return row ? row.id : null;
  };

  const shapeLabels = {
    oval: 'Овальный',
    round: 'Круглый',
    rectangular: 'Прямоугольный',
    heart: 'Сердце',
    tear: 'Слеза',
    arch: 'Арка',
    cross: 'Крест',
  };

  const colorLabels = {
    white: 'Белый',
    red: 'Красный',
    burgundy: 'Бордовый',
    pink: 'Розовый',
    yellow: 'Жёлтый',
    mix: 'Микс',
  };

  const sizeLabels = {
    small: 'Маленький',
    medium: 'Средний',
    large: 'Большой',
    xl: 'Очень большой',
  };

  const makeSlug = (number) => {
    return number
      .replace('В-', 'v-')
      .replace('К-', 'k-')
      .replace('П-', 'p-')
      .replace('Г-', 'g-')
      .toLowerCase();
  };

  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products
      (subcategory_id, number, name, slug, shape, shape_label, color, color_label, size, size_label, price, description, images, is_active)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const productsData = [
    // venki/klassicheskie
    { cat: 'venki', sub: 'klassicheskie', number: 'В-002', name: 'Красная роза',  shape: 'oval',        color: 'red',     size: 'large',  price: 4200 },
    { cat: 'venki', sub: 'klassicheskie', number: 'В-003', name: 'Бархат',         shape: 'round',       color: 'burgundy',size: 'small',  price: 1800 },
    // venki/premium
    { cat: 'venki', sub: 'premium',       number: 'В-005', name: 'Слеза',          shape: 'tear',        color: 'white',   size: 'large',  price: 5800 },
    { cat: 'venki', sub: 'premium',       number: 'В-006', name: 'Рассвет',        shape: 'oval',        color: 'mix',     size: 'xl',     price: 7500 },
    { cat: 'venki', sub: 'premium',       number: 'В-008', name: 'Вечность',       shape: 'oval',        color: 'red',     size: 'xl',     price: 9200 },
    { cat: 'venki', sub: 'premium',       number: 'В-009', name: 'Прощание',       shape: 'tear',        color: 'burgundy',size: 'large',  price: 6300 },
    // venki/zhivye
    { cat: 'venki', sub: 'zhivye',        number: 'В-007', name: 'Солнечный',      shape: 'round',       color: 'yellow',  size: 'medium', price: 2800 },
    // venki/iskusstvennye
    { cat: 'venki', sub: 'iskusstvennye', number: 'В-001', name: 'Белая нить',     shape: 'round',       color: 'white',   size: 'medium', price: 2500 },
    { cat: 'venki', sub: 'iskusstvennye', number: 'В-004', name: 'Нежность',       shape: 'heart',       color: 'pink',    size: 'medium', price: 3200 },

    // korziny/malye
    { cat: 'korziny', sub: 'malye',   number: 'К-005', name: 'Весна',          shape: 'oval',        color: 'mix',     size: 'small',  price: 2400 },
    { cat: 'korziny', sub: 'malye',   number: 'К-006', name: 'Солнце',         shape: 'round',       color: 'yellow',  size: 'medium', price: 3200 },
    // korziny/srednie
    { cat: 'korziny', sub: 'srednie', number: 'К-001', name: 'Спокойствие',    shape: 'rectangular', color: 'white',   size: 'medium', price: 3800 },
    { cat: 'korziny', sub: 'srednie', number: 'К-003', name: 'Нежный взгляд',  shape: 'heart',       color: 'pink',    size: 'medium', price: 4200 },
    { cat: 'korziny', sub: 'srednie', number: 'К-009', name: 'Малиновая',      shape: 'round',       color: 'burgundy',size: 'medium', price: 4600 },
    // korziny/bolshie
    { cat: 'korziny', sub: 'bolshie', number: 'К-002', name: 'Память',         shape: 'oval',        color: 'red',     size: 'large',  price: 5500 },
    { cat: 'korziny', sub: 'bolshie', number: 'К-004', name: 'Бордо',          shape: 'rectangular', color: 'burgundy',size: 'large',  price: 6800 },
    { cat: 'korziny', sub: 'bolshie', number: 'К-007', name: 'Элегия',         shape: 'rectangular', color: 'white',   size: 'xl',     price: 9500 },
    { cat: 'korziny', sub: 'bolshie', number: 'К-008', name: 'Сердечная',      shape: 'heart',       color: 'red',     size: 'large',  price: 7200 },

    // polyanki/standartnye
    { cat: 'polyanki', sub: 'standartnye', number: 'П-001', name: 'Белое поле',      shape: 'rectangular', color: 'white',   size: 'medium', price: 4500 },
    { cat: 'polyanki', sub: 'standartnye', number: 'П-003', name: 'Тихий сад',       shape: 'round',       color: 'mix',     size: 'medium', price: 5200 },
    { cat: 'polyanki', sub: 'standartnye', number: 'П-005', name: 'Розовый',          shape: 'oval',        color: 'pink',    size: 'small',  price: 3100 },
    { cat: 'polyanki', sub: 'standartnye', number: 'П-008', name: 'Лесная',           shape: 'oval',        color: 'mix',     size: 'small',  price: 2700 },
    // polyanki/premialnye
    { cat: 'polyanki', sub: 'premialnye',  number: 'П-002', name: 'Алый',             shape: 'oval',        color: 'red',     size: 'large',  price: 7800 },
    { cat: 'polyanki', sub: 'premialnye',  number: 'П-004', name: 'Малиновый закат',  shape: 'rectangular', color: 'burgundy',size: 'large',  price: 9200 },
    { cat: 'polyanki', sub: 'premialnye',  number: 'П-006', name: 'Золотой',          shape: 'round',       color: 'yellow',  size: 'large',  price: 8500 },
    { cat: 'polyanki', sub: 'premialnye',  number: 'П-007', name: 'Вечный свет',      shape: 'rectangular', color: 'white',   size: 'xl',     price: 14500 },
    { cat: 'polyanki', sub: 'premialnye',  number: 'П-009', name: 'Бархатная ночь',   shape: 'rectangular', color: 'burgundy',size: 'medium', price: 6100 },

    // grobnicy/klassicheskie
    { cat: 'grobnicy', sub: 'klassicheskie', number: 'Г-001', name: 'Классика',        shape: 'rectangular', color: 'white',   size: 'medium', price: 8500 },
    { cat: 'grobnicy', sub: 'klassicheskie', number: 'Г-004', name: 'Бордо',           shape: 'rectangular', color: 'burgundy',size: 'large',  price: 16500 },
    { cat: 'grobnicy', sub: 'klassicheskie', number: 'Г-006', name: 'Нежность',        shape: 'rectangular', color: 'pink',    size: 'medium', price: 9800 },
    // grobnicy/s-arkoj
    { cat: 'grobnicy', sub: 's-arkoj',       number: 'Г-002', name: 'Арка памяти',     shape: 'arch',        color: 'mix',     size: 'large',  price: 14000 },
    { cat: 'grobnicy', sub: 's-arkoj',       number: 'Г-005', name: 'Аркада роз',      shape: 'arch',        color: 'red',     size: 'xl',     price: 22000 },
    { cat: 'grobnicy', sub: 's-arkoj',       number: 'Г-008', name: 'Великий покой',   shape: 'arch',        color: 'white',   size: 'xl',     price: 26000 },
    // grobnicy/krestoobrazye
    { cat: 'grobnicy', sub: 'krestoobrazye', number: 'Г-003', name: 'Святой крест',    shape: 'cross',       color: 'white',   size: 'medium', price: 11200 },
    { cat: 'grobnicy', sub: 'krestoobrazye', number: 'Г-007', name: 'Золотое сечение', shape: 'cross',       color: 'yellow',  size: 'large',  price: 13500 },
    { cat: 'grobnicy', sub: 'krestoobrazye', number: 'Г-009', name: 'Траурный',        shape: 'cross',       color: 'burgundy',size: 'large',  price: 17800 },
  ];

  const insertProductsTx = db.transaction(() => {
    for (const p of productsData) {
      const subId = getSubId(p.cat, p.sub);
      if (!subId) {
        console.warn(`Subcategory not found: ${p.cat}/${p.sub}`);
        continue;
      }
      const slug = makeSlug(p.number);
      insertProduct.run(
        subId,
        p.number,
        p.name,
        slug,
        p.shape,
        shapeLabels[p.shape] || p.shape,
        p.color,
        colorLabels[p.color] || p.color,
        p.size,
        sizeLabels[p.size] || p.size,
        p.price,
        '',
        '[]'
      );
    }
  });
  insertProductsTx();

  // --- Content ---
  const insertContent = db.prepare(`
    INSERT OR IGNORE INTO content (key, value, label) VALUES (?, ?, ?)
  `);

  const contentData = [
    ['hero.title',         'Каталог ритуальных товаров',                                                                                                             'Заголовок главной'],
    ['hero.subtitle',      'Венки · Корзины · Полянки · Гробницы',                                                                                                  'Подзаголовок главной'],
    ['hero.eyebrow',       'Ритуальные товары',                                                                                                                      'Надпись над заголовком'],
    ['hero.button',        'Смотреть каталог',                                                                                                                       'Кнопка Hero'],
    ['site.name',          'Ритуальные товары',                                                                                                                      'Название сайта'],
    ['site.notice',        'Каталог носит ознакомительный характер. Подробности по заказу, доставке, срокам изготовления, наличию и индивидуальным пожеланиям уточняйте по телефону.', 'Информационное уведомление'],
    ['contacts.phone',     '+7 (000) 000-00-00',                                                                                                                     'Телефон'],
    ['contacts.phoneHref', 'tel:+70000000000',                                                                                                                       'Телефон href'],
    ['contacts.telegram',  '@ritual_shop',                                                                                                                           'Telegram'],
    ['contacts.telegramHref', 'https://t.me/ritual_shop',                                                                                                           'Telegram ссылка'],
    ['order.title',        'Условия заказа',                                                                                                                         'Заголовок страницы заказа'],
    ['meta.description',   'Каталог ритуальных товаров: венки, корзины, полянки, гробницы',                                                                         'Meta description'],
  ];

  const insertContentTx = db.transaction(() => {
    for (const [key, value, label] of contentData) {
      insertContent.run(key, value, label);
    }
  });
  insertContentTx();

  // --- Admin user ---
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@site.local');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin1234', 10);
    db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run('admin@site.local', hash);
  }

  console.log('Database seeded successfully.');
} else {
  console.log('Database already has data, skipping seed.');
}

module.exports = db;
