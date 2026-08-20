import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import type { TypeCastMap } from 'hadron-type-checker';
import { BSON_TYPE_LABEL, useBsonThemeStyles } from '../bson-utils';

const containerStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  maxWidth: '100%',
});

const labelStyles = css({
  userSelect: 'none',
  whiteSpace: 'nowrap',
});

export function EditorWithLabel({
  type,
  children,
}: {
  type: keyof TypeCastMap;
  children: React.ReactNode;
}) {
  const label = BSON_TYPE_LABEL[type];
  const bsonStyles = useBsonThemeStyles(type);
  return (
    <div className={containerStyles} style={bsonStyles}>
      {label && <span className={labelStyles}>{label}(&apos;</span>}
      {children}
      {label && <span className={labelStyles}>&apos;)</span>}
    </div>
  );
}
