import React from 'react';
import { css } from '@leafygreen-ui/emotion';

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
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={containerStyles}>
      <span className={labelStyles}>{label}(&apos;</span>
      {children}
      <span className={labelStyles}>&apos;)</span>
    </div>
  );
}
