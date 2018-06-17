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
# Note: If you haven't already, you may need to run 
#     npm login 
# with an npm account which has been granted membership to
#     https://www.npmjs.com/org/mongodb-js
# in order to download and install private npm modules like 
#     https://www.npmjs.com/package/@mongodb-js/compass-document-validation
npm install

# Build and launch the app, passing a distribution as an argument.
npm start compass
npm start compass-community
npm start compass-readonly
npm start compass-isolated
```

### Master is broken

Try:

```
rm -rf node_modules && npm cache verify && npm install && npm start
```

## Key Modules

Note this is a polylithic (as opposed to a monolithic) repository - it aims to make Compass
a minimal shell and abstract as much as possible into reusable, highly decoupled components.
Please see the mongodb-js org for all the repos: https://github.com/mongodb-js

## Building Releases

💡 Most of the time you don't need these, as [Evergreen][evergreen-compass-docs] builds them for us.

After you've made some local changes, the next thing you'll probably want to do
is create an artifact to share. There is only one command you need to run to compile the app,
sign it if the signing certificate is available on your machine, and generate a single file
installer for your current platform:

```bash
npm run release compass
npm run release compass-community
npm run release compass-readonly
npm run release compass-isolated
```

## The Release Process

Please see our [Compass Internal Docs on our release-process](https://github.com/10gen/compass-internal-docs/tree/master/release-process) for more information.

## Running Tests

```bash
# Run the entire test suite
npm test
```

For more details, see our [test README](test/README.md).

## External Plugins

Here is the current list of external plugins Compass uses and their locations.

- [@mongodb-js/compass-aggregations](https://github.com/mongodb-js/compass-aggregations)
- [@mongodb-js/compass-auth-kerberos](https://github.com/10gen/compass-auth-kerberos)
- [@mongodb-js/compass-auth-ldap](https://github.com/10gen/compass-auth-ldap)
- [@mongodb-js/compass-auth-x509](https://github.com/10gen/compass-auth-x509)
- [@mongodb-js/compass-collection-stats](https://github.com/mongodb-js/compass-collection-stats)
- [@mongodb-js/compass-connect](https://github.com/10gen/compass-connect)
- [@mongodb-js/compass-crud](https://github.com/10gen/compass-crud)
- [@mongodb-js/compass-deployment-awareness](https://github.com/mongodb-js/compass-deployment-awareness)
- [@mongodb-js/compass-document-validation](https://github.com/10gen/compass-document-validation)
- [@mongodb-js/compass-export-to-language](https://github.com/mongodb-js/compass-export-to-language)
- [@mongodb-js/compass-import-export](https://github.com/mongodb-js/compass-import-export)
- [@mongodb-js/compass-instance](https://github.com/mongodb-js/compass-instance)
- [@mongodb-js/compass-license](https://github.com/10gen/compass-license)
- [@mongodb-js/compass-plugin-info](https://github.com/mongodb-js/compass-plugin-info)
- [@mongodb-js/compass-query-bar](https://github.com/mongodb-js/compass-query-bar)
- [@mongodb-js/compass-query-history](https://github.com/mongodb-js/compass-query-history)
- [@mongodb-js/compass-server-version](https://github.com/mongodb-js/compass-server-version)
- [@mongodb-js/compass-serverstats](https://github.com/10gen/compass-serverstats)
- [@mongodb-js/compass-ssh-tunnel-status](https://github.com/mongodb-js/compass-ssh-tunnel-status)
- [@mongodb-js/compass-status](https://github.com/mongodb-js/compass-status)

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
[evergreen-compass-docs]: https://github.com/10gen/compass-internal-docs/blob/master/evergreen.md
