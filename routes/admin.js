'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'ritual_jwt_secret_key_2024';

// Настройка multer для загрузки фото
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, basename + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Допустимы только изображения: jpg, jpeg, png, webp'));
    }
  },
});

// POST /admin/api/login — без авторизации
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /admin/api/me
router.get('/me', auth, (req, res) => {
  try {
    return res.json({ email: req.user.email });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- CRUD Categories ---

router.get('/categories', auth, (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY order_idx ASC').all();
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/categories', auth, (req, res) => {
  try {
    const { id, name, description, icon, slug, order_idx } = req.body;
    if (!id || !name || !slug) {
      return res.status(400).json({ error: 'id, name и slug обязательны' });
    }
    db.prepare(
      'INSERT INTO categories (id, name, description, icon, slug, order_idx) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, description || '', icon || '', slug, order_idx || 0);
    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', auth, (req, res) => {
  try {
    const { name, description, icon, slug, order_idx } = req.body;
    db.prepare(
      'UPDATE categories SET name = ?, description = ?, icon = ?, slug = ?, order_idx = ? WHERE id = ?'
    ).run(name, description || '', icon || '', slug, order_idx || 0, req.params.id);
    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Категория не найдена' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Категория не найдена' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- CRUD Subcategories ---

router.get('/subcategories', auth, (req, res) => {
  try {
    const subcategories = db.prepare(`
      SELECT s.*, c.name as category_name
      FROM subcategories s
      JOIN categories c ON s.category_id = c.id
      ORDER BY c.order_idx ASC, s.order_idx ASC
    `).all();
    return res.json(subcategories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/subcategories', auth, (req, res) => {
  try {
    const { category_id, name, description, slug, order_idx } = req.body;
    if (!category_id || !name || !slug) {
      return res.status(400).json({ error: 'category_id, name и slug обязательны' });
    }
    const result = db.prepare(
      'INSERT INTO subcategories (category_id, name, description, slug, order_idx) VALUES (?, ?, ?, ?, ?)'
    ).run(category_id, name, description || '', slug, order_idx || 0);
    const created = db.prepare('SELECT * FROM subcategories WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/subcategories/:id', auth, (req, res) => {
  try {
    const { category_id, name, description, slug, order_idx } = req.body;
    db.prepare(
      'UPDATE subcategories SET category_id = ?, name = ?, description = ?, slug = ?, order_idx = ? WHERE id = ?'
    ).run(category_id, name, description || '', slug, order_idx || 0, req.params.id);
    const updated = db.prepare('SELECT * FROM subcategories WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Подраздел не найден' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/subcategories/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM subcategories WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Подраздел не найден' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- CRUD Products ---

router.get('/products', auth, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    let where = '';
    let params = [];
    if (search) {
      where = 'WHERE (p.name LIKE ? OR p.number LIKE ?)';
      params = [`%${search}%`, `%${search}%`];
    }

    const total = db.prepare(
      `SELECT COUNT(*) as cnt FROM products p ${where}`
    ).get(...params);

    const products = db.prepare(
      `SELECT p.*, s.name as subcategory_name, s.slug as subcategory_slug,
              c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN subcategories s ON p.subcategory_id = s.id
       JOIN categories c ON s.category_id = c.id
       ${where}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    const parsedProducts = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));

    return res.json({
      products: parsedProducts,
      total: total.cnt,
      page,
      limit,
      pages: Math.ceil(total.cnt / limit),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/products', auth, (req, res) => {
  try {
    const {
      subcategory_id, number, name, slug,
      shape, shape_label, color, color_label,
      size, size_label, price, description, images, is_active,
    } = req.body;

    if (!subcategory_id || !number || !name || !slug) {
      return res.status(400).json({ error: 'subcategory_id, number, name и slug обязательны' });
    }

    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : (images || '[]');

    const result = db.prepare(`
      INSERT INTO products
        (subcategory_id, number, name, slug, shape, shape_label, color, color_label, size, size_label, price, description, images, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subcategory_id, number, name, slug,
      shape || '', shape_label || '',
      color || '', color_label || '',
      size || '', size_label || '',
      price || 0, description || '',
      imagesJson,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ ...created, images: JSON.parse(created.images || '[]') });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', auth, (req, res) => {
  try {
    const {
      subcategory_id, number, name, slug,
      shape, shape_label, color, color_label,
      size, size_label, price, description, images, is_active,
    } = req.body;

    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : (images || '[]');

    db.prepare(`
      UPDATE products SET
        subcategory_id = ?, number = ?, name = ?, slug = ?,
        shape = ?, shape_label = ?, color = ?, color_label = ?,
        size = ?, size_label = ?, price = ?, description = ?,
        images = ?, is_active = ?
      WHERE id = ?
    `).run(
      subcategory_id, number, name, slug,
      shape || '', shape_label || '',
      color || '', color_label || '',
      size || '', size_label || '',
      price || 0, description || '',
      imagesJson,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Товар не найден' });
    return res.json({ ...updated, images: JSON.parse(updated.images || '[]') });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Товар не найден' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Content ---

router.get('/content', auth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM content ORDER BY key ASC').all();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/content/:key', auth, (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'Поле value обязательно' });
    }
    db.prepare('UPDATE content SET value = ? WHERE key = ?').run(value, req.params.key);
    const updated = db.prepare('SELECT * FROM content WHERE key = ?').get(req.params.key);
    if (!updated) return res.status(404).json({ error: 'Ключ не найден' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Upload ---

router.post('/upload', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    return res.json({ url: '/uploads/' + req.file.filename });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
