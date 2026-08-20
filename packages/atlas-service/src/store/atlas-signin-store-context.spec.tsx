import React from 'react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import { renderHook } from '@mongodb-js/testing-library-compass';
import type { AnyAction } from 'redux';
import {
  AtlasSignInStoreContext,
  useAtlasSignedInUser,
  useIsAtlasSignInStateResolved,
} from './atlas-signin-store-context';
import { AtlasSignInActions } from './atlas-signin-reducer';
import { configureStore } from './atlas-signin-store';

function renderWithState(actions: AnyAction[]) {
  const store = configureStore({ atlasAuthService: {} as any });
  for (const action of actions) {
    store.dispatch(action);
  }
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store} context={AtlasSignInStoreContext}>
      {children}
    </Provider>
  );
  return {
    store,
    isResolved: renderHook(() => useIsAtlasSignInStateResolved(), { wrapper })
      .result,
    signedInUser: renderHook(() => useAtlasSignedInUser(), { wrapper }).result,
  };
}

const RESTORING = [{ type: AtlasSignInActions.RestoringStart }];
const SUCCESS = [
  { type: AtlasSignInActions.RestoringStart },
  { type: AtlasSignInActions.RestoringSuccess, userInfo: { sub: '1234' } },
];

describe('useIsAtlasSignInStateResolved', function () {
  const cases: [string, AnyAction[], boolean][] = [
    ['initial', [], false],
    ['restoring', RESTORING, false],
    // A manual sign in attempt started while restoring makes the reducer
    // discard the restoring result, so until this attempt settles we still
    // don't know whether the user is signed in.
    ['in-progress', [...RESTORING, { type: AtlasSignInActions.Start }], false],
    [
      'unauthenticated',
      [...RESTORING, { type: AtlasSignInActions.RestoringFailed }],
      true,
    ],
    ['success', SUCCESS, true],
    [
      'error',
      [
        { type: AtlasSignInActions.Start },
        { type: AtlasSignInActions.Error, error: 'Whoops!' },
      ],
      true,
    ],
    ['canceled', [{ type: AtlasSignInActions.Cancel }], true],
  ];

  for (const [state, actions, expected] of cases) {
    it(`should return ${String(
      expected
    )} for the '${state}' state`, function () {
      const { store, isResolved } = renderWithState(actions);
      expect(store.getState()).to.have.property('state', state);
      expect(isResolved.current).to.eq(expected);
    });
  }

  it('should not report a resolved state while a sign in started during restore is still in flight', function () {
    const { store, isResolved, signedInUser } = renderWithState([
      ...RESTORING,
      { type: AtlasSignInActions.Start },
      // The restore finishes after the manual attempt started, the reducer
      // ignores it
      { type: AtlasSignInActions.RestoringSuccess, userInfo: { sub: '1234' } },
    ]);
    expect(store.getState()).to.have.property('state', 'in-progress');
    // The user looks signed out here, so anything acting on that (telemetry,
    // for example) has to wait for the state to resolve
    expect(signedInUser.current).to.eq(null);
    expect(isResolved.current).to.eq(false);
  });
});
