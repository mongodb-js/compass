import { Cursor, AggregationCursor, toIterator } from './index';
import chai, { expect } from 'chai';
import sinon from 'ts-sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

describe('toIterator', () => {
  it('provides forEach for an array', async() => {
    const iterator = sinon.spy();
    const arr = [1, 2, 3];
    await toIterator(arr).forEach(iterator);
    expect(iterator).to.have.been.calledThrice;
    expect(iterator).to.have.been.calledWith(1, 0, arr);
    expect(iterator).to.have.been.calledWith(2, 1, arr);
    expect(iterator).to.have.been.calledWith(3, 2, arr);
  });

  for (const Cls of [ Cursor, AggregationCursor ]) {
    it(`provides forEach for ${Cls.name}`, async() => {
      const iterator = sinon.spy();
      const tryNext = sinon.stub();
      tryNext.onFirstCall().resolves({ a: 1 });
      tryNext.onSecondCall().resolves({ a: 2 });
      tryNext.onThirdCall().resolves(null);
      const cursor = new Cls(null as any, { tryNext, closed: true } as any);
      const asIterated = toIterator(cursor);
      await asIterated.forEach(iterator);
      expect(iterator).to.have.been.calledTwice;
      expect(iterator).to.have.been.calledWith({ a: 1 }, 0, cursor);
      expect(iterator).to.have.been.calledWith({ a: 2 }, 1, cursor);
      expect((asIterated as any).isClosed()).to.equal(true);
    });
  }
});
