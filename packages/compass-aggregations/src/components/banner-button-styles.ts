import { css } from '@mongodb-js/compass-components';

// Shared styling for action buttons rendered inside banners. Keeps the label
// contained on a single line within the button, and removes the underline that
// the Banner applies to descendant anchors (a Button with an `href` renders as
// an `<a>`). The `:any-link` selector is needed to outweigh the Banner's own
// `a` rule.
export const bannerButtonStyles = css({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  '&:any-link': {
    textDecorationLine: 'none',
  },
});
