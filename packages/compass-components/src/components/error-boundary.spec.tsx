import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { ErrorBoundary } from './error-boundary';

function ComponentThatThrowsError(): React.ReactElement {
  const a: any = {};

  return <div>{a.throwAnErrorNow()}</div>;
}

describe('ErrorBoundary', function () {
  let onErrorSpy: sinon.SinonSpy;

  before(function () {
    if (process.env.COMPASS_DISABLE_ERROR_BOUNDARY === 'true') {
      this.skip();
    }
  });

  beforeEach(function () {
    onErrorSpy = sinon.spy();
  });

  afterEach(cleanup);

  it('should render content', function () {
    render(
      <ErrorBoundary>
        <div>Displayed</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Displayed')).to.be.visible;
  });

  it('should render an error message when an error occurs in the rendered child', function () {
    render(
      <ErrorBoundary>
        <ComponentThatThrowsError />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(
        'An error occurred while rendering: a.throwAnErrorNow is not a function'
      )
    ).to.be.visible;
  });

  it('should render an error message with the display name', function () {
    render(
      <ErrorBoundary displayName="ErroringComponent">
        <ComponentThatThrowsError />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(
        'An error occurred while rendering ErroringComponent: a.throwAnErrorNow is not a function'
      )
    ).to.be.visible;
  });

  it('should call the onError function when an error occurs and its passed', function () {
    render(
      <ErrorBoundary onError={onErrorSpy}>
        <ComponentThatThrowsError />
      </ErrorBoundary>
    );

    expect(onErrorSpy.callCount).to.equal(1);
    expect(onErrorSpy.firstCall.args[0].message).to.contain(
      'a.throwAnErrorNow'
    );
  });

  it('should not call the onError function when no error occurs', function () {
    render(
      <ErrorBoundary onError={onErrorSpy}>
        <div>Displayed</div>
      </ErrorBoundary>
    );

    expect(onErrorSpy.callCount).to.equal(0);
  });
});
