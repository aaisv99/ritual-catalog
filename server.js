'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const db = require('./database');
const apiRouter = require('./routes/api');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 8080;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статика: public/ (css, js, uploads)
app.use(express.static(path.join(__dirname, 'public')));

// Статика для CSS из корня проекта (css/ папка)
app.use('/css', express.static(path.join(__dirname, 'css')));

// Статика для старого JS (если нужно)
app.use('/js', express.static(path.join(__dirname, 'js')));

// Статика для img
app.use('/img', express.static(path.join(__dirname, 'img')));

// EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- API роуты ---
app.use('/api', apiRouter);
app.use('/admin/api', adminRouter);

// --- Статика для admin (кроме /admin/api/) ---
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// --- Хелперы для получения данных ---
function getContent() {
  const rows = db.prepare('SELECT key, value FROM content').all();
  const result = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

function getCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY order_idx ASC').all();
}

// --- Site routes ---

// Главная страница
app.get('/', (req, res) => {
  try {
    const content = getContent();
    const categories = getCategories();
    res.render('index', {
      title: content['site.name'] || 'Ритуальные товары',
      description: content['meta.description'] || '',
      siteName: content['site.name'] || 'Ритуальные товары',
      content,
      categories,
      activePage: 'home',
      catalogPage: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('404', { title: 'Ошибка', description: '', siteName: 'Ритуальные товары', content: {}, categories: [] });
  }
});

// Страница условий заказа
app.get('/order-info', (req, res) => {
  try {
    const content = getContent();
    const categories = getCategories();
    res.render('order-info', {
      title: (content['order.title'] || 'Условия заказа') + ' | ' + (content['site.name'] || 'Ритуальные товары'),
      description: content['meta.description'] || '',
      siteName: content['site.name'] || 'Ритуальные товары',
      content,
      categories,
      activePage: 'order',
      catalogPage: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('404', { title: 'Ошибка', description: '', siteName: 'Ритуальные товары', content: {}, categories: [] });
  }
});

// Страница категории
app.get('/catalog/:cat', (req, res) => {
  try {
    const content = getContent();
    const categories = getCategories();
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.cat);
    if (!category) {
      return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });
    }
    const subcategories = db.prepare('SELECT * FROM subcategories WHERE category_id = ? ORDER BY order_idx ASC').all(category.id);
    res.render('category', {
      title: category.name + ' | ' + (content['site.name'] || 'Ритуальные товары'),
      description: content['meta.description'] || '',
      siteName: content['site.name'] || 'Ритуальные товары',
      content,
      categories,
      category,
      subcategories,
      activePage: category.slug,
      catalogPage: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

// Страница подраздела
app.get('/catalog/:cat/:sub', (req, res) => {
  try {
    const content = getContent();
    const categories = getCategories();
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.cat);
    if (!category) {
      return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });
    }
    const subcategory = db.prepare('SELECT * FROM subcategories WHERE slug = ? AND category_id = ?').get(req.params.sub, category.id);
    if (!subcategory) {
      return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });
    }
    const products = db.prepare('SELECT * FROM products WHERE subcategory_id = ? AND is_active = 1 ORDER BY number ASC').all(subcategory.id);
    const parsedProducts = products.map(p => ({ ...p, images: JSON.parse(p.images || '[]') }));

    res.render('subcategory', {
      title: subcategory.name + ' — ' + category.name + ' | ' + (content['site.name'] || 'Ритуальные товары'),
      description: content['meta.description'] || '',
      siteName: content['site.name'] || 'Ритуальные товары',
      content,
      categories,
      category,
      subcategory,
      products: parsedProducts,
      activePage: category.slug,
      catalogPage: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

// Страница товара
app.get('/catalog/:cat/:sub/:slug', (req, res) => {
  try {
    const content = getContent();
    const categories = getCategories();
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.cat);
    if (!category) {
      return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });
    }
    const subcategory = db.prepare('SELECT * FROM subcategories WHERE slug = ? AND category_id = ?').get(req.params.sub, category.id);
    if (!subcategory) {
      return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });
    }
    const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
    if (!product) {
      return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });
    }

    const parsedProduct = { ...product, images: JSON.parse(product.images || '[]') };

    const similar = db.prepare(
      'SELECT * FROM products WHERE subcategory_id = ? AND id != ? AND is_active = 1 ORDER BY number ASC LIMIT 4'
    ).all(subcategory.id, product.id);
    const parsedSimilar = similar.map(p => ({ ...p, images: JSON.parse(p.images || '[]') }));

    res.render('product', {
      title: product.name + ' ' + product.number + ' | ' + (content['site.name'] || 'Ритуальные товары'),
      description: content['meta.description'] || '',
      siteName: content['site.name'] || 'Ритуальные товары',
      content,
      categories,
      category,
      subcategory,
      product: parsedProduct,
      similarProducts: parsedSimilar,
      activePage: category.slug,
      catalogPage: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

// --- 404 handler ---
app.use((req, res) => {
  try {
    const content = getContent();
    const categories = getCategories();
    res.status(404).render('404', {
      title: 'Страница не найдена | ' + (content['site.name'] || 'Ритуальные товары'),
      description: '',
      siteName: content['site.name'] || 'Ритуальные товары',
      content,
      categories,
      activePage: '',
      catalogPage: false,
    });
  } catch (err) {
    res.status(404).send('Страница не найдена');
  }
});

// --- Запуск сервера ---
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
