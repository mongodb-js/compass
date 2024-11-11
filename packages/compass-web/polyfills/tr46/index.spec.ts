import { expect } from 'chai';
import { toASCII } from './index';

// Keep in sync with https://github.com/jsdom/tr46/blob/main/scripts/getLatestTests.js when updating whatwg-url
const wptSHA = '72b915d4b3754f081ef5899bf6a777efe71b2fc5';

describe('tr46 polyfill', function () {
  describe('toASCII', function () {
    let tests: { input: string; output: string }[] = [];

    before(async function () {
      tests = await fetch(
        `https://raw.githubusercontent.com/web-platform-tests/wpt/${wptSHA}/url/resources/toascii.json`
      ).then((res) => res.json());
    });

    it('should pass wpt specs', function () {
      for (const test of tests) {
        // String items are just comments in the test data
        if (typeof test === 'string') {
          return;
        }
        expect(toASCII(test.input)).to.eq(test.output);
      }
    });
  });
});
