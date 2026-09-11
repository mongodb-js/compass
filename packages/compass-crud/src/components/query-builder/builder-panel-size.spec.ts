import { expect } from 'chai';
import {
  MAX_BUILDER_WIDTH,
  MIN_BUILDER_WIDTH,
  mirrorBuilderWidth,
} from './builder-panel-size';

describe('builder-panel-size', function () {
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
});
