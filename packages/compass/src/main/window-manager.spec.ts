import { expect } from 'chai';
import Sinon from 'sinon';
import { screen as electronScreen } from 'electron';
import { isOnScreen } from './window-manager';

function makeDisplay(x: number, y: number, width: number, height: number) {
  return { workArea: { x, y, width, height } };
}

describe('window-manager', function () {
  let sandbox: Sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('isOnScreen', function () {
    it('returns true when the window is fully within the primary display', function () {
      sandbox
        .stub(electronScreen, 'getAllDisplays')
        .returns([makeDisplay(0, 0, 1920, 1080)] as any);

      expect(isOnScreen({ x: 100, y: 100, width: 1200, height: 800 })).to.be
        .true;
    });

    it('returns false when the window is entirely off the right edge (secondary monitor gone)', function () {
      sandbox
        .stub(electronScreen, 'getAllDisplays')
        .returns([makeDisplay(0, 0, 1920, 1080)] as any);

      expect(isOnScreen({ x: 3000, y: 200, width: 1200, height: 800 })).to.be
        .false;
    });

    it('returns false when the window is above the top edge', function () {
      sandbox
        .stub(electronScreen, 'getAllDisplays')
        .returns([makeDisplay(0, 0, 1920, 1080)] as any);

      expect(isOnScreen({ x: 100, y: -900, width: 1200, height: 800 })).to.be
        .false;
    });

    it('returns true when the window is on a still-connected secondary display', function () {
      sandbox
        .stub(electronScreen, 'getAllDisplays')
        .returns([
          makeDisplay(0, 0, 1920, 1080),
          makeDisplay(1920, 0, 2560, 1440),
        ] as any);

      expect(isOnScreen({ x: 2000, y: 100, width: 1200, height: 800 })).to.be
        .true;
    });

    it('returns false when less than 100px of the window is visible on the right edge of a single display', function () {
      sandbox
        .stub(electronScreen, 'getAllDisplays')
        .returns([makeDisplay(0, 0, 1920, 1080)] as any);

      // Window starts at x=1870, only 50px overlap with the 1920-wide display
      expect(isOnScreen({ x: 1870, y: 100, width: 1200, height: 800 })).to.be
        .false;
    });

    it('returns false when the window straddles two displays with less than 100px visible on each', function () {
      sandbox
        .stub(electronScreen, 'getAllDisplays')
        .returns([
          makeDisplay(0, 0, 1920, 1080),
          makeDisplay(1920, 0, 1920, 1080),
        ] as any);

      // Window is 100px wide centered on the boundary: 50px on each display
      expect(isOnScreen({ x: 1870, y: 100, width: 100, height: 800 })).to.be
        .false;
    });

    it('returns true when exactly 100px of the window overlaps a display', function () {
      sandbox
        .stub(electronScreen, 'getAllDisplays')
        .returns([makeDisplay(0, 0, 1920, 1080)] as any);

      // Left edge at x=1820, so exactly 100px overlap — should pass
      expect(isOnScreen({ x: 1820, y: 100, width: 1200, height: 800 })).to.be
        .true;
    });
  });
});
