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
  const guiMachine = runOnOptions.run_on_gui ?? defaultRunOn;
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

  for (const variantConfig of config.buildVariants) {
    const {run_on: runOn, name: variantName, ...variantOptions} = variantConfig;

    const variant = {
      name: variantName,
      display_name: variantOptions.display_name,
      patchable: variantOptions.patchable ?? true,
      run_on: runOn,
      tasks: Object.entries(config.tasks).flatMap(([taskId, taskOptions]) => {
        if (taskOptions.skip_on && taskOptions.skip_on.includes(variantName)) {
          return [];
        }

        if (taskOptions.only_on && !taskOptions.only_on.includes(variantName)) {
          return [];
        }


        if (taskOptions.variants) {
        return taskOptions.variants
            .filter((variantOptions) => {
              return !variantOptions.skip_on?.includes(variantName);
            })
            .filter((variantOptions) => {
              return (!variantOptions.only_on) || variantOptions.only_on.includes(variantName);
            })
            .map((variantOptions) => {
              return generateBuildVariantTask(
                `${taskOptions.name}-${variantOptions.name}`,
                taskOptions,
                variantOptions,
                runOn,
                variantConfig
              );
            });
        }
        return generateBuildVariantTask(
          taskId,
          taskOptions,
          {},
          runOn,
          variantOptions
        );
      })
    };

    variants.push(variant);
  }

  return variants;
}

function generateTasks() {
  const tasks = {};

  for (const [taskName, taskConfig] of Object.entries(
    config.tasks
  )) {
    for (const taskVariant of (taskConfig.variants ?? [])) {
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
