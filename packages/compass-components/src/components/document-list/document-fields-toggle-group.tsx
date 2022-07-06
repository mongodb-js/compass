import React, { useCallback, useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { fontFamilies, spacing } from '@leafygreen-ui/tokens';
import { Link } from '../leafygreen';

const container = css({
  display: 'flex',
  gap: spacing[2],
  paddingTop: spacing[2],
  paddingLeft: 16 * 3 + 8 + 4 + 8
});

const button = css({
  display: 'block',
  background: 'none',
  border: 'none',
  fontFamily: fontFamilies.code,
  fontSize: '12px',
  lineHeight: `${spacing[3]}px`,
  flex: 'none',
  padding: 0,
  margin: 0
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
  step = 10,
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
        <Link
          as="button"
          hideExternalIcon={true}
          onClick={onShowClick}
          className={button}
          data-testid="show-more-fields-button"
        >
          Show {showSizeDiff} more fields
        </Link>
      )}
      {isHideButtonVisible && (
        <Link
          as="button"
          hideExternalIcon={true}
          onClick={onHideClick}
          className={button}
          data-testid="hide-fields-button"
        >
          Hide {hideSizeDiff} fields
        </Link>
      )}
    </div>
  );
};

export default DocumentFieldsToggleGroup;
