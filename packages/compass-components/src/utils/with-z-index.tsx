import type { ComponentType } from 'react';
import React from 'react';
import { cx, css } from '@leafygreen-ui/emotion';

export const STACKED_ELEMENT_STYLES = css({
  zIndex: 1000,
});

export function withZIndex<P extends { className?: string }>(
  Component: ComponentType<P>
) {
  return function withZIndexWrapper(props: P) {
    return (
      <Component
        {...props}
        className={cx(props.className, STACKED_ELEMENT_STYLES)}
      />
    );
  };
}
