#! /usr/bin/env node
'use strict';

const fs = require('fs');


function template(input) {
  // PHP-like syntax, except it's JS.
  // foo: <% for (let i = 0; i < 10; i++) { %>
  //   - index: <% out(i) %>
  // <% } %>
  // is turned into a YAML list with index: 0, index: 1 etc.

  let asJs = `(function() { let result = "";
    const out = (val) => result += (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;`;
  let i = 0;
  while (i < input.length) {
    const opening = input.indexOf('<%', i);
    if (opening === -1) {
      asJs += `out(${JSON.stringify(input.slice(i))});\n`;
      break;
    }
    asJs += `out(${JSON.stringify(input.slice(i, opening))});\n`;
    const closing = input.indexOf('%>', opening + 2);
    if (closing === -1) break;
    asJs += input.slice(opening + 2, closing) + ';\n';

    i = closing + 2;
  }
  asJs += '; return result; })()'
  return eval(asJs);
}


const testPackagedAppVariations = [
  {
    name: 'test-packaged-app-40x-community',
    'test-packaged-app': {
      vars: {
        mongodb_version: '4.0.x'
      }
    }
  },
  {
    name: 'test-packaged-app-40x-enterprise',
    'test-packaged-app': {
      vars: {
        mongodb_version: '4.0.x',
        mongodb_use_enterprise: 'yes'
      }
    }
  },
  {
    name: 'test-packaged-app-42x-community',
    'test-packaged-app': {
      vars: {
        mongodb_version: '4.2.x'
      }
    }
  },
  {
    name: 'test-packaged-app-42x-enterprise',
    'test-packaged-app': {
      vars: {
        mongodb_version: '4.2.x',
        mongodb_use_enterprise: 'yes'
      }
    }
  },
  {
    name: 'test-packaged-app-44x-community',
    'test-packaged-app': {
      vars: {
        mongodb_version: '4.4.x'
      }
    }
  },
  {
    name: 'test-packaged-app-44x-enterprise',
    'test-packaged-app': {
      vars: {
        mongodb_version: '4.4.x',
        mongodb_use_enterprise: 'yes'
      }
    }
  },
  {
    name: 'test-packaged-app-5x-community',
    'test-packaged-app': {
      vars: {
        mongodb_version: '5.x.x'
      }
    }
  },
  {
    name: 'test-packaged-app-5x-enterprise',
    'test-packaged-app': {
      vars: {
        mongodb_version: '5.x.x',
        mongodb_use_enterprise: 'yes'
      }
    }
  }
];

const buildVariants = [
  {
    name: 'windows',
    display_name: 'Windows (Test and Package)',
    run_on: 'windows-vsCurrent-large'
  },
  {
    name: 'ubuntu',
    display_name: 'Ubuntu (Test and Package)',
    run_on: 'ubuntu2004-large'
  },
  {
    name: 'rhel',
    display_name: 'RHEL (Test and Package)',
    run_on: 'rhel76-large'
  }
];

for (const buildVariant of buildVariants) {
  buildVariant.tasks = [];
  for (const task of testPackagedAppVariations) {
    buildVariant.tasks.push(task);
  }
}

const input = fs.readFileSync(process.argv[2], 'utf8');

process.stdout.write(template(input));