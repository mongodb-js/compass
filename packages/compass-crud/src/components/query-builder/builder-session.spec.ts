import { expect } from 'chai';
import {
  MAX_BUILDER_WIDTH,
  MIN_BUILDER_WIDTH,
  clearAllBuilderState,
  loadBuilderState,
  mirrorBuilderWidth,
  saveBuilderState,
} from './builder-session';
import { EMPTY_BUILDER_STATE } from './builder-query';

describe('builder-session', function () {
  describe('mirrorBuilderWidth', function () {
    it('maps each end of the range to the other', function () {
      expect(mirrorBuilderWidth(MIN_BUILDER_WIDTH)).to.equal(MAX_BUILDER_WIDTH);
      expect(mirrorBuilderWidth(MAX_BUILDER_WIDTH)).to.equal(MIN_BUILDER_WIDTH);
    });

    it('is its own inverse, so it converts both ways', function () {
      for (const width of [280, 300, 460, 700, 900]) {
        expect(mirrorBuilderWidth(mirrorBuilderWidth(width))).to.equal(width);
      }
    });

    it('keeps mirrored values inside the range', function () {
      for (const width of [280, 460, 900]) {
        const mirrored = mirrorBuilderWidth(width);
        expect(mirrored).to.be.at.least(MIN_BUILDER_WIDTH);
        expect(mirrored).to.be.at.most(MAX_BUILDER_WIDTH);
      }
    });

    // The panel used to stick at both ends. These reproduce a drag at each
    // extreme, including the handle's own clamping, and check it can move back.
    it('can be dragged wider when already at the minimum', function () {
      const width = MIN_BUILDER_WIDTH;
      const handleValue = mirrorBuilderWidth(width);
      // Dragging left is negative pointer movement; the handle clamps its own
      // value to the range before reporting it.
      const reported = Math.min(
        MAX_BUILDER_WIDTH,
        Math.max(MIN_BUILDER_WIDTH, handleValue - 20)
      );
      expect(mirrorBuilderWidth(reported)).to.equal(MIN_BUILDER_WIDTH + 20);
    });

    it('can be dragged narrower when already at the maximum', function () {
      const width = MAX_BUILDER_WIDTH;
      const handleValue = mirrorBuilderWidth(width);
      const reported = Math.min(
        MAX_BUILDER_WIDTH,
        Math.max(MIN_BUILDER_WIDTH, handleValue + 20)
      );
      expect(mirrorBuilderWidth(reported)).to.equal(MAX_BUILDER_WIDTH - 20);
    });
  });

  describe('per collection builder state', function () {
    beforeEach(function () {
      clearAllBuilderState();
    });

    it('has nothing for a collection that was never opened', function () {
      expect(loadBuilderState('shop.orders')).to.equal(undefined);
    });

    it('gives a collection its own rows back', function () {
      const state = {
        ...EMPTY_BUILDER_STATE,
        conditions: [
          {
            id: 'c1',
            field: 'status',
            operator: 'eq' as const,
            valueText: "'shipped'",
            enabled: true,
          },
        ],
      };

      saveBuilderState('shop.orders', state);

      expect(loadBuilderState('shop.orders')?.conditions).to.have.lengthOf(1);
    });

    it('keeps collections apart', function () {
      saveBuilderState('shop.orders', {
        ...EMPTY_BUILDER_STATE,
        skip: '10',
      });
      saveBuilderState('shop.customers', {
        ...EMPTY_BUILDER_STATE,
        skip: '99',
      });

      expect(loadBuilderState('shop.orders')?.skip).to.equal('10');
      expect(loadBuilderState('shop.customers')?.skip).to.equal('99');
    });

    it('replaces the rows for a collection when they change', function () {
      saveBuilderState('shop.orders', { ...EMPTY_BUILDER_STATE, limit: '25' });
      saveBuilderState('shop.orders', { ...EMPTY_BUILDER_STATE, limit: '50' });

      expect(loadBuilderState('shop.orders')?.limit).to.equal('50');
    });
  });
});
