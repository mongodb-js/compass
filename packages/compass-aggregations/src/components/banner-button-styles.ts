import { css } from '@mongodb-js/compass-components';

// Shared styling for action buttons rendered inside banners. Keeps the label
// contained on a single line within the button. Buttons use `onClick` (not an
// `href`) so they render as `<button>` and don't pick up the underline the
// Banner applies to descendant anchors.
export const bannerButtonStyles = css({
  flexShrink: 0,
  whiteSpace: 'nowrap',
});
