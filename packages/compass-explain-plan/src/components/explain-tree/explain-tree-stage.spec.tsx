import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import {
  ExplainTreeStage,
  milliSecondsToNormalisedValue,
  trimInMiddle,
} from './explain-tree-stage';

describe('ExplainTreeStage', function () {
  describe('ExplainStage [Component]', function () {
    let component: ReturnType<typeof render>;
    const name = '';
    const nReturned = 1;
    const highlights = {};
    const curStageExecTimeMS = 2;
    const prevStageExecTimeMS = 1;
    const totalExecTimeMS = 3;
    const isShard = false;
    const details = {};

    beforeEach(function () {
      component = render(
        <ExplainTreeStage
          name={name}
          nReturned={nReturned}
          highlights={highlights}
          curStageExecTimeMS={curStageExecTimeMS}
          prevStageExecTimeMS={prevStageExecTimeMS}
          totalExecTimeMS={totalExecTimeMS}
          isShard={isShard}
          details={details}
          onToggleDetailsClick={() => {}}
          detailsOpen={false}
        />
      );
    });

    afterEach(cleanup);

    it('renders', function () {
      expect(component.getByTestId('explain-stage')).to.exist;
    });
  });

  describe('Helpers', function () {
    describe('trimInMiddle', function () {
      it('will not trim the text if the text length is less than provided threshold', function () {
        expect(trimInMiddle('Compass', 10)).to.equal('Compass');
      });

      context(
        'when text length is more than the provided threshold',
        function () {
          it('will trim text and keep only the specified number of chars in front and in back', function () {
            const trimmedValue = trimInMiddle(
              'Devtools Product - Compass',
              10,
              5,
              5
            );
            expect(trimmedValue).to.equal('Devto…mpass');
          });

          it('will trim the text, while making sure that the chars that are already at front do not come at the back of ellipsis', function () {
            const trimmedValue = trimInMiddle('Devtools', 5, 5, 5);
            expect(trimmedValue).to.equal('Devto…ols');
          });
        }
      );
    });

    describe('milliSecondsToNormalisedValue', function () {
      it('returns the ms values itself when the value is less than a second', function () {
        expect(milliSecondsToNormalisedValue(975)).to.deep.equal({
          value: '975',
          unit: 'ms',
        });
      });

      it('correctly normalises a seconds equivalent value', function () {
        expect(milliSecondsToNormalisedValue(1000)).to.deep.equal({
          value: '1',
          unit: 's',
        });

        expect(milliSecondsToNormalisedValue(1500)).to.deep.equal({
          value: '1.5',
          unit: 's',
        });
      });

      it('correctly normalises a minutes equivalent value', function () {
        expect(milliSecondsToNormalisedValue(60 * 1000)).to.deep.equal({
          value: '1',
          unit: 'min',
        });

        expect(milliSecondsToNormalisedValue(90 * 1000)).to.deep.equal({
          value: '1.5',
          unit: 'min',
        });

        // Below cases are for rounded values
        expect(milliSecondsToNormalisedValue(134 * 1000)).to.deep.equal({
          value: '2.2',
          unit: 'min',
        });

        expect(milliSecondsToNormalisedValue(135 * 1000)).to.deep.equal({
          value: '2.3',
          unit: 'min',
        });
      });

      it('correctly normalises an hour equivalent value', function () {
        expect(milliSecondsToNormalisedValue(60 * 60 * 1000)).to.deep.equal({
          value: '1',
          unit: 'h',
        });

        expect(
          milliSecondsToNormalisedValue(1.5 * 60 * 60 * 1000)
        ).to.deep.equal({ value: '1.5', unit: 'h' });
      });
    });
  });
});
