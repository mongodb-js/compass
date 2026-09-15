import type { CompassBrowser } from '../compass-browser.ts';

export async function hover(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  const element = browser.$(selector);

  // Chromium only recomputes :hover when the pointer actually moves. React can
  // replace the element under a stationary pointer, which drops the hover state
  // with no further mouse event to restore it -- so hover-revealed controls
  // (connection actions, workspace tab close buttons) stay hidden and a plain
  // repeat of moveTo() is a no-op because the pointer is already there. Nudge
  // the pointer first so the move back forces a recompute.
  await element.moveTo({ xOffset: 2, yOffset: 2 });
  await element.moveTo();
}
