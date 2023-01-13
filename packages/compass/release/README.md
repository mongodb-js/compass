# Compass release CLI scripts

This folder contains the release automation relevant to the local machine of developers.

It is meant to be integrated with the NPM scripts of the compass repo and automate the management of compass releases.

## Tests

Run `npm run test-release-tasks` to run the tests in this folder.

## Available commands

### `checkout`

```sh
npm run release checkout <MAJOR.MINOR>
```

Only runnable from main. Checks out (creating it if not existing) a `MAJOR.MINOR-releases` branch.

```sh
npm run release checkout 1.22
```

### `beta`

```sh
npm run release beta
```

Only runnable from a release branch. It bumps the version to a new beta and pushes it triggering the release.

The new prerelease version is calculated according to the branch name and previous version as follows:

- If the release branch is `1.22` and `package.version < 1.22.0`, it will create `1.22.0-beta.0`.
- When package.version is `1.22.0-beta.0`, do `1.22.0-beta.1`.
- When package.version is `1.22.1` do `1.22.2-beta.0`.

### `ga`

```sh
npm run release ga
```

Only runnable from a release branch. It bumps the version to the next ga and pushes it triggering the release.

The new version is calculated according to the branch name and previous version as follows:

- If the release branch is `1.22` and `package.version < 1.22.0`, it will create 1.22.0.
- When package.version is `1.22.0-beta.0`, do `1.22.0`.
- When package.version is `1.22.1` do `1.22.2`.

### `wait`

```sh
npm run release wait
```

Only runnable from a release branch. It waits for all the assets of a release to be uploaded.

### `changelog`

```sh
npm run release changelog
```

Only runnable from a release branch. Prints the git log between a release and the previous one. Cleans duplicated commits and tag commits.

- If the new release is a GA it will print the log from the previos GA skipping any beta in between.
- If the new release is a beta it will print the log from a previous release of any kind (GA or beta).
