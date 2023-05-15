import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import { render, cleanup, screen } from '@testing-library/react';

import StageSeparator from '../stage-separator';
import type { StageSeparatorProps } from '../stage-separator';

const renderStageSeparator = (props: Partial<StageSeparatorProps>) => {
  render(
    <StageSeparator
      index={0}
      renderUseCaseDropMarker={false}
      variant="icon"
      onAddStage={Sinon.spy()}
      {...props}
    />
  );
};

describe('StageSeparator', function () {
  afterEach(cleanup);

  it('renders a drop marker when renderUseCaseDropMarker is true and variant === icon', function () {
    renderStageSeparator({
      index: 1,
      variant: 'icon',
      renderUseCaseDropMarker: true,
    });
    expect(screen.getByTestId(`use-case-drop-marker-1`)).to.not.throw;
  });

  it('renders a drop marker when renderUseCaseDropMarker is true and variant === button', function () {
    renderStageSeparator({
      index: 1,
      variant: 'button',
      renderUseCaseDropMarker: true,
    });
    expect(screen.getByTestId(`use-case-drop-marker-1`)).to.not.throw;
  });

  it('does not render a drop marker when renderUseCaseDropMarker is false', function () {
    renderStageSeparator({
      index: 1,
      variant: 'icon',
      renderUseCaseDropMarker: false,
    });
    expect(screen.queryByTestId(`use-case-drop-marker-1`)).to.be.null;
  });
});
