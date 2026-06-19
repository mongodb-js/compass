import React from 'react';
import { css, palette, useDarkMode } from '@mongodb-js/compass-components';

const gutterColumnStyles = (backgroundColor: string, borderColor: string) =>
  css({
    flex: 'none',
    flexShrink: 0,
    alignSelf: 'stretch',
    backgroundColor,
    borderRight: `1px solid ${borderColor}`,
  });

type StickyPreviewGutterProps = {
  children: React.ReactNode;
};

/**
 * Left column behind the document actions gutter in aggregation previews (dark/light).
 */
export function StickyPreviewGutter({ children }: StickyPreviewGutterProps) {
  const darkMode = useDarkMode();
  const background = darkMode ? palette.black : palette.white;
  const borderColor = darkMode ? palette.gray.dark2 : palette.gray.light2;
  return (
    <div
      className={gutterColumnStyles(background, borderColor)}
      data-testid="readonly-document-sticky-gutter"
    >
      {children}
    </div>
  );
}
