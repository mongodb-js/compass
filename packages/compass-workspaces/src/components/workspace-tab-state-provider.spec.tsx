import {
  renderHook,
  cleanup as cleanupHooks,
} from '@mongodb-js/compass-connections/test';
import {
  useTabState,
  tabStateStore,
  TabStoreProvider,
  reset as resetTabState,
} from './workspace-tab-state-provider';
import { expect } from 'chai';

describe('useTabState', function () {
  afterEach(function () {
    cleanupHooks();
    resetTabState();
  });

  it('should set initial state value if provided', function () {
    const { result } = renderHook(
      () => {
        useTabState('test', 1);
        // Testing that only first initial state is used by passing a different
        // initial state value
        return useTabState('test', 2);
      },
      { wrapper: TabStoreProvider }
    );
    expect(result.current[0]).to.eq(1);
    expect(tabStateStore.getState()).to.deep.eq({ 'test-tab-id': { test: 1 } });
  });

  it('should update the state when setState is called', function () {
    const { result } = renderHook(() => useTabState('test', 1), {
      wrapper: TabStoreProvider,
    });

    result.current[1](2);
    expect(result.current[0]).to.eq(2);
    expect(tabStateStore.getState()).to.deep.eq({ 'test-tab-id': { test: 2 } });
  });

  it("should not re-render if value haven't changed", function () {
    let renderCount = 0;

    const { result } = renderHook(
      () => {
        ++renderCount;
        return useTabState<unknown>('test', 1);
      },
      {
        wrapper: TabStoreProvider,
      }
    );

    result.current[1](1);
    result.current[1](1);
    result.current[1](1);

    expect(renderCount).to.eq(1);

    renderCount = 0;

    // Same when value reference doesn't change
    const obj = { foo: 'bar' };

    result.current[1](obj);
    result.current[1](obj);
    result.current[1](obj);

    expect(renderCount).to.eq(1);
  });
});
