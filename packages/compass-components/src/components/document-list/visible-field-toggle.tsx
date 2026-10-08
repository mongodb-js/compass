import React, { useCallback, useMemo } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Icon, Link } from '../leafygreen';
import { documentTypography } from './typography';
import { useTranslation } from '../../i18n';

const container = css({
  display: 'flex',
  gap: spacing[200],
  paddingTop: spacing[200],
  // Not a part of the document, keep it out of selectable/copied text.
  userSelect: 'none',
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
  const t = useTranslation();
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

  const showButtonText = parentFieldName
    ? showSizeDiff === 1
      ? t(
          'components.visibleFields.showMoreIn.one',
          'Show {count} more field in {parent}',
          { count: showSizeDiff, parent: parentFieldName }
        )
      : t(
          'components.visibleFields.showMoreIn.other',
          'Show {count} more fields in {parent}',
          { count: showSizeDiff, parent: parentFieldName }
        )
    : showSizeDiff === 1
      ? t('components.visibleFields.showMore.one', 'Show {count} more field', {
          count: showSizeDiff,
        })
      : t(
          'components.visibleFields.showMore.other',
          'Show {count} more fields',
          {
            count: showSizeDiff,
          }
        );
  const hideButtonText = parentFieldName
    ? hideSizeDiff === 1
      ? t(
          'components.visibleFields.hideIn.one',
          'Hide {count} field in {parent}',
          { count: hideSizeDiff, parent: parentFieldName }
        )
      : t(
          'components.visibleFields.hideIn.other',
          'Hide {count} fields in {parent}',
          { count: hideSizeDiff, parent: parentFieldName }
        )
    : hideSizeDiff === 1
      ? t('components.visibleFields.hide.one', 'Hide {count} field', {
          count: hideSizeDiff,
        })
      : t('components.visibleFields.hide.other', 'Hide {count} fields', {
          count: hideSizeDiff,
        });

  return (
    <div className={container} style={style}>
      {isShowButtonVisible && (
        <Link
          as="button"
          hideExternalIcon={true}
          className={cx(linkButtonStyles, buttonClassName)}
          onClick={onShowClick}
          aria-label={showButtonText}
          data-testid="show-more-fields-button"
        >
          <Icon size="small" glyph="CaretDown"></Icon>
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
          data-testid="hide-fields-button"
        >
          <Icon size="small" glyph="CaretUp"></Icon>
          {hideButtonText}
        </Link>
      )}
    </div>
  );
};

export default VisibleFieldsToggle;
