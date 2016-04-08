# hadron-build [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Tooling for Hadron apps.

## bins/commands

"hadron-build-clean": "",
"hadron-build-config": "",
"hadron-build-config": "",
"hadron-build-release": "",
"hadron-build-start": "",
"hadron-build-test": ""

```json
{
  "check": "mongodb-js-precommit ./src/app/*.js ./src/app/**/**/*.js ./src/{app/**/*.js,main/**/*.js} ./test/*.js",
  "fmt": "mongodb-js-fmt ./*.js src/{**/*.js,*.js} test/{**/*.js,*.js}",
  "test": "xvfb-maybe hadron-build test"
}
```


```json
{
  "scripts": {
    "check": "hadron-build check",
    "ci": "npm run test",
    "clean": "hadron-build clean",
    "compile-ui": "hadron-build ui",
    "fmt": "hadron-build fmt",
    "postuninstall": "hadron-build clean",
    "release": "hadron-build release",
    "start": "hadron-build develop",
    "test": "hadron-build test",
    "test-functional": "npm test -- --functional",
    "test-unit": "npm test -- --unit",
    "test-release": "npm test -- --release"
  }
}
```

## License

Apache 2.0

# compass/scripts

This is where we define all of the tool logic to work on Compass.

[`npm scripts`][npm-scripts] are extremely powerful and sophisticated.

Each file in this directory is mapped via `./package.json` and take no arguments.
They're all just javascript bc customizing in json doesn't scale well and is not
user friendly.  

This is also in an effort to write more documentation for our
tooling as it evolves rather than not at all or ad-hoc w/o original context.

An excellent article explaining rationale for this as well as more specifics
as to how amazing npm already is for this job:

http://blog.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/

## Testing

### test-functional

Run only the expensive [spectron][spectron] acceptance tests (known issues!).

```bash
npm run test-functional
```

### test-unit

Run only the fast unit tests (e.g. `require('kerberos|keytar'`)

```bash
npm run test-unit
```

### test-renderer

Run only the unit tests which require the context available to a renderer process (shockingly easy with [electron-mocha][electron-mocha], which is wicked awesome).

```bash
npm run test-renderer
```


### test

Run all of the above (see known issues on npm run test-functional).

```bash
npm test
```

[npm-scripts]: https://docs.npmjs.com/misc/scripts
[spectron]: https://github.com/kevinsawicki/spectron
[electron-mocha]: https://github.com/jprichardson/electron-mocha


[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-build.svg
[travis_url]: https://travis-ci.org/mongodb-js/hadron-build
[npm_img]: https://img.shields.io/npm/v/hadron-build.svg
[npm_url]: https://npmjs.org/package/hadron-build
