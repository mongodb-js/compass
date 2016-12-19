# compass [![][travis_img]][travis_url]

Explore your MongoDB.

## Development

1. Follow the setup instructions for [macOS][setup-mac-os], [Windows][setup-windows] or [Linux][setup-linux].
1. [Set up SSH](https://help.github.com/articles/which-remote-url-should-i-use/#cloning-with-ssh-urls)
1. Then copy/paste:

```bash
# Get the source code by cloning the compass repository
git clone git@github.com:10gen/compass.git

# Change directory into the newly cloned repo
cd compass

# Install dependencies
npm install

# Build and launch the app
npm start
```

### Master is broken

Try:

```
npm install && COMPILE_CACHE=false npm start

# If master is really, really, really broken, 
# like you've been playing with npm link and npm unlink
npm run clean && npm install && COMPILE_CACHE=false npm start
```

## Key Modules

Note this is a polylithic (as opposed to a monolithic) repository - it aims to make Compass a minimal shell and abstract as much as possible into reusable, highly decoupled components. A few prominent ones include:

<dl>
  <dt><a href="https://magnum.travis-ci.com/10gen/compass"><img src="https://magnum.travis-ci.com/10gen/compass.svg?token=q2zsnxCbboarF6KYRYxM&branch=master" height="10" /></a>&nbsp;<a href="https://github.com/10gen/compass">compass</a> </dt>
  <dt><a href="https://travis-ci.org/mongodb-js/connection-model"><img src="https://secure.travis-ci.org/mongodb-js/connection-model.svg?branch=master" height="10" /></a>&nbsp;<a href="https://github.com/mongodb-js/connection-model">mongodb-connection-model</a></dt>
  <dt><a href="https://travis-ci.org/mongodb-js/collection-sample"><img src="https://secure.travis-ci.org/mongodb-js/collection-sample.svg?branch=master" height="10" /></a>&nbsp;<a href="https://github.com/mongodb-js/collection-sample">mongodb-collection-sample</a></dt>
  <dt><a href="https://travis-ci.org/mongodb-js/mongodb-schema"><img src="https://secure.travis-ci.org/mongodb-js/mongodb-schema.svg?branch=master" height="10" /></a>&nbsp;<a href="https://github.com/mongodb-js/mongodb-schema">mongodb-schema</a></dt>
</dl>


## Building Releases

After you've made some local changes, the next thing you'll probably want to do
is create an artifact to share. There is only one command you need to run to compile the app,
sign it if the signing certificate is available on your machine, and generate a single file
installer for your current platform:

```bash
cd compass
npm run release
```

## Running Tests

Just run `npm test`.

To run just what TravisCI runs [locally](https://engineering.canva.com/2015/03/25/hermeticity/):

    npm run ci

## Code Quality Tools

The following are employed by the Compass team:

* Evergreen, how we build Compass:
 - Your JIRA login should grant access to https://evergreen.mongodb.com/waterfall/10gen-compass-master
 - You can also [use the command line tool](https://github.com/evergreen-ci/evergreen/wiki/Using-the-command-line-tool)
* [TravisCI](https://travis-ci.com/10gen/compass) - runs continuous integration tests, PRs should only be merged if they keep it green
* [Greenkeeper](https://greenkeeper.io/) - Creates pull requests to update submodules (i.e. @ [greenkeeperio-bot](https://github.com/greenkeeperio-bot) creates PRs to remind you and the Compass team to propagate submodule updates upwards through the Compass dependency tree)
* [Bugsnag](https://app.bugsnag.com/mongodb/mongodb-compass/) - Reminds us to fix errors customers are experiencing
* [Intercom](https://app.intercom.io/a/apps/p57suhg7/) - Allows us to get feedback directly from customers and work with them via chat messages

[setup-mac-os]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#mac-os-setup
[setup-windows]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#windows-setup
[setup-linux]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#linux-setup
[travis_img]: https://magnum.travis-ci.com/10gen/compass.svg?token=q2zsnxCbboarF6KYRYxM&branch=master
[travis_url]: https://magnum.travis-ci.com/10gen/compass
