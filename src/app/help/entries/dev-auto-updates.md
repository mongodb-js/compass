---
title: Compass Auto Updates and Release Channels
tags:
  - auto-update
devOnly: true
section: Development
---

We are following [Atom's model](http://blog.atom.io/2015/10/21/introducing-the-atom-beta-channel.html).

This week, we’re introducing a beta release channel for Atom and making some changes to our development workflow to improve productivity and the stability of releases. Instead of cutting releases directly from the master branch as we’ve done in the past, all changes will now spend time being tested in a beta phase, giving us more time to catch any regressions that slip through our automated test suite before releasing them to the world. If you like to live on the bleeding edge, using Atom Beta as your main editor is a great way to help us improve Atom. In exchange for encountering and reporting on occasional bugs, you’ll gain faster access to new features and performance improvements.

The Problem

Releasing straight from master worked pretty well for a while. It kept our mental model simple and minimized the time for getting improvements into the hands of users. Unfortunately, when regressions found their way into master, releasing directly off our development branch caused major disruptions in our workflow.

Often, a day or more would pass between a release and the discovery of some corner-case regression by a user. In the meantime, we might have merged another large pull request into master, leaving ourselves in a situation where in order to ship a fix the original regression, we needed to also ship a bunch of new code that had been on master for a very short amount of time, presenting the risk of yet more regressions.

In response to this kind of scenario, we started being much more cautious about merging code into master following a release, and when releasing large changes, this delay could easily extend for several days. This introduced coordination overhead, because now in order to merge a pull request, it wasn’t enough to know the code was ready. It was also important to know whether or not we had released recently and how likely that release was to contain a regression. These delays also introduced integration risk by delaying the opportunity to test multiple pull requests in combination with one another.

Finally, in the old system, new code only spent a very short amount of time in front of a very small and homogenous audience before being released to the world. We needed a way to test changes with a bigger, more diverse set of users, but still a group that had self-selected and was willing to experience a bit of instability.

The Solution

If you’ve read about how the Chrome and Rust teams handle their releases, our new strategy should sound familiar. We’re introducing two new branches, beta, corresponding to the new Atom Beta release channel, and stable, from which all general Atom releases will be built.

Diagram

At a regular cadence, we’ll merge the latest changes from master into beta and cut a new release on the beta channel with a pre-release version number. For example, our first beta release was 1.1.0-beta0. New development will continue on master, but if we get reports of any regressions on the beta channel, we can fix them directly on beta and cut a new release with an incremented version number, such as 1.1.0-beta1, 1.1.0-beta2, etc.

When we feel beta has stabilized, we’ll merge the contents of the beta branch into stable and cut a new stable release with a version derived by removing the betaN pre-release suffix. Then we will again merge new changes from master into beta, repeating the cycle. We plan to bump the minor version on every stable release, and if we need to fix regressions that survive through the beta phase, we’ll bump the patch number and re-release on stable to fix them.

The key idea is that as code makes its way through this pipeline, it becomes increasingly stable, because riskier changes on master don’t affect beta and stable. These branches only get bug fixes, which means that users on the stable channel experience fewer bugs.

A Note To Package Authors

One thing worth noting is that as a package author, please always favor your packages working correctly on Atom’s stable channel. If there’s a new API you’d like to use in beta, consider adding some conditional code so your package works on both channels. Alternatively, you could publish a pre-release version of your package and prevent it from being installed on the previous stable channel release by specifying the version range in the engines field of your package.json to include a specific beta channel version but excludes stable, such as ^1.1.0-beta1.

## Help Wanted

We hope you’ll consider giving MongoDB Compass Beta a spin. Usually, you should find that it’s a better experience, with features and performance improvements that haven’t been released yet on our stable channel. Every now and then you’ll find a bug. Please report it! Then switch back to the stable channel until we have a chance to issue a patch release. With your help, we can improve the stability of Atom’s releases even as we accelerate the pace of development.


![](http://blog.atom.io/img/posts/release-pipeline-diagram.png)

There are 2 slight variations we've adopted for Compass.

First, we will not have a `beta` and `stable` branch as the Atom team
describes above.  Instead, we will maintain a mapping of what branch a given
channel should currently map to that will be available via
`https://compass.mongodb.com/api/v1/branch`.

Second, we will merge the latest changes from `master` into a new release
branch the `beta` channel will point to every 6 weeks (2 sprints).  We'll refer
to this process just as the Atom team does: "roll the railcars".

## FAQ

### When does the stable channel change and what is the result?

When we "roll the railcars".

### So we will have a separate branch for each release? Like release-1.1 will sit there forever and we will just add more and more branches?

Yes. When a minor release takes place, a new branch is created 1.<minor>-releases. If there are subsequent patch releases required, they are applied to the affected minor version's release branch.

### How do we migrate Compass onto this model?

`release-1.0.0` branch currently has `version=1.0.0`. This is currently the `stable` channel.

`release-1.1` branch currently has `version=1.1.4-testing` will be updated to `version=1.1.0-beta4`.  This is the`beta` channel.

`master` branch will be updated to `version=1.2.0-dev`. This is the`dev` channel.

### What happens if a critical fix is required for a release that has already been published?

These hotfixes will be committed to the corresponding release branch because the need is to get that release green, and master may have new code already that doesn't apply anymore.

After a new release (patch or preminor) is published, the release manager will make a judgement call as to whether the hotfix needs a "forward-port" ticket to apply the hotfix back to `master`.

In general, the frequency of these "forward-port" tickets will be immensely low.  For the most part, we will strive to push responsibility for this problem down to the package manager level such that a hotfix can be resolved merely by publishing a new patch version of the affected package.

### Do you increase patch version numbers already during beta phase (yellow channel), or only once you hit stable (green)?

Patch version numbers do not change during the beta phase.  It is equivalent to `npm version prerelease`. So `1.x.0-beta[1-3]` (three published releases on the beta channel) becomes `1.x.0` once it hits stable (green).  You can see how versions and channels change over time by looking at the [versions in Atom’s release notes](https://atom.io/releases).

### What happens to old release branches?

Current thought is that these release branches live on forever. That being said, looking out ~24 months, we will adopt a similar policy to managing releases on a long-term window,  as the Kernel team currently does with it’s EOL policy and node.js/atom are working on with Long-Term Support Releases.

### Will you always get the latest available version on that channel when you auto-update?

Yes!  To reword your original thought, that’s why you are 6 weeks ahead if you decide to use to the beta channel. If you decide to use the dev channel, you will just get the latest nightly build. The dev channel is currently just a placeholder. It will be unused until we have the proper resources and demonstrated need to support it. Until then, merely cloning the repository and building the application locally will suffice.

### Shut up and give me an example

Atom currently has 3 minor release branches: 1.5-releases, 1.6-releases, and 1.7-releases.  1.7.0 is the current stable version.  When there is a critical fix, it’s applied to the 1.7-releases branch and the version is updated to 1.7.1 (essentially npm version patch).  A new GitHub release of 1.7.1 is created along with the git tag v1.7.1,  the links in the mongodb.com download center are updated to point to 1.7.1 assets, user’s that have opted-in to auto updates will receive a prompt that a new version is available and they can update to the new 1.7.1 with 1 click which restarts the application.

### Does the application need to be restarted to see the results of an auto-update reflected in the application? Atom seems to update without restart, which is nice.

Yes, it does need to be restarted.  The default behavior (which Atom uses) is a full restart and we will use the same underlying mechanism.

### Will there be a rollback mechanism to a previous version?

While technically possible, this is going to be incredibly expensive and burdensome both to test and maintain in the future.  As such, we have no intention of supporting rollbacks at this time.

### Will there be a way to pin a specific version instead of only installing "latest"? I imagine big enterprises might need to vet specific versions before anything can get installed.

Yes.

### Will we have a "manual update path" in place in case we bodge the auto-update itself and people are stuck on that broken version?

Not at this time.  Users will be required to Uninstall and Reinstall the Application from scratch.  OS X users may have their preferences preserved in this case.  Windows users will not as the user's data directory is explicitly removed as part of the Uninstallation process.

In the future, we could prevent the loss of user data if we had a remote service user data to could be synchronized to.  This is one of the many reasons we believe we should prioritize our work on a "MongoDB Account" as it would enable this functionality.

### If we use GitHub Releases, do we have to serve from their CDN?

No. Initially we will upload release artifacts to both GitHub (for the auto updater) and S3 (for the MongoDB.com Download Center).  While we have no immediate needs or plans to de-duplicate this process, it is a trivial change to make.

### Who is maintaining the update server; devops or the Compass team?

The server will be deployed to devops production deis cluster so they will be managing the underlying infrastructure. The Compass Team will maintain the code for the server and control deployment using deis' builtin, self-serve capabilities.

### When an auto update is delivered, is the full 65MB binary sent across the network or just the difference?

The behavior differs by platform.  When the user is notified that an update is available on OS X, a zip file of the contents of the .app directory is downloaded.  On Windows, there is built in support for sending just the difference.

### Is it possible for users to opt-out of auto updates in a way we can guarantee no network requests will be made until it is enabled?

Yes. We can check for updates at any time, at which point a network request occurs.

### How does update from an old version to several versions ahead work? Is that possible? Or do we have to do the (sad) MongoDB way of installing each individual version separately due to schema migrations?

Migrations in Compass are handled in across any version range change w/ a single restart of the application.

### Can Compass be published to the Mac App Store?

While technically possible, we have no plans currently to support distributing or updating Compass via the Mac App Store at this time.  For more details, please see [this blog post from the Electron team](http://blog.atom.io/2015/11/05/electron-updates-mac-app-store-and-windows-auto-updater.html).

### What is the relationship between `NODE_ENV` and channels?

None. The `NODE_ENV` environment variable is a convention the node.js community has established for declaring a high-level mode of operation.  If the `NODE_ENV` is not set, it defaults to `process.env.NODE_ENV = 'production';`. For more details, please see the [React](https://facebook.github.io/react/downloads.html#npm) or [Express](http://expressjs.com/en/api.html#app.settings.table) documentation.
