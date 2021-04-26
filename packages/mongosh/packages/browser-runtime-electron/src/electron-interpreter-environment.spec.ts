import { ElectronInterpreterEnvironment } from './electron-interpreter-environment';
import { expect } from 'chai';

describe('IframeRuntime', () => {
  describe('#sloppyEval', () => {
    it('evaluates code in context', async() => {
      const env = new ElectronInterpreterEnvironment({ x: 2 });
      expect(env.sloppyEval('x + 1')).to.equal(3);
    });
  });

  describe('#getContextObject', () => {
    it('returns context', async() => {
      const env = new ElectronInterpreterEnvironment({ x: 2 });
      expect(env.getContextObject().x).to.equal(2);
    });
  });
});
