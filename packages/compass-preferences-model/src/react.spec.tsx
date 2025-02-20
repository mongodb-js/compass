import React from 'react';
import { cleanup, render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { AllPreferences } from './';
import { createSandboxFromDefaultPreferences } from './index';
import { withPreferences } from './react';
import sinon from 'sinon';
import { PreferencesProvider } from './provider';

function TestComponent(props: { outerProp: number; enableMaps: boolean }) {
  return <div data-testid="props-as-json">{JSON.stringify(props)}</div>;
}

class TestComponentClass extends React.Component {
  constructor(props: { outerProp: number; enableMaps: boolean }) {
    super(props);
  }

  render() {
    return <div data-testid="props-as-json">{JSON.stringify(this.props)}</div>;
  }
}

describe('React integration', function () {
  const sandbox = sinon.createSandbox();
  afterEach(function () {
    cleanup();
    return sandbox.restore();
  });

  it('allows reading preference values and accounts for updates', async function () {
    const preferences = await createSandboxFromDefaultPreferences();
    (preferences as any).SANDBOX = 1;
    const callbacks: any = {};
    sandbox.stub(preferences, 'getPreferences').returns({
      enableMaps: true,
      trackUsageStatistics: true,
      enableFeedbackPanel: true,
    } as Partial<AllPreferences> as any);
    sandbox
      .stub(preferences, 'onPreferenceValueChanged')
      .callsFake((key, cb) => {
        callbacks[key] ??= [];
        callbacks[key].push(cb);
        return () => {
          const index = callbacks[key].indexOf(cb);
          if (index !== -1) callbacks[key].splice(index, 1);
        };
      });

    const WrappedComponent = withPreferences(TestComponent, [
      'enableMaps',
      'trackUsageStatistics',
    ]);

    render(
      <PreferencesProvider value={preferences}>
        <WrappedComponent outerProp={42} />
      </PreferencesProvider>
    );
    const contents = screen.getByTestId('props-as-json');
    expect(JSON.parse(String(contents.textContent))).to.deep.equal({
      outerProp: 42,
      enableMaps: true,
      trackUsageStatistics: true,
    });

    expect(callbacks.trackUsageStatistics).to.have.lengthOf(1);
    callbacks.trackUsageStatistics[0](false);

    expect(JSON.parse(String(contents.textContent))).to.deep.equal({
      outerProp: 42,
      enableMaps: true,
      trackUsageStatistics: false,
    });

    cleanup();
    expect(callbacks.trackUsageStatistics).to.have.lengthOf(0);
  });

  it('works with class components', async function () {
    const preferences = await createSandboxFromDefaultPreferences();
    sandbox.stub(preferences, 'getPreferences').returns({
      enableMaps: true,
      trackUsageStatistics: true,
      enableFeedbackPanel: true,
    } as Partial<AllPreferences> as any);

    const WrappedComponent = withPreferences(TestComponentClass, [
      'enableMaps',
      'trackUsageStatistics',
    ]);

    render(
      <PreferencesProvider value={preferences}>
        <WrappedComponent outerProp={42} />
      </PreferencesProvider>
    );
    const contents = screen.getByTestId('props-as-json');
    expect(JSON.parse(String(contents.textContent))).to.deep.equal({
      outerProp: 42,
      enableMaps: true,
      trackUsageStatistics: true,
    });
  });
});
