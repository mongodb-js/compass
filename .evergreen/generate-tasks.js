#! /usr/bin/env node
'use strict';

const _ = require('lodash');

const testPackagedAppVariations = [
  {
    name: 'test-packaged-app-4',
    'test-packaged-app': {
      vars: {
        mongodb_version: 4
      }
    }
  },
  {
    name: 'test-packaged-app-5',
    'test-packaged-app': {
      vars: {
        mongodb_version: 5
      }
    }
  }
  // TODO: subsets of tests that don't relate to mongodb? ie. atlas connections or things that never connect
];

const testPackagedAppTaskTemplate = {
  // NOTE: name will be changed by testPackagedAppVariations
  name: 'test-packaged-app',
  tags: ['required-for-publish', 'run-on-pr'],
  depends_on: {
    name: 'package'
  },
  commands: [
    {
      func: 'prepare'
    },
    {
      func: 'install'
    },
    {
      func: 'bootstrap',
      vars: {
        scope: 'compass-e2e-tests'
      }
    },
    {
      func: 'apply-compass-target-expansion',
      vars: {
        compass_distribution: 'compass'
      }
    },
    {
      func: 'get-packaged-app',
      vars: {
        compass_distribution: 'compass'
      }
    },
  ]
};

const testPackagedAppCommandTemplate = {
  func: 'test-packaged-app',
  vars: {
    // NOTE: this is where we'll be mixing in vars from testPackagedAppVariations
    compass_distribution: 'compass',
    debug: 'compass-e2e-tests*,electron*,hadron*,mongo*'
  }
}


const output = { tasks: [] };

for (const variation of testPackagedAppVariations) {
  const task = _.cloneDeep(testPackagedAppTaskTemplate);
  task.name = variation.name;
  const command = _.cloneDeep(testPackagedAppCommandTemplate);
  Object.assign(command.vars, variation['test-packaged-app'].vars);
  task.commands.push(command);
  output.tasks.push(task);
}

console.log(JSON.stringify(output, null, 4));