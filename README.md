# scout

Explore your MongoDB.

## Developing

1. Follow the setup instructions for [OSX][setup-osx], [Windows][setup-windows] or [Linux][setup-linux].
2. Clone this repo
3. Run `npm install` to install dependencies
4. Run `npm start` to launch

## Modules

The top level modules in this project are:

<dl>
  <dt><a href="https://github.com/10gen/scout/tree/dev/">scout</a></dt>
  <dd>
    This repo which acts as the package that glues everything together.
  </dd>
    <dt><a href="https://github.com/10gen/scout/tree/dev/scout-brain">scout-brain</a></dt>
  <dd>
    Needs to be broken down into topic based models but for now, this is where
    all the business logic code lives we want to share between modules running
    in the browser, nodejs, or electron.
  </dd>
  <dt><a href="https://github.com/10gen/scout/tree/dev/scout-ui">scout-ui</a></dt>
  <dd>
    The default Ampersand.js single-page application people actually interact with.
    The <a href="https://github.com/10gen/scout/blob/dev/scout-ui/src/models/with-scout.js">WithScout</a> mixin
    connects the <a href="https://github.com/10gen/scout/tree/dev/scout-ui/src/models">models</a> to
    <a href="https://github.com/10gen/scout/tree/dev/scout-client">scout-client</a>.
  </dd>
  <dt><a href="https://github.com/10gen/scout/tree/dev/scout-client">scout-client</a></dt>
  <dd>
    Provides a clean API for <a href="https://github.com/10gen/scout/tree/dev/scout-server">scout-server</a>
    that works in the browser, nodejs, or electron.
  </dd>
  <dt><a href="https://github.com/10gen/scout/tree/dev/scout-server">scout-server</a></dt>
  <dd>
    An express.js application which provides REST and socket.io connectivity
    to the mongodb node.js driver.
  </dd>
  <dt><a href="https://github.com/10gen/scout/tree/dev/scout-electron">scout-electron</a></dt>
  <dd>
    Tooling for working with electron.  Also provides progressive enhancement
    for scout when running inside an electron instance (e.g. OS menu bindings,
    window management, breakpad, autoupdates).
  </dd>
</dl>

### Other Modules

<dl>
  <dt><a href="https://github.com/10gen/scout/tree/dev/scout-landing-page">scout-landing-page</a></dt>
  <dd>
    A <a href="http://www.metalsmith.io/">metalsmith</a> static site to use
    for building Scout's landing page. Move to <code>mongodb-js/scout-landing-page</code>
  </dd>
  <dt><a href="https://github.com/10gen/scout/tree/dev/scout-style">scout-style</a></dt>
  <dd>
    All of the base LESS, icons, and fonts <a href="https://github.com/10gen/scout/tree/dev/scout-ui">scout-ui</a>
    and <a href="https://github.com/10gen/scout/tree/dev/scout-landing-page">scout-landing-page</a> use.
    Move to <code>mongodb-js/scout-style</code> so design team can completely
    own this.
  </dd>
</dl>



[setup-osx]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#osx-setup
[setup-windows]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#windows-setup
[setup-linux]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#linux-setup
