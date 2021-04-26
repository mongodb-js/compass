import { textEncodingPolyfill } from './whatwg-url';
import { expect } from 'chai';

describe('TextDecoder/TextEncoder polyfill', () => {
  it('does simplistic UTF-8 encoding/decoding', () => {
    const { TextEncoder, TextDecoder } = textEncodingPolyfill();
    // This test was written in winter.
    const str = '☃️';
    expect(new TextDecoder().decode(new TextEncoder().encode(str))).to.equal(str);
  });
});
