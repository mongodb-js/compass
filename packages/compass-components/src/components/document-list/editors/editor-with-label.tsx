import React, { useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';
import type { TypeCastMap } from 'hadron-type-checker';
import { VALUE_COLOR_BY_THEME_AND_TYPE } from '../../bson-value';
import { useDarkMode, Themes } from '../../../hooks/use-theme';
import { BSON_TYPE_LABEL } from '../bson-label';

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
  const darkMode = useDarkMode();
  const label = BSON_TYPE_LABEL[type];
  const colorStyle = useMemo(() => {
    return {
      color:
        VALUE_COLOR_BY_THEME_AND_TYPE[darkMode ? Themes.Dark : Themes.Light][
          type
        ],
    };
  }, [type, darkMode]);

  return (
    <div className={containerStyles} style={colorStyle}>
      {label && <span className={labelStyles}>{label}(&quot;</span>}
      {children}
      {label && <span className={labelStyles}>&quot;)</span>}
    </div>
  );
}
