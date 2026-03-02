'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/content → объект {key: value}
router.get('/content', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM content').all();
    const result = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/categories → массив категорий
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY order_idx ASC').all();
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/categories/:slug → одна категория + её subcategories
router.get('/categories/:slug', (req, res) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    const subcategories = db.prepare(
      'SELECT * FROM subcategories WHERE category_id = ? ORDER BY order_idx ASC'
    ).all(category.id);
    return res.json({ ...category, subcategories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/subcategories/:subcategorySlug?category=:categorySlug → подраздел + его products
router.get('/subcategories/:subcategorySlug', (req, res) => {
  try {
    const { subcategorySlug } = req.params;
    const { category: categorySlug } = req.query;

    let subcategory;
    if (categorySlug) {
      const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(categorySlug);
      if (!category) {
        return res.status(404).json({ error: 'Категория не найдена' });
      }
      subcategory = db.prepare(
        'SELECT * FROM subcategories WHERE slug = ? AND category_id = ?'
      ).get(subcategorySlug, category.id);
    } else {
      subcategory = db.prepare('SELECT * FROM subcategories WHERE slug = ?').get(subcategorySlug);
    }

    if (!subcategory) {
      return res.status(404).json({ error: 'Подраздел не найден' });
    }

    const products = db.prepare(
      'SELECT * FROM products WHERE subcategory_id = ? AND is_active = 1 ORDER BY number ASC'
    ).all(subcategory.id);

    const parsedProducts = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));

    return res.json({ ...subcategory, products: parsedProducts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/product/:slug → один товар + похожие
router.get('/product/:slug', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const parsedProduct = {
      ...product,
      images: JSON.parse(product.images || '[]'),
    };

    const similar = db.prepare(
      'SELECT * FROM products WHERE subcategory_id = ? AND id != ? AND is_active = 1 ORDER BY number ASC LIMIT 4'
    ).all(product.subcategory_id, product.id);

    const parsedSimilar = similar.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));

    return res.json({ ...parsedProduct, similarProducts: parsedSimilar });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/search?q=... → поиск по name, number
router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }
    const like = `%${q}%`;
    const products = db.prepare(
      `SELECT p.*, s.name as subcategory_name, s.slug as subcategory_slug,
              c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN subcategories s ON p.subcategory_id = s.id
       JOIN categories c ON s.category_id = c.id
       WHERE (p.name LIKE ? OR p.number LIKE ?) AND p.is_active = 1
       ORDER BY p.number ASC
       LIMIT 20`
    ).all(like, like);

    const result = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
