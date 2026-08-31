const db = require('better-sqlite3')('./db/database.sqlite');

// Check if columns already exist
const cols = db.prepare("PRAGMA table_info(page_views)").all().map(c => c.name);
console.log('Current columns:', cols.join(', '));

if (!cols.includes('city')) {
  db.exec("ALTER TABLE page_views ADD COLUMN city TEXT DEFAULT ''");
  console.log('Added city column');
}
if (!cols.includes('region')) {
  db.exec("ALTER TABLE page_views ADD COLUMN region TEXT DEFAULT ''");
  console.log('Added region column');
}
if (!cols.includes('country')) {
  db.exec("ALTER TABLE page_views ADD COLUMN country TEXT DEFAULT ''");
  console.log('Added country column');
}

// Backfill existing records
const geoip = require('geoip-lite');
const rows = db.prepare("SELECT id, visitor_ip FROM page_views WHERE visitor_ip != '' AND visitor_ip != '::1'").all();
for (const row of rows) {
  const ip = row.visitor_ip.replace('::ffff:', '');
  const geo = geoip.lookup(ip);
  if (geo) {
    db.prepare("UPDATE page_views SET city=?, region=?, country=? WHERE id=?")
      .run(geo.city || '', geo.region || '', geo.country || '');
    console.log('ID', row.id, ':', geo.city, geo.region, geo.country);
  }
}

db.close();
console.log('Migration complete');
