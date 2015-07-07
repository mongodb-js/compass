# scout

Explore your MongoDB.

## Developing

1. Follow the setup instructions for [OSX][setup-osx], [Windows][setup-windows] or [Linux][setup-linux].
2. Clone this repo
3. Run `npm install` to install dependencies
4. Run `npm start` to launch

## Modules

<dl>
  <dt><a href="https://github.com/10gen/scout">scout</a></dt>
  <dd>
    The default Ampersand.js single-page application people actually interact with.
    <a href="https://github.com/10gen/scout/blob/dev/src/models/scout-client-mixin.js">ScoutClientMixin</a>
    connects the <a href="https://github.com/10gen/scout/tree/dev/src/models">models</a> to
    <a href="https://github.com/mongodb-js/scout-client">scout-client</a>.
  </dd>
    <dt><a href="https://github.com/mongodb-js/scout-brain">scout-brain</a></dt>
  <dd>
    Needs to be broken down into topic based models but for now, this is where
    all the business logic code lives we want to share between modules running
    in the browser, nodejs, or electron.
  </dd>
  <dt><a href="https://github.com/mongodb-js/scout-client">scout-client</a></dt>
  <dd>
    Provides a clean API for <a href="https://github.com/mongodb-js/scout-server">scout-server</a>
    that works in the browser, nodejs, or electron.
  </dd>
  <dt><a href="https://github.com/mongodb-js/scout-server">scout-server</a></dt>
  <dd>
    An express.js application which provides REST and socket.io connectivity
    to the mongodb node.js driver.
  </dd>
</dl>

[setup-osx]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#osx-setup
[setup-windows]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#windows-setup
[setup-linux]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#linux-setup
