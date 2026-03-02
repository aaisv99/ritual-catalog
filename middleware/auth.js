'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ritual_jwt_secret_key_2024';

function authMiddleware(req, res, next) {
  let token = null;

  // Пробуем заголовок Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // Пробуем cookie adminToken
  if (!token && req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken;
  }

  if (!token) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}

module.exports = authMiddleware;
