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
    expect(screen.queryByTestId('stage-operator-combobox')).to.not.exist;
    expect(screen.queryByText(/open docs/i)).to.not.exist;
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

    it('renders docs link', function () {
      const element = screen.getByText(/open docs/i);

      expect(element.closest('a')).to.have.attribute(
        'href',
        'https://www.mongodb.com/docs/manual/reference/mql/aggregation-stages/'
      );
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
      const element = screen.getByText(/open docs/i);

      expect(element.closest('a')).to.have.attribute(
        'href',
        'https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/'
      );
    });
  });
});
