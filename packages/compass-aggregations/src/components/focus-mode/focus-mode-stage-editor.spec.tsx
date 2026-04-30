import React from 'react';
import type { ComponentProps } from 'react';
import { screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { renderWithStore } from '../../../test/configure-store';
import { FocusModeStageEditor } from './focus-mode-stage-editor';

const renderFocusModeStageEditor = (
  props: Partial<ComponentProps<typeof FocusModeStageEditor>> = {},
  services: any = {}
) => {
  return renderWithStore(
    <FocusModeStageEditor
      index={-1}
      operator={null}
      autoPreview={false}
      {...props}
    />,
    {
      pipeline: [{ $match: { _id: 1 } }, { $limit: 10 }, { $out: 'out' }],
    },
    undefined,
    services
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
        'https://www.mongodb.com/docs/manual/core/aggregation-pipeline/'
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

  context('$rerank tokens banner', function () {
    afterEach(function () {
      localStorage.removeItem('mongodb_compass_dismissed_rerank_tokens_banner');
    });

    it('shows the tokens banner when operator is $rerank and autoPreview is true', async function () {
      await renderFocusModeStageEditor(
        { index: 0, operator: '$rerank', autoPreview: true },
        {
          preferences: {
            getPreferences() {
              return { enableRerank: true };
            },
          },
        }
      );
      expect(screen.getByTestId('focus-mode-rerank-tokens-banner')).to.exist;
    });

    it('does not show the tokens banner when autoPreview is false', async function () {
      await renderFocusModeStageEditor(
        { index: 0, operator: '$rerank', autoPreview: false },
        {
          preferences: {
            getPreferences() {
              return { enableRerank: true };
            },
          },
        }
      );
      expect(
        screen.queryByTestId('focus-mode-rerank-tokens-banner')
      ).to.not.exist;
    });

    it('does not show the tokens banner for non-$rerank operators', async function () {
      await renderFocusModeStageEditor(
        { index: 0, operator: '$match', autoPreview: true },
        {
          preferences: {
            getPreferences() {
              return { enableRerank: true };
            },
          },
        }
      );
      expect(
        screen.queryByTestId('focus-mode-rerank-tokens-banner')
      ).to.not.exist;
    });
  });
});
