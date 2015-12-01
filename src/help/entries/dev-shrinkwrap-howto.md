---
title: Shrinkwrap HOWTO
tags:
  - help
  - shrinkwrap
devOnly: true
section: Development
---

<strong>`npm shrinkwrap` is a mechanism to lock dependency versions in order to ensure repeatable builds.</strong>

"shrinkwrap" should be thought of as a deployment tool, not a developer tool. Its purpose is to lock dependency versions at a point in time so future rebuilds are repeatable, e.g. in a release branch.

## Usage

### 1. To shrinkwrap a release branch:
```
gulp clean
npm install --production
npm shrinkwrap
git add npm-shrinkwrap.json
git commit
```

It is important that you do not shrinkwrap developer dependencies. See below.

### 2. To update a dependency after shinkwrapping.

**Do not manually edit package.json.**

Instead, use npm commands:

- `npm install <package>@<specific_version>`
- `npm remove <package>`

## How "npm install" works when a shrinkwrap file is present

`npm help shrinkwrap` describes it thusly:

> The installation behavior is changed to:
>
> 1. The  module  tree  described by the shrinkwrap is reproduced. This means reproducing the structure
>    described in the file, using the specific files referenced in  "resolved"  if  available,  falling
>    back to normal package resolution using "version" if one isn't
> 
> 2. The tree is walked and any missing dependencies are installed in the usual fashion.

Notice that **the exact contents of the shrinkwrap file are reproduced** before normal "npm install" behavior kicks in.

The Compass `gulpfile.js` runs the following command inside the "build" directory:

```
npm install --production
```

All packages in npm-shrinkwrap.json will be **installed blindly** before the `--production` flag is examined. Therefore, if the shrinkwrap file contains any developer dependencies, those will be blindly installed during this --production install. This can result in runtime failures.

npm@3 as of 3.5.0 is not able to cleanly distinguish devDependencies from --production dependencies when creating the shrinkwrap file. (This is a side-effect on npm@3 package deduping). Thus, the safest way to create the shrinkwrap file is to `gulp clean`, `npm install --production`, then shrinkwrap.

## References:

- https://docs.npmjs.com/cli/shrinkwrap