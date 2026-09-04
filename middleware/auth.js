/**
 * JWT 认证中间件
 * 注意：当前 server.js 使用内联 authMiddleware，本文件保留作备用。
 * JWT_SECRET 统一从 config.js 读取（缺失即拒绝启动，不再写死默认值）。
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
