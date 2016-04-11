![](https://cldup.com/CtkkzVUJC6-2000x2000.png)

# hadron-build [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Tooling for Hadron apps.

## bins/commands/todos

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

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-build.svg
[travis_url]: https://travis-ci.org/mongodb-js/hadron-build
[npm_img]: https://img.shields.io/npm/v/hadron-build.svg
[npm_url]: https://npmjs.org/package/hadron-build
[npm-scripts]: https://docs.npmjs.com/misc/scripts
[spectron]: https://github.com/kevinsawicki/spectron
[electron-mocha]: https://github.com/jprichardson/electron-mocha
