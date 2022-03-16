import React, { useCallback, useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Button, Icon } from '../leafygreen';

const container = css({
  display: 'flex',
  gap: spacing[2],
  paddingTop: spacing[3],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
});

const button = css({
  flex: 'none',
});

const DocumentFieldsToggleGroup: React.FunctionComponent<{
  showHideButton?: boolean;
  currentSize: number;
  totalSize: number;
  minSize?: number;
  step?: number;
  onSizeChange(newSize: number): void;
}> = ({
  showHideButton = true,
  currentSize,
  totalSize,
  minSize = 25,
  step = 1000,
  onSizeChange,
}) => {
  const showSizeDiff = useMemo(() => {
    return Math.min(totalSize - currentSize, step);
  }, [currentSize, step, totalSize]);

  const hideSizeDiff = useMemo(() => {
    return Math.max(currentSize - minSize, 0);
  }, [currentSize, minSize]);

  const isShowButtonVisible = useMemo(() => {
    return showSizeDiff > 0;
  }, [showSizeDiff]);

  const isHideButtonVisible = useMemo(() => {
    return showHideButton && hideSizeDiff > 0;
  }, [hideSizeDiff, showHideButton]);

  const onShowClick = useCallback(() => {
    onSizeChange(currentSize + showSizeDiff);
  }, [currentSize, onSizeChange, showSizeDiff]);

  const onHideClick = useCallback(() => {
    onSizeChange(currentSize - hideSizeDiff);
  }, [currentSize, hideSizeDiff, onSizeChange]);

  if (!isShowButtonVisible && !isHideButtonVisible) {
    return null;
  }

  return (
    <div className={container}>
      {isShowButtonVisible && (
        <Button
          size="xsmall"
          leftGlyph={<Icon glyph="ArrowDown"></Icon>}
          onClick={onShowClick}
          className={button}
          data-testid="show-more-fields-button"
        >
          Show {showSizeDiff} more fields
        </Button>
      )}
      {isHideButtonVisible && (
        <Button
          size="xsmall"
          leftGlyph={<Icon glyph="ArrowUp"></Icon>}
          onClick={onHideClick}
          className={button}
          data-testid="hide-fields-button"
        >
          Hide {hideSizeDiff} fields
        </Button>
      )}
    </div>
  );
};

export default DocumentFieldsToggleGroup;
