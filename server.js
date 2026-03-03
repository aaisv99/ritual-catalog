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

// Страница категории — показывает все товары с фильтрами и пагинацией
app.get('/catalog/:cat', (req, res) => {
  try {
    const content = getContent();
    const categories = getCategories();
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.cat);
    if (!category) {
      return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });
    }

    const shapes = db.prepare('SELECT * FROM subcategories WHERE category_id = ? ORDER BY order_idx ASC').all(category.id);
    const colors = db.prepare('SELECT * FROM colors ORDER BY sort_order ASC').all();
    const heights = db.prepare('SELECT * FROM heights ORDER BY sort_order ASC').all();

    const LIMIT = 10;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const shapeFilter = req.query.shape ? parseInt(req.query.shape) : null;
    const colorFilter = req.query.color ? parseInt(req.query.color) : null;
    const heightFilter = req.query.height ? parseInt(req.query.height) : null;

    const conditions = ['s.category_id = ?', 'p.is_active = 1'];
    const params = [category.id];

    if (shapeFilter) { conditions.push('p.subcategory_id = ?'); params.push(shapeFilter); }
    if (heightFilter) { conditions.push('p.height_id = ?'); params.push(heightFilter); }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    let colorJoin = '';
    let colorParam = [];
    if (colorFilter) {
      colorJoin = "JOIN json_each(p.product_colors) pc ON pc.value = ?";
      colorParam = [colorFilter];
    }

    const totalRow = db.prepare(
      `SELECT COUNT(DISTINCT p.id) as cnt FROM products p
       JOIN subcategories s ON p.subcategory_id = s.id
       ${colorJoin} ${whereClause}`
    ).get(...colorParam, ...params);

    const total = totalRow.cnt;
    const pages = Math.ceil(total / LIMIT) || 1;
    const offset = (page - 1) * LIMIT;

    const products = db.prepare(
      `SELECT DISTINCT p.*, s.name as subcategory_name, s.slug as subcategory_slug
       FROM products p
       JOIN subcategories s ON p.subcategory_id = s.id
       ${colorJoin} ${whereClause}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`
    ).all(...colorParam, ...params, LIMIT, offset);

    const parsedProducts = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      product_colors: JSON.parse(p.product_colors || '[]'),
    }));

    // Для каждого товара получаем объекты цветов
    const colorMap = {};
    colors.forEach(c => { colorMap[c.id] = c; });
    parsedProducts.forEach(p => {
      p.colorObjects = (p.product_colors || []).map(id => colorMap[id]).filter(Boolean);
    });

    res.render('category', {
      title: category.name + ' | ' + (content['site.name'] || 'Ритуальные товары'),
      description: content['meta.description'] || '',
      siteName: content['site.name'] || 'Ритуальные товары',
      content,
      categories,
      category,
      shapes,
      colors,
      heights,
      products: parsedProducts,
      total,
      page,
      pages,
      shapeFilter,
      colorFilter,
      heightFilter,
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

// Страница товара (старый URL: /catalog/:cat/:sub/:slug)
app.get('/catalog/:cat/:sub/:slug', (req, res) => {
  try {
    const content = getContent();
    const categories = getCategories();
    const allColors = db.prepare('SELECT * FROM colors ORDER BY sort_order ASC').all();
    const colorMap = {};
    allColors.forEach(c => { colorMap[c.id] = c; });

    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.cat);
    if (!category) return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });

    const subcategory = db.prepare('SELECT * FROM subcategories WHERE slug = ? AND category_id = ?').get(req.params.sub, category.id);
    if (!subcategory) return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });

    const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
    if (!product) return res.status(404).render('404', { title: '404', description: '', siteName: content['site.name'] || 'Ритуальные товары', content, categories });

    const productColors = JSON.parse(product.product_colors || '[]');
    const parsedProduct = {
      ...product,
      images: JSON.parse(product.images || '[]'),
      product_colors: productColors,
      colorObjects: productColors.map(id => colorMap[id]).filter(Boolean),
    };

    const heightObj = product.height_id ? db.prepare('SELECT * FROM heights WHERE id = ?').get(product.height_id) : null;

    const similar = db.prepare(
      'SELECT p.*, s.slug as subcategory_slug FROM products p JOIN subcategories s ON p.subcategory_id = s.id WHERE p.subcategory_id = ? AND p.id != ? AND p.is_active = 1 ORDER BY p.id DESC LIMIT 4'
    ).all(subcategory.id, product.id);
    const parsedSimilar = similar.map(p => ({ ...p, images: JSON.parse(p.images || '[]') }));

    res.render('product', {
      title: product.name + ' | ' + (content['site.name'] || 'Ритуальные товары'),
      description: content['meta.description'] || '',
      siteName: content['site.name'] || 'Ритуальные товары',
      content,
      categories,
      category,
      subcategory,
      product: parsedProduct,
      heightObj,
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
