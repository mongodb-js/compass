import { spacing } from '@mongodb-js/compass-components';
import type { NodeField } from '../utils/types';
import {
  ENTITY_CARD_HEADER_HEIGHT,
  ENTITY_CARD_ROW_HEIGHT,
  ENTITY_CARD_WIDTH,
  ENTITY_SINGLE_ICON_WIDTH,
} from '../utils/utils';

export const getHasPreviewIcon = (fields: Array<NodeField>) =>
  fields.some(
    ({ type, glyphs }) => type === 'Preview' && glyphs?.includes('Link')
  );

export const getTopPreviewPosition = (fields: Array<NodeField>) =>
  fields.findIndex(
    ({ type, glyphs }) => type === 'Preview' && !glyphs?.includes('Link')
  );

export const getBottomPreviewPosition = (fields: Array<NodeField>) =>
  fields
    .map(({ type, glyphs }) => type === 'Preview' && !glyphs?.includes('Key'))
    .lastIndexOf(true);

// Header height 28px + Padding Top 8px + Number of Rows down multiplied by ROW_HEIGHT
export const getTopPosition = (topPreviewPosition: number) =>
  ENTITY_CARD_HEADER_HEIGHT +
  spacing[2] +
  topPreviewPosition * ENTITY_CARD_ROW_HEIGHT;

export const getPreviewHeight = (rowCount: number) =>
  rowCount * ENTITY_CARD_ROW_HEIGHT + spacing[1];

export const getLeftPosition = (hasIcon: boolean, minDepth: number) => {
  if (hasIcon) return spacing[2];
  // Width of Icon + padding
  return ENTITY_SINGLE_ICON_WIDTH + spacing[2] + minDepth * spacing[2];
};

export const getPreviewWidth = (hasIcon: boolean, minDepth: number) => {
  // Entity card width 244 - Padding of entity card - Padding Right of Entity Card Body
  const widthWithIcon = ENTITY_CARD_WIDTH - spacing[2] - spacing[2];
  if (hasIcon) return widthWithIcon;

  // widthWithIcon - width of icon
  const widthWithoutIcon = widthWithIcon - ENTITY_SINGLE_ICON_WIDTH;
  return widthWithoutIcon - minDepth * spacing[2];
};

/**
 * Returns the left, top, height and width for element to be overlaid onto of entity to card to represent preview
 * @param fields
 */
export const getPreviewStyle = (fields: Array<NodeField>) => {
  const hasIcon = getHasPreviewIcon(fields);

  const topPreviewPosition = getTopPreviewPosition(fields);

  const bottomPreviewPosition = getBottomPreviewPosition(fields);

  if (topPreviewPosition < 0 || bottomPreviewPosition < 0) return null;

  const rowCount = bottomPreviewPosition - topPreviewPosition + 1;

  const minDepth = fields[topPreviewPosition].depth ?? 0;

  return {
    left: `${getLeftPosition(hasIcon, minDepth)}px`,
    top: `${getTopPosition(topPreviewPosition) + 10}px`,
    height: `${getPreviewHeight(rowCount)}px`,
    width: `${getPreviewWidth(hasIcon, minDepth)}px`,
  };
};

export const getIsEntireCollectionPreview = (fields: Array<NodeField>) =>
  fields.length > 0 && fields.every(({ type }) => type === 'Preview');
