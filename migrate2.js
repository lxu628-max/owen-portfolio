const db = require('better-sqlite3')('./db/database.sqlite');
const geoip = require('geoip-lite');

const rows = db.prepare('SELECT id, visitor_ip FROM page_views').all();
console.log('Total rows to process:', rows.length);

const updateStmt = db.prepare('UPDATE page_views SET city=?, region=?, country=? WHERE id=?');

for (const row of rows) {
  let ip = row.visitor_ip || '';
  ip = ip.replace('::ffff:', '');
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    updateStmt.run('本地', '', '中国');
    console.log('ID', row.id, ': local');
    continue;
  }
  const geo = geoip.lookup(ip);
  if (geo) {
    updateStmt.run(geo.city || '', geo.region || '', geo.country || '');
    console.log('ID', row.id, ':', geo.city, geo.region, geo.country);
  } else {
    console.log('ID', row.id, ': no geo found for', ip);
  }
}

db.close();
console.log('Done');
