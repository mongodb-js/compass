import { expect } from 'chai';
import { renderHook } from '@testing-library/react-hooks';
import type { RenderHookResult, Renderer } from '@testing-library/react-hooks';
import sinon from 'sinon';

import { useInputLoadedVisualEffect } from './use-input-loaded-effect';

describe('use-input-loaded-effect', function () {
  it('returns no className or key as default state', function () {
    const callback = sinon.spy();
    const result = renderHook(() =>
      useInputLoadedVisualEffect({
        id: null,
        onClearEffect: callback,
      })
    );
    expect(result.result.current.key).to.equal('no-effect');
    expect(result.result.current.className).to.equal(undefined);
    expect(callback).not.to.have.been.called;
  });

  context('when a key is updated', function () {
    let callback: sinon.SinonSpy;
    let result: RenderHookResult<
      Parameters<typeof useInputLoadedVisualEffect>[0],
      ReturnType<typeof useInputLoadedVisualEffect>,
      Renderer<unknown>
    >;

    beforeEach(function () {
      callback = sinon.spy();
      result = renderHook(
        (props: Parameters<typeof useInputLoadedVisualEffect>[0]) =>
          useInputLoadedVisualEffect(props),
        {
          initialProps: {
            id: null,
            onClearEffect: callback,
            timeout: 10,
          },
        }
      );
      expect(result.result.current.key).to.equal('no-effect');
      expect(result.result.current.className).to.equal(undefined);
      expect(callback).not.to.have.been.called;
    });

    it('sets the className for a bit and then un-sets it when reset', async function () {
      result.rerender({
        id: 1,
        onClearEffect: callback,
        timeout: 10,
      });
      expect(result.result.current.key).to.equal('1');
      expect(result.result.current.className).to.not.equal(undefined);
      expect(callback).not.to.have.been.called;

      // Wait for the timeout to clear the effect.
      await result.waitForNextUpdate();
      expect(callback).to.have.been.calledOnce;
      expect(result.result.current.key).to.equal('no-effect');
      expect(result.result.current.className).to.equal(undefined);

      result.rerender({
        id: null,
        onClearEffect: callback,
        timeout: 10,
      });
      expect(result.result.current.key).to.equal('no-effect');
      expect(result.result.current.className).to.equal(undefined);
      expect(callback).to.have.been.calledOnce;
    });
  });
});
