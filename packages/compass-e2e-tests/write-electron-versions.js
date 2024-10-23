const fs = require('fs');
fs.writeFileSync(
  'electron-versions.json',
  JSON.stringify(process.versions),
  'utf8'
);
process.exit();
