import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../stores/store';
import { FocusModeStageEditor } from './focus-mode-stage-editor';

const renderFocusModeStageEditor = (
  props: Partial<ComponentProps<typeof FocusModeStageEditor>> = {},
) => {
  render(
    <Provider store={configureStore({
      sourcePipeline: [{$match: {_id: 1}}, {$limit: 10}, {$out: 'out'}]
    })}>
      <FocusModeStageEditor
        index={-1}
        operator={null}
        {...props}
      />
    </Provider>
  );
};

describe('FocusMode', function () {
  it('does not render editor when stage index is -1', function () {
    renderFocusModeStageEditor({ index: -1 });
    expect(() => {
      screen.getByTestId('stage-operator-combobox')
    }).to.throw;
    expect(() => {
      screen.getByText(/open docs/i)
    }).to.throw;
  });

  context('when operator is not defined', function () {
    beforeEach(function () {
      renderFocusModeStageEditor({
        index: 0, operator: null
      });
    });

    it.skip('renders stage dropdown', function () {
      const dropdown = screen.getByTestId('stage-operator-combobox');
      expect(dropdown).to.exist;
    });

    it('does not render docs link', function () {
      expect(() => {
        screen.getByText(/open docs/i)
      }).to.throw;
    });
  });

  context('when operator is defined', function () {
    beforeEach(function () {
      renderFocusModeStageEditor({
        index: 0, operator: '$limit'
      });
    });

    it.skip('renders stage dropdown', function () {
      const dropdown = screen.getByTestId('stage-operator-combobox');
      expect(dropdown).to.exist;
    });

    it('renders docs link', function () {
      expect(screen.getByText(/open docs/i)).to.exist;
    });
  });
});