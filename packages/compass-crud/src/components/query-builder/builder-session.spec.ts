import { expect } from 'chai';
import {
  MAX_BUILDER_WIDTH,
  MIN_BUILDER_WIDTH,
  clearAllBuilderState,
  loadBuilderSession,
  mirrorBuilderWidth,
  saveBuilderSession,
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

  describe('per collection panel session', function () {
    const panel = (over = {}) => ({
      state: EMPTY_BUILDER_STATE,
      isExpanded: false,
      width: 460,
      ...over,
    });

    beforeEach(function () {
      clearAllBuilderState();
    });

    it('has nothing for a collection that was never opened', function () {
      // Which is what keeps the panel collapsed the first time.
      expect(loadBuilderSession('shop.orders')).to.equal(undefined);
    });

    it('gives a collection its own rows back', function () {
      saveBuilderSession(
        'shop.orders',
        panel({
          state: {
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
          },
        })
      );

      expect(
        loadBuilderSession('shop.orders')?.state.conditions
      ).to.have.lengthOf(1);
    });

    it('remembers that the panel was left open', function () {
      saveBuilderSession('shop.orders', panel({ isExpanded: true }));
      expect(loadBuilderSession('shop.orders')?.isExpanded).to.equal(true);
    });

    it('remembers how wide the panel was', function () {
      saveBuilderSession('shop.orders', panel({ width: 720 }));
      expect(loadBuilderSession('shop.orders')?.width).to.equal(720);
    });

    it('keeps collections apart, including whether each was open', function () {
      saveBuilderSession('shop.orders', panel({ isExpanded: true, width: 700 }));
      saveBuilderSession('shop.customers', panel({ isExpanded: false }));

      expect(loadBuilderSession('shop.orders')?.isExpanded).to.equal(true);
      expect(loadBuilderSession('shop.orders')?.width).to.equal(700);
      expect(loadBuilderSession('shop.customers')?.isExpanded).to.equal(false);
    });

    it('replaces what it holds for a collection when it changes', function () {
      saveBuilderSession('shop.orders', panel({ isExpanded: true }));
      saveBuilderSession('shop.orders', panel({ isExpanded: false }));

      expect(loadBuilderSession('shop.orders')?.isExpanded).to.equal(false);
    });
  });
});
