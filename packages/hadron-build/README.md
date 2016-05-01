# hadron-build

> Complete tooling for large-scale [Electron](http://electron.atom.io/) apps.

[![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]


## Configuration

```json
{
  "config": {
    "hadron": {
      "build": {
        "win32": {
          "icon": "resources/win32/<your-project-id>.ico",
          "favicon_url": "https://raw.githubusercontent.com/mongodb-js/favicon/master/favicon.ico",
          "loading_gif": "resources/win32/loading.gif"
        },
        "darwin": {
          "icon": "resources/darwin/<your-project-id>.icns",
          "dmg_background": "resources/darwin/background.png",
          "codesign_identity": "Developer ID Application: <your-name> (<your-apple-developer-id>)",
          "codesign_sha1": "<your-certs-sha1>",
          "app_bundle_id": "com.<your-company>.<your-project-id>",
          "app_category_type": "public.app-category.productivity"
        }
      },
      "endpoint": "<hadron-endpoint-server-url>"
    }
  },
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

## Usage

```bash
hadron-build <command> [options]

Commands:
  release            :shipit:
  clean              Remove generated directories.
  config             Configuration.
  develop [options]  Run the app in development mode.
  test [options]     Run app tests.
  upload [options]   Upload assets from `release`.
  ui [options]       Compile the app UI.
  verify [options]   Verify the current environment meets the app's requirements.

Options:
  --help  Show help                                                    [boolean]
```

## Todo

- Tests for `release` command
- `railcars` command
- `check` command ->  `mongodb-js-precommit`
- `fmt` command ->  `mongodb-js-fmt`
- Make `test` use `xvfb-maybe` by default


## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-build.svg
[travis_url]: https://travis-ci.org/mongodb-js/hadron-build
[npm_img]: https://img.shields.io/npm/v/hadron-build.svg
[npm_url]: https://npmjs.org/package/hadron-build
[npm-scripts]: https://docs.npmjs.com/misc/scripts
[spectron]: https://github.com/kevinsawicki/spectron
[electron-mocha]: https://github.com/jprichardson/electron-mocha
