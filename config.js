/**
 * Owen Portfolio - 集中配置（安全相关项在此强制校验）
 *
 * 安全原则：
 * 1. 任何密钥（JWT_SECRET）/ 管理员初始密码（ADMIN_PASSWORD）缺失即拒绝启动，
 *    禁止硬编码默认值，避免公开仓库导致可被伪造 token / 弱密码登录。
 * 2. 生产环境务必通过部署平台（Render / 阿里云）注入这些环境变量。
 */

// 加载 .env（本地开发 / 生产均可用；部署平台直接注入环境变量时 .env 不存在则自动跳过）
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('[FATAL] 环境变量 JWT_SECRET 未设置或过短（至少 16 位），拒绝启动。');
  console.error('        生成方式: openssl rand -hex 32');
  process.exit(1);
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error('[FATAL] 环境变量 ADMIN_PASSWORD 未设置或过短（至少 8 位），拒绝启动。');
  console.error('        禁止默认弱密码 admin123，请用强随机值注入。');
  process.exit(1);
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

// 生产环境跨域白名单，逗号分隔多个域名。为空时 CORS 放开（仅限本地开发）。
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

// Token 有效期，默认 12 小时
const SESSION_EXPIRE = process.env.SESSION_EXPIRE || '12h';

module.exports = { JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, ALLOWED_ORIGIN, SESSION_EXPIRE };
