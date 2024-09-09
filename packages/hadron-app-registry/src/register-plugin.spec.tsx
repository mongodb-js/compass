import React, { createContext, useContext } from 'react';
import { cleanup, render } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  AppRegistryProvider,
  registerHadronPlugin,
  createActivateHelpers,
  createServiceLocator,
} from './';
import { createStore } from 'redux';
import { connect } from 'react-redux';
import { EventEmitter } from 'events';

describe('registerHadronPlugin', function () {
  afterEach(cleanup);

  it('allows registering plugins with a reflux-ish store', function () {
    const component = sinon.stub().callsFake(() => <></>);
    const activate = sinon.stub().returns({ store: { state: { foo: 'bar' } } });
    const Plugin = registerHadronPlugin({
      name: 'refluxish',
      component,
      activate,
    });
    expect(Plugin.displayName).to.equal('refluxish');
    render(
      <AppRegistryProvider>
        <Plugin />
      </AppRegistryProvider>
    );
    expect(activate).to.have.been.calledOnce;
    expect(activate.firstCall.args[0]).to.deep.equal({});
    expect(activate.firstCall.args[1]).to.have.property('localAppRegistry');
    expect(activate.firstCall.args[1]).to.have.property('globalAppRegistry');
    expect(component).to.have.been.calledOnceWith({
      store: { state: { foo: 'bar' } },
      actions: undefined,
      foo: 'bar',
    });
  });

  it('allows registering plugins with a proper reflux store', function () {
    const component = sinon.stub().callsFake(() => <></>);
    const store = { state: { foo: 'bar' } };
    const activate = sinon.stub().returns({ store });
    const Plugin = registerHadronPlugin({
      name: 'reflux',
      component,
      activate,
    });
    expect(Plugin.displayName).to.equal('reflux');
    render(
      <AppRegistryProvider>
        <Plugin />
      </AppRegistryProvider>
    );
    expect(activate).to.have.been.calledOnce;
    expect(activate.firstCall.args[0]).to.deep.equal({});
    expect(activate.firstCall.args[1]).to.have.property('localAppRegistry');
    expect(activate.firstCall.args[1]).to.have.property('globalAppRegistry');
    expect(component).to.have.been.calledOnceWith({
      store,
      actions: undefined,
      foo: 'bar',
    });
  });

  it('allows registering plugins with a redux store', function () {
    const connector = connect(({ counter }) => ({ counter }));
    const component = sinon.stub().callsFake(() => <></>);
    const store = createStore(
      (state: { counter: number } | undefined, action: { type: 'inc' }) => {
        state ??= { counter: 0 };
        if (action.type === 'inc') return { counter: state.counter + 1 };
        return state;
      }
    );
    const activate = sinon.stub().returns({ store });
    const Plugin = registerHadronPlugin({
      name: 'redux',
      component: connector(component),
      activate,
    });
    expect(Plugin.displayName).to.equal('redux');
    render(
      <AppRegistryProvider>
        <Plugin />
      </AppRegistryProvider>
    );
    expect(activate).to.have.been.calledOnce;
    expect(activate.firstCall.args[0]).to.deep.equal({});
    expect(activate.firstCall.args[1]).to.have.property('localAppRegistry');
    expect(activate.firstCall.args[1]).to.have.property('globalAppRegistry');
    expect(component).to.have.been.calledWith({
      counter: 0,
      dispatch: store.dispatch,
    });
    store.dispatch({ type: 'inc' });
    expect(component).to.have.been.calledWith({
      counter: 1,
      dispatch: store.dispatch,
    });
  });

  it('allows registering a plugin with external services dependencies', function () {
    const dummy = { value: 'blah' };
    const blahContext = createContext(dummy);
    const useBlah = createServiceLocator(() => useContext(blahContext));

    const connector = connect();
    const component = sinon.stub().callsFake(() => <></>);
    const store = createStore(() => ({}));
    const activate = sinon.stub().returns({ store });
    const Plugin = registerHadronPlugin(
      {
        name: 'service1',
        component: connector(component),
        activate,
      },
      {
        blah: useBlah,
      }
    );
    expect(Plugin.displayName).to.equal('service1');
    render(
      <AppRegistryProvider>
        <Plugin />
      </AppRegistryProvider>
    );
    expect(activate.firstCall.args[1]).to.have.property('blah', dummy);
  });
});

describe('ActivateHelpers', function () {
  describe('on', function () {
    it('should subscribe to event emitter', function () {
      const helpers = createActivateHelpers();
      const emitter = new EventEmitter();
      expect(emitter.listenerCount('foo')).to.eq(0);
      helpers.on(emitter, 'foo', () => {});
      expect(emitter.listenerCount('foo')).to.eq(1);
    });
  });

  describe('cleanup', function () {
    it('should remove listeners registered with on', function () {
      const helpers = createActivateHelpers();
      const emitter = new EventEmitter();
      helpers.on(emitter, 'foo', () => {});
      helpers.cleanup();
      expect(emitter.listenerCount('foo')).to.eq(0);
    });
  });

  describe('addCleanup', function () {
    it('should add custom cleanup function and call it when cleanup is called', function () {
      const helpers = createActivateHelpers();
      const cleanupFn = sinon.spy();
      helpers.addCleanup(cleanupFn);
      helpers.cleanup();
      expect(cleanupFn).to.have.been.calledOnce;
    });
  });
});
