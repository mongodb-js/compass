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

// there will be a task (from testPackagedAppVariationsf) per build variant
const allTestPackagedAppTasks = [];

const buildVariants = [
  {
    name: 'windows',
    display_name: 'Windows',
    run_on: 'windows-vsCurrent-large'
  },
  {
    name: 'ubuntu',
    display_name: 'Ubuntu',
    run_on: 'ubuntu2004-large' // will be overridden to ubuntu1604-large for package below
  },
  {
    name: 'rhel',
    display_name: 'RHEL',
    run_on: 'rhel76-large'
  }
];

const packageVariants = buildVariants.map((buildVariant) => {
  return {
    ...buildVariant,
    name: `${buildVariant.name}_package`,
    display_name: `${buildVariant.name} (Test and Package)`,
    run_on: buildVariant.name === 'ubuntu' ? 'ubuntu1604-large' : buildVariant.run_on
  }
});

const e2eVariants = buildVariants.map((buildVariant) => {
  return {
    ...buildVariant,
    name: `${buildVariant.name}_e2e`,
    display_name: `${buildVariant.name} (E2E)`,
  }
});

for (const e2eVariant of e2eVariants) {
  e2eVariant.tasks = [];
  for (const task of testPackagedAppVariations) {
    // 4.0 enterprise and 4.2 enterprise are not supported on Ubuntu 20.04
    // https://docs.google.com/spreadsheets/d/1-sZKW70HbVt2yHOWa18qwBwi-gBcn54tWmronnn89kI/edit#gid=0
    if (e2eVariant.name === 'ubuntu_e2e' && task.name.match(/^test-packaged-app-4[02]x-enterprise/)) {
      continue;
    }

    // package ubuntu on 1604, test on 2004
    const dependVariantName = e2eVariant.name === 'ubuntu_e2e' ? 'ubuntu_package' : `${e2eVariant.name.replace(/_e2e/, '_package')}`;
    const variantTask = Object.assign({}, task, { dependVariantName, name: `${e2eVariant.name}_${task.name}` });

    allTestPackagedAppTasks.push(variantTask);
    e2eVariant.tasks.push(variantTask);
  }
}

const input = fs.readFileSync(process.argv[2], 'utf8');

process.stdout.write(template(input));