# Compass release CLI scripts

This folder contains the release automation relevant to the local machine of developers.

It is meant to be integrated with the NPM scripts of the compass repo and automate the management of compass releases.

## Tests

Run `npm run test-release-tasks` to run the tests in this folder.

## Available commands

### `checkout`

``` sh
npm run release checkout <MAJOR.MINOR>
```

Only runnable from main. Checks out (creating it if not existing)  a `MAJOR.MINOR-releases` branch.

``` sh
npm run release checkout 1.22
```

### `beta`

``` sh
npm run release beta
```

Only runnable from a release branch. It bumps the version to a new beta and pushes it triggering the release.

The new prerelease version is calculated according to the branch name and previous version as follows:

- If the release branch is `1.22` and `package.version < 1.22.0`, it will create `1.22.0-beta.0`.
- When package.version is `1.22.0-beta.0`, do `1.22.0-beta.1`.
- When package.version is `1.22.1` do `1.22.2-beta.0`.

### `ga`

``` sh
npm run release ga
```

Only runnable from a release branch. It bumps the version to the next ga and pushes it triggering the release.

The new version is calculated according to the branch name and previous version as follows:

- If the release branch is `1.22` and `package.version < 1.22.0`, it will create 1.22.0.
- When package.version is `1.22.0-beta.0`, do `1.22.0`.
- When package.version is `1.22.1` do `1.22.2`.

### `wait`

``` sh
npm run release wait
```

Only runnable from a release branch. It waits for all the assets of a release to be uploaded.

### `changelog`

``` sh
npm run release changelog
```

Only runnable from a release branch. Prints the git log between a release and the previous one. Cleans duplicated commits and tag commits.

- If the new release is a GA it will print the log from the previos GA skipping any beta in between.
- If the new release is a beta it will print the log from a previous release of any kind (GA or beta).

### `publish`

``` sh
npm run release publish
```

Only runnable from a release branch. It completes the release by uploading a new
download center configuration and making sure the associated github release is published.

This command is retryable. Issuing `run release publish` on an older release
will not break newer releases.

**NOTE:** this command requires the following environment variables to be set:

- `MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID`
- `MONGODB_DOWNLOADS_AWS_SECRET_ACCESS_KEY`

It will perform the following tasks:

1. Make sure that all the assets are reacheable.
2. Downloads and patches the download center configuration with the
   new version. If the old release is >= than the current one skips this step.
3. Waits for a draft github release to be available.
4. Prompts to publish the github release if not published.
5. Waits for the github release to be published.
