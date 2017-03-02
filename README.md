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
npm run clean && npm install && npm test && npm start
```

## Key Modules

Note this is a polylithic (as opposed to a monolithic) repository - it aims to make Compass
a minimal shell and abstract as much as possible into reusable, highly decoupled components.
Please see the mongodb-js org for all the repos: https://github.com/mongodb-js

## The Release Process

First ensure that the branch to be released is in a releasable state by running the tests
on the branch and the building the release and manually testing it.

```bash
npm run release
```

Once this is verified, tag the release and push the branch. This will cause a new Evergreen
build to kick off on the branch that is getting released. For our purposes, we will use
1.4-releases as the branch and 1.4.1 as the release we are performing.

```bash
git checkout 1.4-releases;
git pull --rebase;
npm version patch --no-git-tag-version;
git add package.json;
git commit -m "v1.4.1";
git push origin 1.4-releases;
open https://evergreen.mongodb.com/waterfall/10gen-compass-stable;
```

When the Evergreen builds have finished running and are successful, they will upload all
release artifacts to Github and create a draft release at https://github.com/10gen/compass/releases

Edit the draft release with comments on what went in, then publish the release.

Next, you will need to update the links to the new release in the MongoDB Download center.
First download the config from s3 to your local machine:

```bash
aws s3 cp s3://info-mongodb-com/com-download-center/compass.json compass.json
```

Then edit the config by updating the versions array in the json to use the latest release number
for the `_id`, `version`, and `download_link` fields.

Next, test that the new links are publically accessible and can be downloaded from:

```bash
open https://downloads.mongodb.com/compass/mongodb-compass-1.4.1-darwin-x64.dmg
open https://downloads.mongodb.com/compass/mongodb-compass-1.4.1-win32-x64.exe
```

Next, copy the config back to s3:

```bash
aws s3 cp compass.json s3://info-mongodb-com/com-download-center/compass.json
```

The release is now in the download center!

## Running Tests

```bash
# Run the entire test suite
npm test
```

For more details, see our [test README](test/README.md).

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
