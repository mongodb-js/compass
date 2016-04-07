---
title: Compass Auto Updates and Release Channels
tags:
  - auto-update
devOnly: true
section: Development
---

We are following [Atom's model](http://blog.atom.io/2015/10/21/introducing-the-atom-beta-channel.html).

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
