# compass [![][travis_img]][travis_url]

> Explore your MongoDB.

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

Note: This is needs to be updated more, e.g. we use [Evergreen](https://evergreen.mongodb.com/) now.

A part of the process is to create the release in GitHub:
<img src="https://camo.githubusercontent.com/b8ea7c3a2381f253843c7da5708335bf96db8c31/68747470733a2f2f646c2e64726f70626f7875736572636f6e74656e742e636f6d2f752f32323731303638392f536f2532307768656e2532306275696c64696e672532306125323072656c65617365253230776865726525323077652532306163636964656e74616c6c792532307461676765642532306d617374657225324325323074686973253230697325323077686174253230776525323073686f756c6425323068617665253230646f6e652532302d25323053637265656e25323053686f74253230323031362d31302d31332532306174253230352e31382e3434253230706d5f736d616c6c2e706e67" />

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

[setup-mac-os]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#mac-os-setup
[setup-windows]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#windows-setup
[setup-linux]: https://github.com/mongodb-js/mongodb-js/blob/master/docs/setup.md#linux-setup
[travis_img]: https://magnum.travis-ci.com/10gen/compass.svg?token=q2zsnxCbboarF6KYRYxM&branch=master
[travis_url]: https://magnum.travis-ci.com/10gen/compass
