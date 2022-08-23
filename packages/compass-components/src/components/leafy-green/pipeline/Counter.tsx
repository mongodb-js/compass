/* eslint-disable filename-rules/match */

import type { ReactElement, ReactNode, Ref } from 'react';
import React, { forwardRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';

import {
  getRootStyle,
  getChildStyle,
  getChevronStyle,
  Size,
  layout,
  colors,
  counterAttr,
  counterChevronAttr,
} from './styles';

interface StateForStyles {
  size?: Size;
}

interface CounterProps {
  /**
   * Content that will appear inside of the Counter component.
   */
  children?: ReactNode;

  /**
   * Classname applied to Counter content container.
   **/
  className?: string;

  /**
   * Alter the rendered size of the component. Inherited from the parent Pipeline component.
   */
  size: Size;
}

const getBaseStyle = ({ size = Size.XSmall }: StateForStyles): string => {
  const { chevron, fontSize, fontWeight, gutter, height, lineHeight } =
    layout[size];

  const { color, secondary } = colors;
  const outerSize = height / 2;
  const offset = outerSize + chevron.size * 2;

  return cx(
    getRootStyle({ size }),
    getChildStyle({ size }),
    css`
      background-color: ${secondary.backgroundColor};
      color: ${color};
      padding: ${gutter.vertical}px ${gutter.horizontal}px;
      margin-right: ${offset}px;
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      line-height: ${lineHeight};
      flex: 1 1 auto;
      white-space: nowrap;
      z-index: 2;

      &::before {
        white-space: nowrap;
        content: '+' counter(hiddenCount);
      }
    `
  );
};

const getCounterChevronStyle = ({
  size = Size.XSmall,
}: StateForStyles): string => {
  const { chevron, height } = layout[size];
  const { secondary } = colors;
  const outerSize = height / 2;

  return cx(
    getChevronStyle({ size }),
    css`
      &::before {
        background-color: ${secondary.backgroundColor};
        box-shadow: 0 0 0 ${chevron.size}px transparent,
          0 0 0 ${outerSize}px transparent;
      }
    `
  );
};

const getStatefulStyles = (state: StateForStyles) => ({
  base: getBaseStyle(state),
  chevron: getCounterChevronStyle(state),
});

/**
 * # Counter
 *
 * React Component to render the counter for the number of hidden stages in the Pipeline component.
 *
 * ```
 * <Counter />
 * ```
 * @param props.className Classname applied to Counter content container.
 */
const Counter = forwardRef(
  (
    { className = '', children, size, ...rest }: CounterProps,
    ref: Ref<HTMLDivElement>
  ): ReactElement => {
    const { base: baseStyle, chevron: chevronStyle } = getStatefulStyles({
      size,
    });

    return (
      <div
        {...rest}
        {...counterAttr.prop}
        data-testid="pipeline-counter"
        className={cx(baseStyle, className)}
        ref={ref}
      >
        {/* Children will be the tooltip provided by the Pipeline component */}
        {children}

        <div
          {...counterChevronAttr.prop}
          data-testid="pipeline-counter-chevron"
          className={chevronStyle}
        />
      </div>
    );
  }
);

Counter.displayName = 'Counter';

export default Counter;
