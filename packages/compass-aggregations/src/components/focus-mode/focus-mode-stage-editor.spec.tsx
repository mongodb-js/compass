import React from 'react';
import type { ComponentProps } from 'react';
import { screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { renderWithStore } from '../../../test/configure-store';
import { FocusModeStageEditor } from './focus-mode-stage-editor';

const renderFocusModeStageEditor = (
  props: Partial<ComponentProps<typeof FocusModeStageEditor>> = {}
) => {
  return renderWithStore(
    <FocusModeStageEditor index={-1} operator={null} {...props} />,
    {
      pipeline: [{ $match: { _id: 1 } }, { $limit: 10 }, { $out: 'out' }],
    }
  );
};

describe('FocusMode', function () {
  it('does not render editor when stage index is -1', async function () {
    await renderFocusModeStageEditor({ index: -1 });
    expect(() => {
      screen.getByTestId('stage-operator-combobox');
    }).to.throw();
    expect(() => {
      screen.getByText(/open docs/i);
    }).to.throw();
  });

  context('when operator is not defined', function () {
    beforeEach(async function () {
      await renderFocusModeStageEditor({
        index: 0,
        operator: null,
      });
    });

    it('renders stage dropdown', function () {
      const dropdown = screen.getByTestId('stage-operator-combobox');
      expect(dropdown).to.exist;
    });

    it('does not render docs link', function () {
      expect(() => {
        screen.getByText(/open docs/i);
      }).to.throw();
    });
  });

  context('when operator is defined', function () {
    beforeEach(async function () {
      await renderFocusModeStageEditor({
        index: 0,
        operator: '$limit',
      });
    });

    it('renders stage dropdown', function () {
      const dropdown = screen.getByTestId('stage-operator-combobox');
      expect(dropdown).to.exist;
    });

    it('renders docs link', function () {
      expect(screen.getByText(/open docs/i)).to.exist;
    });
  });
});
