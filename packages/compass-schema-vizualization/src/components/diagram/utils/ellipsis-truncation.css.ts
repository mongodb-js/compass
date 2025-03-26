// import type { StyleRule } from '@vanilla-extract/css';
import { css } from '@mongodb-js/compass-components';

export const ellipsisTruncationRule = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const ellipsisTruncationStyle = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
export const startEllipsisTruncationStyle = css({
  direction: 'rtl',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const ellipsisTruncationTwoLinesRule = {
  display: '-webkit-box',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
};

export const ellipsisTruncationTwoLinesStyle = css({
  display: '-webkit-box',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
});
