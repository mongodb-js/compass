import React, { forwardRef } from 'react';
import { spacing, transitionDuration } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { transparentize } from 'polished';
import { useDarkMode } from '../hooks/use-theme';
import { useFocusRing } from '../hooks/use-focus-ring';
import { mergeProps } from '../utils/merge-props';

const containerStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: spacing[2],
  transition: `${transitionDuration.default}ms ease-in-out`,
  transitionProperty: `border, box-shadow`,
});

const keylineLightThemeStyles = css({
  background: palette.white,
});
const keylineDarkThemeStyles = css({
  background: palette.black,
  borderColor: palette.gray.dark2,
});

const lightBaseBoxShadow = `0 4px 10px -4px ${transparentize(
  0.7,
  palette.black
)}`;

const darkBaseBoxShadow = `0 4px 20px -4px ${palette.black}`;

const lightHoverBoxShadow = `0 4px 20px -4px ${transparentize(
  0.8,
  palette.black
)}`;

const darkHoverBoxShadow = `0 4px 20px -4px ${transparentize(
  0.3,
  palette.black
)}`;

const clickableStyleLight = css({
  cursor: 'pointer',
  boxShadow: lightBaseBoxShadow,
  '&:hover': {
    border: `1px solid ${palette.gray.light2}`,
    boxShadow: lightHoverBoxShadow,
  },

  '&:active': {
    boxShadow: 'none',
  },
});

const clickableStyleDark = css({
  cursor: 'pointer',
  boxShadow: darkBaseBoxShadow,
  '&:hover': {
    boxShadow: darkHoverBoxShadow,
  },
});

const KeylineCard = forwardRef(function KeylineCard(
  {
    className,
    contentStyle,
    ...props
  }: React.HTMLProps<HTMLDivElement> & {
    /**
     * Set the content style of the card (matches the interface of LeafyGreen cards).
     *
     * With `contentStyle="clickable"` the look and feel of the KeylineCard will resemble
     * that of a button. Additionally, consistent focus ring handling and accessibility properties
     * are added to the container.
     */
    contentStyle?: 'clickable' | 'none';
  },
  ref: React.ForwardedRef<HTMLDivElement>
): React.ReactElement {
  const darkMode = useDarkMode();
  const focusRingProps = useFocusRing();

  const allProps = mergeProps(
    contentStyle === 'clickable'
      ? { role: 'button', tabIndex: 0, ...focusRingProps }
      : {},
    {
      className: cx(
        containerStyles,
        darkMode ? keylineDarkThemeStyles : keylineLightThemeStyles,
        contentStyle === 'clickable' &&
          (darkMode ? clickableStyleDark : clickableStyleLight),
        className
      ),
    },
    props
  );

  return <div ref={ref} {...allProps}></div>;
});

export { KeylineCard };
