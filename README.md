# compass [![][travis_img]][travis_url]

> Explore your MongoDB.

## Development

1. Follow the setup instructions for [OSX][setup-osx], [Windows][setup-windows] or [Linux][setup-linux].
2. Run `git clone git@github.com:10gen/compass.git ~/compass` to get the source code
3. Run `npm install` to install dependencies
4. Run `npm start` to build the app and launch it

Already setup and prefer a simple copy and paste?

```bash
git clone git@github.com:10gen/compass.git ~/compass;
cd ~/compass;
npm install;
npm start;
```

## Key Modules

<dl>
  <dt><a href="https://magnum.travis-ci.com/10gen/compass"><img src="https://magnum.travis-ci.com/10gen/compass.svg?token=q2zsnxCbboarF6KYRYxM&branch=master" height="10" /></a>&nbsp;<a href="https://github.com/10gen/compass">compass</a> </dt>
  <dd>
    The default Ampersand.js single-page application people actually interact with.
  </dd>
  <dt><a href="https://magnum.travis-ci.com/10gen/scout-client"><img src="https://magnum.travis-ci.com/10gen/scout-client.svg?token=q2zsnxCbboarF6KYRYxM&branch=master" height="10" /></a>&nbsp;<a href="https://github.com/10gen/scout-client">scout-client</a></dt>
  <dd>
    Provides a clean API for `compass` to talk to `scout-server` that works in the browser, nodejs, or electron.
  </dd>
  <dt><a href="https://magnum.travis-ci.com/10gen/scout-server"><img src="https://magnum.travis-ci.com/10gen/scout-server.svg?token=q2zsnxCbboarF6KYRYxM&branch=master" height="10" /></a>&nbsp;<a href="https://github.com/10gen/scout-server">scout-server</a></dt>
  <dd>
    An express.js application which provides REST and socket.io endpoints
    to the mongodb node.js driver.
  </dd>
  <dt><a href="https://travis-ci.org/mongodb-js/mongodb-connection-model"><img src="https://secure.travis-ci.org/mongodb-js/mongodb-connection-model.svg?branch=master" height="10" /></a>&nbsp;<a href="https://github.com/mongodb-js/mongodb-connection-model">mongodb-connection-model</a></dt>
  <dd>
    A shared Ampersand.js model used by `compass`, `scout-client`, and `scout-server` that encapsulates
    all of the business logic for generating valid parameters to hand to the driver to connect to MongoDB.
  </dd>
  <dt><a href="https://travis-ci.org/mongodb-js/mongodb-collection-sample"><img src="https://secure.travis-ci.org/mongodb-js/mongodb-collection-sample.svg?branch=master" height="10" /></a>&nbsp;<a href="https://github.com/mongodb-js/mongodb-collection-sample">mongodb-collection-sample</a></dt>
  <dd>
    Provides a single interface for `scout-server` to request a sample of documents from a collection that automatically uses the `$sample` operator if available, falling back to a client-side reservoir sample.
  </dd>
  <dt><a href="https://travis-ci.org/mongodb-js/mongodb-schema"><img src="https://secure.travis-ci.org/mongodb-js/mongodb-schema.svg?branch=master" height="10" /></a>&nbsp;<a href="https://github.com/mongodb-js/mongodb-schema">mongodb-schema</a></dt>
  <dd>
    `compass` uses `scout-client` to get a sample of documents from `scout-server` via `mongodb-collection-sample` which is piped into `mongodb-schema` to create a probabilistic representation of what the schema for a given collection most likely is.
  </dd>
</dl>


## Building Releases

After you've made some local changes, the next thing you'll probably want to do
is create an artifact to share. There is only one command you need to run to compile the app,
sign it if the signing certificate is available on your machine, and generate a single file
installer for your current platform:

```bash
cd ~/compass;
npm run release;
```

## Running Tests

1. `npm run chromedriver`
1. `npm test`

[setup-osx]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#osx-setup
[setup-windows]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#windows-setup
[setup-linux]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#linux-setup
[travis_img]: https://magnum.travis-ci.com/10gen/compass.svg?token=q2zsnxCbboarF6KYRYxM&branch=master
[travis_url]: https://magnum.travis-ci.com/10gen/compass
