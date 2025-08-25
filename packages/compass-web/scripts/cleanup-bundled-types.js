#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const typesFile = path.join(__dirname, '../dist/index.d.ts');
let content = fs.readFileSync(typesFile, 'utf8');

// eslint-disable-next-line no-console
console.log('Starting comprehensive cleanup of bundled types...');

// Count initial problematic imports
const initialWhatwgMatches = (content.match(/whatwg-url/g) || []).length;
const initialEventEmitterMatches = (content.match(/eventemitter3/g) || [])
  .length;
const initialRelativeMatches = (content.match(/^import.*from.*['"]\./gm) || [])
  .length;
const initialMongoJsMatches = (content.match(/from\s+['"]@mongodb-js\//g) || [])
  .length;

// eslint-disable-next-line no-console
console.log(
  `Initial counts - whatwg-url: ${initialWhatwgMatches}, eventemitter3: ${initialEventEmitterMatches}, relative imports: ${initialRelativeMatches}, @mongodb-js imports: ${initialMongoJsMatches}`
);

// 1. Remove whatwg-url imports and replace references
content = content.replace(
  /import\s*\{\s*URL\s*as\s*URL_2\s*\}\s*from\s*['"]whatwg-url['"];\s*\n?/g,
  ''
);
content = content.replace(
  /import\s*\{\s*URL\s*\}\s*from\s*['"]whatwg-url['"];\s*\n?/g,
  ''
);
content = content.replace(/\bURL_2\b/g, 'URL');

// 2. Remove eventemitter3 imports and replace with Node.js EventEmitter
content = content.replace(
  /import\s*\{\s*default\s+as\s+EventEmitter_2\s*\}\s*from\s*['"]eventemitter3['"];\s*\n?/g,
  ''
);
content = content.replace(
  /import\s*\{\s*EventEmitter\s*\}\s*from\s*['"]eventemitter3['"];\s*\n?/g,
  ''
);
content = content.replace(
  /import\s*EventEmitter\s*from\s*['"]eventemitter3['"];\s*\n?/g,
  ''
);
content = content.replace(/\bEventEmitter_2\b/g, 'NodeJS.EventEmitter');

// 3. Fix duplicate type references (remove _2, _3, etc. suffixes)
content = content.replace(/\b([A-Za-z_][A-Za-z0-9_]*?)_2\b/g, '$1');
content = content.replace(/\b([A-Za-z_][A-Za-z0-9_]*?)_3\b/g, '$1');
content = content.replace(/\b([A-Za-z_][A-Za-z0-9_]*?)_4\b/g, '$1');

// 4. Remove relative imports that API Extractor couldn't resolve
content = content.replace(/^import.*from\s*['"][./].*['"];\s*\n?/gm, '');

// 5. Remove remaining @mongodb-js imports that weren't bundled (deep path imports)
content = content.replace(
  /^import\s+\{[^}]+\}\s+from\s+['"]@mongodb-js\/[^'"]+['"];\s*\n?/gm,
  ''
);
content = content.replace(
  /^import\s+[^{][^;]+from\s+['"]@mongodb-js\/[^'"]+['"];\s*\n?/gm,
  ''
);

// 6. Fix ambient context issues by removing statements in declare blocks
content = content.replace(
  /declare\s+namespace\s+[^{]+\s*\{[^}]*\bexport\s*\{[^}]*\}\s*;?\s*([^}]*)\}/g,
  (match) => {
    // Remove export statements from within declare namespace blocks
    return match.replace(/export\s*\{[^}]*\}\s*;?\s*/g, '');
  }
);

// 7. Fix event emitter method return types
content = content.replace(
  /(\s+)(on|off|removeListener)\([^)]*\):\s*any;/g,
  '$1$2(...args: any[]): this;'
);

// 8. Remove problematic type assertions and fix generic types
content = content.replace(/: AppRegistry<[^>]*>/g, ': AppRegistry');

// 9. Fix module resolution issues for mongodb-log-writer
content = content.replace(
  /from\s*['"]mongodb-log-writer\/mongo-log-writer['"]/g,
  "from 'mongodb-log-writer'"
);

// 10. Remove or fix value/type confusion
content = content.replace(
  /(\s+)([a-zA-Z_][a-zA-Z0-9_]*)\s+refers\s+to\s+a\s+value.*?Did you mean typeof.*?\n/g,
  ''
);

// 11. Add necessary imports at the top if we reference Node.js types
if (
  content.includes('NodeJS.EventEmitter') &&
  !content.includes('/// <reference types="node" />')
) {
  content = '/// <reference types="node" />\n' + content;
}

// Count final problematic imports
const finalWhatwgMatches = (content.match(/whatwg-url/g) || []).length;
const finalEventEmitterMatches = (content.match(/eventemitter3/g) || []).length;
const finalRelativeMatches = (content.match(/^import.*from.*['"]\./gm) || [])
  .length;
const finalMongoJsMatches = (content.match(/from\s+['"]@mongodb-js\//g) || [])
  .length;

// eslint-disable-next-line no-console
console.log(
  `Final counts - whatwg-url: ${finalWhatwgMatches}, eventemitter3: ${finalEventEmitterMatches}, relative imports: ${finalRelativeMatches}, @mongodb-js imports: ${finalMongoJsMatches}`
);

fs.writeFileSync(typesFile, content);
// eslint-disable-next-line no-console
console.log('Successfully cleaned up bundled types file');
