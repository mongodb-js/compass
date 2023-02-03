#! /usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const config = require('./config.json');

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
  asJs += '; return result; })()';
  return eval(asJs);
}

function generateBuildVariantTask(
  taskName,
  taskOptions,
  variantOptions,
  defaultRunOn,
  runOnOptions
) {
  const task = { name: taskName };
  const guiMachine = runOnOptions.gui ?? defaultRunOn;
  if (taskOptions.depends_on) {
    task.depends_on = taskOptions.depends_on;
  }
  if (taskOptions.gui && guiMachine !== defaultRunOn) {
    task.run_on = guiMachine;
  }
  if (variantOptions.run_on_override?.[task.run_on ?? defaultRunOn]) {
    task.run_on = variantOptions.run_on_override[task.run_on ?? defaultRunOn];
  }
  return task;
}

function generateBuildVariants() {
  const variants = [];

  for (const runOn of config.variants.run_on) {
    const [runOnName, runOnOptions = {}] = Array.isArray(runOn)
      ? runOn
      : [runOn];

    const variant = {
      name: config.run_on_alias.short[runOnName],
      display_name: config.run_on_alias.long[runOnName],
      run_on: runOnName,
      tasks: config.variants.tasks.flatMap((task) => {
        const [taskName, taskOptions = {}] = Array.isArray(task)
          ? task
          : [task];

        if (taskOptions.skip_on && taskOptions.skip_on.includes(runOnName)) {
          return [];
        }

        if (config.tasks.variants[taskName]) {
          return config.tasks.variants[taskName]
            .filter((variantOptions) => {
              return !variantOptions.skip_on?.includes(runOnName);
            })
            .map((variantOptions) => {
              return generateBuildVariantTask(
                `${taskName}-${variantOptions.name}`,
                taskOptions,
                variantOptions,
                runOnName,
                runOnOptions
              );
            });
        }

        return generateBuildVariantTask(
          taskName,
          taskOptions,
          {},
          runOnName,
          runOnOptions
        );
      })
    };

    variants.push(variant);
  }

  return variants;
}

function generateTasks() {
  const tasks = {};

  for (const [taskName, taskVariants] of Object.entries(
    config.tasks.variants
  )) {
    for (const taskVariant of taskVariants) {
      const task = {
        name: `${taskName}-${taskVariant.name}`,
        vars: taskVariant.vars
      };

      tasks[taskName] ??= [];
      tasks[taskName].push(task);
    }
  }

  return tasks;
}

const buildVariants = generateBuildVariants();
const tasks = generateTasks();

const inputs = process.argv[2]
  ? [process.argv[2]]
  : [
      path.resolve(__dirname, 'buildvariants.in.yml'),
      path.resolve(__dirname, 'tasks.in.yml')
    ];

for (const inputPath of inputs) {
  const input = fs.readFileSync(inputPath, 'utf8');
  fs.writeFileSync(inputPath.replace(/\.in\.yml$/, '.yml'), template(input));
}
