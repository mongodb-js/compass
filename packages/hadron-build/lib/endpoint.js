'use strict';

const got = require('got');

class Client {
  constructor(url) {
    this.url = url;
  }

  /**
   * Refresh GitHub releases cache.
   * @param {String} secret
   * @returns {Promise}
   */
  refresh(secret) {
    return got.post(`${this.url}/refresh`, {
      secret: secret
    });
  }

  channels() {
    return got(`${this.url}/api/v1/channel`);
  }

  channel(name) {
    return got(`${this.url}/api/v1/channel/${name}`);
  }

  branches() {
    return got(`${this.url}/api/v1/branch`);
  }

  branch(channelName) {
    return got(`${this.url}/api/v1/branch/${channelName}`);
  }

  versions() {
    return got(`${this.url}/api/v1/version`);
  }

  version(tag) {
    return got(`${this.url}/api/v1/branch/${tag}`);
  }

  releases() {
    return this.versions();
  }

  release(tag) {
    return this.version(tag);
  }

  releaseNotes(tag) {
    return got(`${this.url}/notes/${tag}`);
  }
}


// /download/channel/:channel/:platform?
// /download/version/:tag/:platform?
// /download/:tag/:filename
// /download/:platform?
//
// /update
// /update/:platform/:version
// /update/:platform/:version/RELEASES
//
// /notes/:version
// /feed/channel/:channel.atom
//
// /api/v1/channel
// /api/v1/channel/:name
//
// /api/v1/version
// /api/v1/version/:tag
//
// /api/v1/branch
// /api/v1/branch/:channel
//
// /api/v1/resolve

module.exports = (url) => {
  return new Client(url);
};

module.exports.Client = Client;
