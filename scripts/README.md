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
