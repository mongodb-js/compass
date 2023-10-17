# compass-serverstats [![][npm_img]][npm_url]

> Compass Real Time Server Stats Component

## Installation

In the `package.json`:

```json
  "dependencies": {
    "compass-serverstats": "10gen/compass-serverstats",
  }
```

## Usage

```js
const d3 = require('d3');
const realTimeLineChart = require('compass-serverstats').d3.realTimeLineChart;

const el = document.getElementById('myChart');
const data = {
  dataSets: [
    {
      line: 'virtual',
      count: [2.48, 2.48, 2.49],
      active: true,
    },
    {
      line: 'resident',
      count: [0.02, 0.02, 0.02],
      active: true,
    },
    {
      line: 'mapped',
      count: [0, 0, 0],
      active: true,
    },
  ],
  localTime: [
    '2016-10-30T07:12:05.077Z',
    '2016-10-30T07:12:06.069Z',
    '2016-10-30T07:12:07.153Z',
  ],
  skip: [false, false, false],
  yDomain: [0, 2.49],
  xLength: 60,
  labels: {
    title: 'memory',
    keys: ['vsize', 'resident', 'mapped'],
    yAxis: 'GB',
  },
  keyLength: 6,
  paused: false,
};

d3.select(el).datum(data).call(realTimeLineChart());
```

## Features

#### Electron

Validate and test your component in an Electron window, styles included. The source automatically compiles and the window content reloads when any file under `./src` changes.

To start Electron and render your component, type `npm start`.

#### Enzyme

The test environment is configured to test components with [Enzyme][enzyme] (including full `mount` mode through [jsdom][jsdom]) and [enzyme-chai][enzyme-chai]. See the test folder for examples. Run `npm test` to execute the test suite.

## Developing

Almost all of your development will happen in the `./src` directory. Add new components
to `./src/components`, actions to `./src/actions/index.js` and if you need additional stores, add them to `./src/stores`.

#### Directory Structure

For completeness, below is a list of directories present in this module:

- `electron` code to start electron, open a browser window and load the source. You don't usually need to touch this, unless you want to render something other than the main component in Electron.
- `lib` compiled version of your components (plain javascript instead of `jsx`) and styles (`css` instead of `less`). Never change anything here as this entire folder gets automatically created and overwritten.
- `src` components, actions and stores source code, as well as style files. This is the place to implement your own components. `npm run compile` will use `./src` as input and create `./lib`.
- `test` implement your tests here, and name the files `*.test.js`.

[npm_img]: https://img.shields.io/npm/v/mongodb-component-template.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-component-template
[enzyme]: http://airbnb.io/enzyme/
[enzyme-chai]: https://github.com/producthunt/chai-enzyme
[jsdom]: https://github.com/tmpvar/jsdom
