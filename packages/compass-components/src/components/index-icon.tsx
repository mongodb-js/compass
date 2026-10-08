import React from 'react';
import Icon from '@leafygreen-ui/icon';
import { useTranslation } from '../i18n';

type IndexDirection = unknown;

const IndexIcon = ({
  className,
  direction,
}: {
  className?: string;
  direction: IndexDirection;
}) => {
  const t = useTranslation();
  return direction === 1 ? (
    <Icon
      className={className}
      glyph="ArrowUp"
      size="small"
      aria-label={t('components.indexIcon.ascending', 'Ascending index')}
    />
  ) : direction === -1 ? (
    <Icon
      className={className}
      glyph="ArrowDown"
      size="small"
      aria-label={t('components.indexIcon.descending', 'Descending index')}
    />
  ) : (
    <span className={className}>({String(direction)})</span>
  );
};

export default IndexIcon;
