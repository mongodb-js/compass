import { expect } from 'chai';
import sinon from 'sinon';
import { createBrowserHistory } from 'history';
import type { History } from 'history';
import { renderHook } from '@mongodb-js/testing-library-compass';
import { useSyncHistory } from './use-sync-history';

describe('useSyncHistory', function () {
  let history: History;
  let canNavigate: boolean;
  let unmount: () => void;

  // Mimics a regular link click: browser creates a history entry without
  // history package knowing about it
  function navigateUntracked(path: string) {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new window.PopStateEvent('popstate', { state: null }));
  }

  beforeEach(function () {
    window.history.replaceState(null, '', '/explorer');
    history = createBrowserHistory();
    canNavigate = true;
    const hook = renderHook(() => useSyncHistory(history));
    hook.result.current.onBeforeUnloadCallbackRequest(() => canNavigate);
    unmount = hook.unmount;
  });

  afterEach(function () {
    unmount();
    sinon.restore();
  });

  describe('when navigating to an entry not created by history', function () {
    it('should navigate without confirmation when nothing is modified', function () {
      const confirm = sinon.stub(window, 'confirm');

      navigateUntracked('/clusters');

      expect(confirm).to.not.have.been.called;
      expect(history.location.pathname).to.eq('/clusters');
    });

    it('should navigate when user confirms leaving modified content', function () {
      canNavigate = false;
      const confirm = sinon.stub(window, 'confirm').returns(true);

      navigateUntracked('/clusters');

      expect(confirm).to.have.been.calledOnce;
      expect(history.location.pathname).to.eq('/clusters');
    });

    it('should restore previous location when user cancels navigation', function () {
      canNavigate = false;
      const confirm = sinon.stub(window, 'confirm').returns(false);

      navigateUntracked('/clusters');

      expect(confirm).to.have.been.calledOnce;
      expect(history.location.pathname).to.eq('/explorer');
      expect(window.location.pathname).to.eq('/explorer');
    });

    it('should keep blocking navigation after navigating inside data explorer', function () {
      navigateUntracked('/explorer/foo');
      expect(history.location.pathname).to.eq('/explorer/foo');

      canNavigate = false;
      const confirm = sinon.stub(window, 'confirm').returns(false);

      history.push('/clusters');

      expect(confirm).to.have.been.calledOnce;
      expect(history.location.pathname).to.eq('/explorer/foo');
    });
  });
});
