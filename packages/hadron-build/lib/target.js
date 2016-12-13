'use strict';

const _ = require('lodash');
const semver = require('semver');

class Target {
  constructor(opts) {
    this.name = opts.name;
    this.slug = this.name;
    this.productName = opts.productName || opts.name;
    this.version = opts.version;
    this.platform = opts.platform || process.platform;
    this.arch = opts.arch || process.arch;

    this.semver = new semver.SemVer(this.version);

    this.channel = 'stable';
    // extract channel from version string, e.g. `beta` for `1.3.5-beta.1`
    const mtch = this.version.match(/-([a-z]+)(\.\d+)?$/);
    if (mtch) {
      this.channel = mtch[1].toLowerCase();
      this.slug += `-${this.channel}`;
    }

    /**
     * Add `channel` suffix to product name, e.g. "Atom Beta".
     */
    if (this.channel !== 'stable') {
      this.productName += ' ' + _.capitalize(this.channel);
    }
  }
}

module.exports = Target;
