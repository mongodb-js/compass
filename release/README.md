# Compass release CLI scripts

This folder contains the release automation relevant to the local machine of developers.

It is meant to be integrated with the NPM scripts of the compass repo and automate the management of compass releases.

## Available commands

### `checkout`

```
npm run release checkout <MAJOR.MINOR>
```

Only runnable from master. Creates (if not existing) and checks out a `MAJOR.MINOR-releases` branch.

```
npm run release checkout 1.22
```

### `beta`

```
npm run release beta
```

Only runnable from a release branch. It bumps the version to a new beta and pushes it triggering the release.

The new prerelease version is calculated according to the branch name and previous version as follows:

- If the release branch is `1.22` and `package.version < 1.22.0`, it will create `1.22.0-beta.0`.
- When package.version is `1.22.0-beta.0`, do `1.22.0-beta.1`.
- When package.version is `1.22.1` do `1.22.2-beta.0`.

### `ga`

```
npm run release ga
```

Only runnable from a release branch. It bumps the version to the next ga and pushes it triggering the release.

The new version is calculated according to the branch name and previous version as follows:

- If the release branch is `1.22` and `package.version < 1.22.0`, it will create 1.22.0.
- When package.version is `1.22.0-beta.0`, do `1.22.0`.
- When package.version is `1.22.1` do `1.22.2`.
