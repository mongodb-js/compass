import React, { useCallback, useMemo } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Icon, Link } from '../leafygreen';
import { documentTypography } from './typography';

const container = css({
  display: 'flex',
  gap: spacing[2],
  paddingTop: spacing[3],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
});

const linkButtonStyles = css({
  border: 'none',
  background: 'none',
  padding: 0,
  fontFamily: documentTypography.fontFamily,
  fontSize: `${documentTypography.fontSize}px`,
  lineHeight: `${documentTypography.lineHeight}px`,
  '& > span': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[100],
  },
});

const VisibleFieldsToggle: React.FunctionComponent<{
  showHideButton?: boolean;
  buttonClassName?: string;
  parentFieldName?: string;
  currentSize: number;
  totalSize: number;
  minSize?: number;
  step?: number;
  style?: React.CSSProperties;
  onSizeChange(newSize: number): void;
}> = ({
  showHideButton = true,
  buttonClassName,
  parentFieldName,
  currentSize,
  totalSize,
  minSize = 25,
  step = 1000,
  style,
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

  const showButtonText = `Show ${showSizeDiff} more ${
    showSizeDiff === 1 ? 'field' : 'fields'
  }${parentFieldName ? ` in ${parentFieldName}` : ''}`;
  const hideButtonText = `Hide ${hideSizeDiff} ${
    hideSizeDiff === 1 ? 'field' : 'fields'
  }${parentFieldName ? ` in ${parentFieldName}` : ''}`;

  return (
    <div className={container} style={style}>
      {isShowButtonVisible && (
        <Link
          as="button"
          hideExternalIcon={true}
          className={cx(linkButtonStyles, buttonClassName)}
          onClick={onShowClick}
          aria-label={showButtonText}
        >
          <Icon size="xsmall" glyph="ArrowDown"></Icon>
          {showButtonText}
        </Link>
      )}
      {isHideButtonVisible && (
        <Link
          as="button"
          hideExternalIcon={true}
          className={cx(linkButtonStyles, buttonClassName)}
          onClick={onHideClick}
          aria-label={hideButtonText}
        >
          <Icon size="xsmall" glyph="ArrowUp"></Icon>
          {hideButtonText}
        </Link>
      )}
    </div>
  );
};

export default VisibleFieldsToggle;
