# compass/scripts

This is where we define all of the tool logic to work on Compass.

[`npm scripts`][npm-scripts] are extremely powerful and sophisticated.

Each file in this directory is mapped via `./package.json` and take no arguments.
They're all just javascript bc customizing in json doesn't scale well and is not
user friendly.  

This is also in an effort to write more documentation for our
tooling as it evolves rather than not at all or ad-hoc w/o original context.

An excellent article explaining rationale for this as well as more specifics
as to how amazing npm already is for this job:

http://blog.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/

[npm-scripts]: https://docs.npmjs.com/misc/scripts
